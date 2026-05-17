import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { Client, IFrame, StompSubscription } from '@stomp/stompjs';

import { AuthService } from './auth.service';
import { ShopOwnerService } from './shop-owner.service';
import { environment } from '../../environments/environment';

/**
 * Loại notification được gửi qua chat-service /api/realtime/notify.
 * Đồng nhất với key `type` ở BE (RealtimeNotificationController).
 */
export type RealtimeNotificationType =
  | 'ORDER_CREATED'        // shop nhận: có đơn mới
  | 'ORDER_APPROVED'       // user nhận: đơn đã được duyệt
  | 'ORDER_STATUS_CHANGED' // shop nhận khi shop tự đổi trạng thái (refresh các tab khác)
  | string;

export interface RealtimeNotification {
  id: string;
  type: RealtimeNotificationType;
  timestamp: string;
  payload: Record<string, unknown>;
  read: boolean;
  /** TRUE nếu notify này tới qua queue cá nhân (user inbox). */
  forUser: boolean;
  /** TRUE nếu notify này tới qua topic shop. */
  forShop: boolean;
}

interface BackendEnvelope {
  type: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

/**
 * RealtimeNotificationService — STOMP client riêng (KHÔNG dùng chung với
 * `WebSocketService` của AI chat) để subscribe order events.
 *
 * Reason: WebSocketService hiện chỉ subscribe AI queues + giả định 1 connect/1
 * service. Tách riêng để không phá vỡ flow AI chat đang chạy.
 *
 * Backend STOMP destinations (chat-service):
 *  - /user/queue/order-events       — per-user inbox (notify ORDER_APPROVED…)
 *  - /topic/shop.{shopId}.orders    — broadcast cho shop dashboard
 */
@Injectable({ providedIn: 'root' })
export class RealtimeNotificationService {
  private auth = inject(AuthService);
  private shopOwnerService = inject(ShopOwnerService);
  private destroyRef = inject(DestroyRef);

  private client: Client | null = null;
  private userSub?: StompSubscription;
  private shopSub?: StompSubscription;

  /** State signals — UI có thể bind trực tiếp. */
  private _items = signal<RealtimeNotification[]>([]);
  items = this._items.asReadonly();

  unreadCount = computed(
    () => this._items().filter(n => !n.read).length
  );

  /** Latest unread notification — dùng để show toast 1 lần khi tới. */
  private _latestEvent = signal<RealtimeNotification | null>(null);
  latestEvent = this._latestEvent.asReadonly();

  connectionState = signal<'disconnected' | 'connecting' | 'connected' | 'error'>(
    'disconnected'
  );

  private reconnectAttempt = 0;
  private readonly MAX_RECONNECT = 5;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.disconnect());
  }

  /**
   * Connect STOMP. Idempotent: gọi nhiều lần không tạo nhiều connection.
   * Sau khi connect xong sẽ tự subscribe `/user/queue/order-events` và
   * (nếu user là shop owner) `/topic/shop.{shopId}.orders`.
   */
  connect(): void {
    if (this.client?.active) return;

    const token = this.auth.getCookie('ACCESS_TOKEN');
    if (!token) {
      console.warn('[RealtimeNotify] No token, skip connect');
      return;
    }

    this.connectionState.set('connecting');

    this.client = new Client({
      brokerURL: environment.wsUrl,
      connectHeaders: { Authorization: `Bearer ${token}` },
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      reconnectDelay: 0,
      debug: () => {},

      onConnect: () => {
        console.log('[RealtimeNotify] ✅ Connected');
        this.connectionState.set('connected');
        this.reconnectAttempt = 0;
        this.subscribeAll();
      },

      onStompError: (frame: IFrame) => {
        console.error('[RealtimeNotify] STOMP error', frame.headers['message']);
        this.connectionState.set('error');
        this.scheduleReconnect();
      },

      onWebSocketError: ev => {
        console.error('[RealtimeNotify] WS error', ev);
        this.connectionState.set('error');
        this.scheduleReconnect();
      },

      onWebSocketClose: ev => {
        if (ev.code !== 1000) {
          this.connectionState.set('disconnected');
          this.scheduleReconnect();
        } else {
          this.connectionState.set('disconnected');
        }
      }
    });

    this.client.activate();
  }

  /** Subscribe queue cá nhân + topic shop (nếu có). */
  private subscribeAll(): void {
    if (!this.client?.connected) return;

    // /user/queue/order-events — per-user inbox
    this.userSub = this.client.subscribe(
      '/user/queue/order-events',
      msg => this.handleIncoming(msg.body, true, false)
    );

    // /topic/shop.{shopId}.orders — chỉ subscribe nếu đăng nhập là shop owner
    const shopId = this.shopOwnerService.shop()?.shopId;
    if (shopId) {
      const topic = `/topic/shop.${shopId}.orders`;
      this.shopSub = this.client.subscribe(topic, msg =>
        this.handleIncoming(msg.body, false, true)
      );
      console.log('[RealtimeNotify] Subscribed shop topic:', topic);
    }
  }

  private handleIncoming(body: string, forUser: boolean, forShop: boolean): void {
    let parsed: BackendEnvelope;
    try {
      parsed = JSON.parse(body);
    } catch {
      console.warn('[RealtimeNotify] Cannot parse body', body);
      return;
    }

    const notif: RealtimeNotification = {
      id: this.makeId(),
      type: parsed.type ?? 'UNKNOWN',
      timestamp: parsed.timestamp ?? new Date().toISOString(),
      payload: parsed.payload ?? {},
      read: false,
      forUser,
      forShop
    };

    // Prepend lên đầu (newest first), giới hạn 50 bản ghi để khỏi phình bộ nhớ
    this._items.update(list => [notif, ...list].slice(0, 50));
    this._latestEvent.set(notif);
  }

  /** Đánh dấu đã đọc 1 hoặc tất cả notification. */
  markAsRead(id?: string): void {
    this._items.update(list =>
      list.map(n =>
        id === undefined || n.id === id ? { ...n, read: true } : n
      )
    );
  }

  /** Xoá toàn bộ notification trong panel. */
  clearAll(): void {
    this._items.set([]);
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempt = 0;
    try {
      this.userSub?.unsubscribe();
      this.shopSub?.unsubscribe();
    } catch {
      /* ignore */
    }
    this.userSub = undefined;
    this.shopSub = undefined;
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
    this.connectionState.set('disconnected');
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    if (this.reconnectAttempt >= this.MAX_RECONNECT) return;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempt), 16000);
    this.reconnectAttempt++;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.auth.isAuthenticated()) {
        this.connect();
      }
    }, delay);
  }

  private makeId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }
}

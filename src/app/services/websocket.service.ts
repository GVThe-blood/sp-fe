import { Injectable, signal, inject, DestroyRef, computed } from '@angular/core';
import { Client, IFrame } from '@stomp/stompjs';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export type { ChatMessage } from '../models/chat-message.model';

export interface AIMessageRequest {
  message: string;
  conversationId?: string;
}

export interface AIMessageResponse {
  conversationId: string;
  message: string;
  response: string;
  timestamp: string;
}

/**
 * Match BE `AIAssistantService.CardSearchResult`.
 */
export interface AIProductCard {
  id: string;
  name: string;
  price: number | string;
  image?: string;
  description?: string;
  averageRating?: number;
  shopName?: string;
}
export interface AIShopCard {
  id: string;
  name: string;
  logo?: string;
  introduction?: string;
  totalProducts?: number;
  totalSold?: number;
}
export interface AICardPayload {
  products?: AIProductCard[];
  shops?: AIShopCard[];
}

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * WebSocketService - Quản lý kết nối STOMP over WebSocket cho AI chat.
 *
 * Backend endpoints (chat-service):
 *   - WS handshake:        ws://<chat-host>/ws (native WebSocket)
 *   - App destination:     /app/ai-assistant/chat
 *   - User queues:         /user/queue/ai-assistant/{response,complete,error}
 *   - REST clear history:  DELETE /api/ai-assistant/history/{conversationId}
 *
 * Authentication: JWT được gửi qua STOMP CONNECT frame header `Authorization: Bearer <token>`,
 * WebSocketAuthInterceptor validate và set Principal cho session.
 */
@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private client: Client | null = null;
  private destroyRef = inject(DestroyRef);
  private authService = inject(AuthService);

  // Reactive state with signals (Angular 19 pattern)
  connectionState = signal<ConnectionState>('disconnected');
  isTyping = signal(false);

  // Object wrapper với timestamp để effect detect mọi emission (kể cả cùng giá trị)
  aiChunk = signal<{ value: string; ts: number }>({ value: '', ts: 0 });
  aiComplete = signal<{ value: string; ts: number }>({ value: '', ts: 0 });
  aiError = signal<{ value: string; ts: number }>({ value: '', ts: 0 });
  // Cards (product/shop) gửi từ BE sau khi stream text xong.
  // Match BE record `CardSearchResult { products: ProductCard[]; shops: ShopCard[] }`.
  aiCards = signal<{ value: AICardPayload | null; ts: number }>({ value: null, ts: 0 });

  /**
   * conversationId hiện tại. Format: `ai-{userId}-{suffix}`.
   * - `default` cho session đầu tiên
   * - timestamp khi user bấm "New conversation" → BE thấy conversationId chưa từng có,
   *   memory rỗng → coi như cuộc hội thoại mới mà không cần xóa lịch sử cũ.
   * Lưu sessionStorage để giữ qua reload trong cùng tab.
   */
  private _activeConversationId = signal<string | null>(null);
  activeConversationId = this._activeConversationId.asReadonly();

  // Computed signals
  isConnected = computed(() => this.connectionState() === 'connected');
  hasError = computed(() => this.connectionState() === 'error');

  // Reconnect tracking
  private reconnectAttempt = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.disconnect());
  }

  /**
   * Connect to WebSocket. Tự refresh token nếu sessionStorage trống.
   */
  async connect(): Promise<void> {
    // Nếu state nói đã connected nhưng client không active → force reconnect
    const state = this.connectionState();
    if (state === 'connected' && !this.client?.active) {
      console.warn('[WebSocket] State desync - force reconnect');
      this.connectionState.set('disconnected');
    }
    
    if (this.client?.active) {
      console.log('[WebSocket] Already active, skip connect');
      return;
    }

    let token = this.authService.getAccessToken();
    
    // Token không có (tab mới mở, sessionStorage trống) → thử refresh từ cookie
    if (!token && this.authService.isAuthenticated()) {
      console.log('[WebSocket] No token in sessionStorage, attempting refresh...');
      try {
        const response = await firstValueFrom(this.authService.refreshToken());
        token = response?.data?.accessToken || null;
        if (token) {
          console.log('[WebSocket] ✅ Token refreshed successfully');
        }
      } catch (err) {
        console.error('[WebSocket] ❌ Refresh failed:', err);
        this.connectionState.set('error');
        return;
      }
    }
    
    if (!token) {
      console.error('[WebSocket] ❌ No token - cannot connect');
      this.connectionState.set('error');
      return;
    }

    console.log('[WebSocket] 🔑 Token found, length:', token.length);
    console.log('[WebSocket] 🚀 Connecting to', environment.wsUrl);
    this.connectionState.set('connecting');

    // Cleanup client cũ nếu có
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }

    this.client = new Client({
      brokerURL: environment.wsUrl,
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      // Tắt auto-reconnect built-in để tự control với exponential backoff
      reconnectDelay: 0,

      debug: (msg: string) => {
        // Chỉ log frame quan trọng để tránh spam console
        if (msg.includes('CONNECT') || msg.includes('ERROR') || msg.includes('Authorization')) {
          console.log('[STOMP]', msg);
        }
      },

      onConnect: (frame: IFrame) => {
        console.log('[WebSocket] ✅ Connected!', frame.headers);
        this.connectionState.set('connected');
        this.reconnectAttempt = 0;

        this.subscribeToAIQueues();
      },

      onStompError: (frame: IFrame) => {
        const message = frame.headers['message'] || 'Unknown STOMP error';
        console.error('[WebSocket] ❌ STOMP error:', message, frame.body);

        // Token expired hoặc auth failed → thử refresh token rồi reconnect
        if (message.includes('TOKEN_EXPIRED') || message.includes('Authentication') || message.includes('expired')) {
          console.warn('[WebSocket] Token expired, attempting refresh...');
          this.connectionState.set('disconnected');
          this.refreshAndReconnect();
          return;
        }

        this.connectionState.set('error');
        this.scheduleReconnect();
      },

      onWebSocketError: (event: Event) => {
        console.error('[WebSocket] ❌ Network error:', event);
        this.connectionState.set('error');
        this.scheduleReconnect();
      },

      onWebSocketClose: (event: CloseEvent) => {
        console.log('[WebSocket] Connection closed', event.code, event.reason);
        // Code 1000 = normal closure (chủ động disconnect), không retry
        if (event.code !== 1000) {
          this.connectionState.set('disconnected');
          this.scheduleReconnect();
        } else {
          this.connectionState.set('disconnected');
        }
      },

      onDisconnect: () => {
        console.log('[WebSocket] Disconnected (STOMP)');
      }
    });

    this.client.activate();
  }

  /**
   * Subscribe các queue AI sau khi đã CONNECT thành công.
   */
  private subscribeToAIQueues(): void {
    if (!this.client) return;

    this.client.subscribe('/user/queue/ai-assistant/response', (msg) => {
      const preview = msg.body.length > 30 ? msg.body.substring(0, 30) + '...' : msg.body;
      console.log('[WebSocket] 📨 Chunk:', preview);
      this.aiChunk.set({ value: msg.body, ts: Date.now() });
    });

    this.client.subscribe('/user/queue/ai-assistant/complete', (msg) => {
      console.log('[WebSocket] ✅ Stream complete');
      this.isTyping.set(false);
      this.aiComplete.set({ value: msg.body, ts: Date.now() });
    });

    this.client.subscribe('/user/queue/ai-assistant/error', (msg) => {
      console.error('[WebSocket] ❌ AI Error:', msg.body);
      this.isTyping.set(false);
      this.aiError.set({ value: msg.body, ts: Date.now() });
    });

    this.client.subscribe('/user/queue/ai-assistant/cards', (msg) => {
      try {
        const payload = JSON.parse(msg.body) as AICardPayload;
        const productCount = payload.products?.length ?? 0;
        const shopCount = payload.shops?.length ?? 0;
        console.log(`[WebSocket] 🎴 Cards received - products: ${productCount}, shops: ${shopCount}`);
        this.aiCards.set({ value: payload, ts: Date.now() });
      } catch (err) {
        console.warn('[WebSocket] Cannot parse cards payload:', err);
      }
    });
  }

  /**
   * Refresh token rồi reconnect WebSocket.
   * Dùng khi token expired hoặc auth fail.
   */
  private async refreshAndReconnect(): Promise<void> {
    try {
      console.log('[WebSocket] 🔄 Refreshing token...');
      await firstValueFrom(this.authService.refreshToken());
      console.log('[WebSocket] ✅ Token refreshed, reconnecting...');
      
      // Cleanup client cũ
      if (this.client) {
        this.client.deactivate();
        this.client = null;
      }
      
      // Connect lại với token mới
      this.reconnectAttempt = 0;
      await this.connect();
    } catch (err) {
      console.error('[WebSocket] ❌ Refresh failed, user must re-login:', err);
      this.connectionState.set('error');
    }
  }

  /**
   * Exponential backoff reconnect (1s, 2s, 4s, 8s, 16s, max 5 lần).
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return; // Đã có timer pending
    }

    if (this.reconnectAttempt >= this.MAX_RECONNECT_ATTEMPTS) {
      console.error('[WebSocket] Max reconnect attempts reached, giving up');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempt), 16000);
    this.reconnectAttempt++;
    console.log(`[WebSocket] Reconnect attempt ${this.reconnectAttempt}/${this.MAX_RECONNECT_ATTEMPTS} in ${delay}ms`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      // Chỉ reconnect nếu user vẫn authenticated
      if (this.authService.isAuthenticated()) {
        this.connect();
      } else {
        console.log('[WebSocket] User no longer authenticated, abort reconnect');
        this.reconnectAttempt = 0;
      }
    }, delay);
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempt = 0;

    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
    this.connectionState.set('disconnected');
  }

  sendAIMessage(message: string): void {
    if (!this.isConnected() || !this.client) {
      console.error('[WebSocket] Not connected, state:', this.connectionState());
      return;
    }

    const user = this.authService.currentUser();
    if (!user?.userId) {
      console.error('[WebSocket] No user');
      return;
    }

    const trimmed = message.trim();
    if (!trimmed) return;

    const conversationId = this.getOrCreateConversationId(user.userId);
    this.isTyping.set(true);

    this.client.publish({
      destination: '/app/ai-assistant/chat',
      body: JSON.stringify({ message: trimmed, conversationId })
    });

    console.log('[WebSocket] 📤 Sent message, conv:', conversationId);
  }

  /**
   * Tạo conversationId mới (format `ai-{userId}-{timestamp}`) → lần `sendAIMessage`
   * tiếp theo sẽ dùng ID này, BE coi như cuộc hội thoại hoàn toàn mới (memory key khác).
   * Gọi từ ChatModalComponent khi user bấm "New conversation".
   */
  startNewConversation(): string {
    const user = this.authService.currentUser();
    if (!user?.userId) {
      throw new Error('User not authenticated');
    }
    const newId = `ai-${user.userId}-${Date.now()}`;
    this._activeConversationId.set(newId);
    sessionStorage.setItem('AI_CONVERSATION_ID', newId);
    console.log('[WebSocket] 🆕 New conversation:', newId);
    return newId;
  }

  /**
   * Lấy conversationId hiện tại, tạo default nếu chưa có.
   * Persist trong sessionStorage để chung tab giữ ID qua reload.
   */
  private getOrCreateConversationId(userId: string): string {
    let id = this._activeConversationId();
    if (id && id.startsWith(`ai-${userId}-`)) return id;

    const stored = sessionStorage.getItem('AI_CONVERSATION_ID');
    if (stored && stored.startsWith(`ai-${userId}-`)) {
      this._activeConversationId.set(stored);
      return stored;
    }
    id = `ai-${userId}-default`;
    this._activeConversationId.set(id);
    sessionStorage.setItem('AI_CONVERSATION_ID', id);
    return id;
  }

  /**
   * @deprecated Dùng `startNewConversation()` thay vì xóa history. Giữ method
   * này để code cũ không break, vẫn gọi DELETE /api/ai-assistant/history nếu cần.
   */
  async clearAIHistory(): Promise<void> {
    const id = this._activeConversationId();
    if (!id) return;

    const token = this.getAccessTokenForRequest();
    const url = `${environment.chatServiceUrl}/api/ai-assistant/history/${id}`;

    const response = await fetch(url, {
      method: 'DELETE',
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });

    if (!response.ok) {
      throw new Error(`Clear history failed: HTTP ${response.status}`);
    }
  }

  private getAccessTokenForRequest(): string | null {
    return this.authService.getAccessToken();
  }
}

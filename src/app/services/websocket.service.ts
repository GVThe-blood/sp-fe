import { Injectable, signal, inject, DestroyRef, computed } from '@angular/core';
import { Client, IFrame } from '@stomp/stompjs';
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
   * Connect to WebSocket - chỉ gọi khi đã có token.
   * Auto-retry với exponential backoff khi gặp lỗi network.
   */
  connect(): void {
    if (this.client?.active) {
      console.log('[WebSocket] Already active, skip connect');
      return;
    }

    const token = this.authService.getCookie('ACCESS_TOKEN');
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

        // Token expired - clear state, không retry
        if (message.includes('TOKEN_EXPIRED') || message.includes('Authentication')) {
          console.warn('[WebSocket] Auth failed, not retrying');
          this.connectionState.set('error');
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

    const conversationId = `ai-${user.userId}`;
    this.isTyping.set(true);

    this.client.publish({
      destination: '/app/ai-assistant/chat',
      body: JSON.stringify({ message: trimmed, conversationId })
    });

    console.log('[WebSocket] 📤 Sent message');
  }

  /**
   * Clear AI conversation history qua REST API.
   * Endpoint controller: DELETE /api/ai-assistant/history/{conversationId}
   * Connect trực tiếp tới chat service vì AIAssistantController không nằm dưới
   * route /api/v1/chat/** của Gateway.
   */
  async clearAIHistory(): Promise<void> {
    const user = this.authService.currentUser();
    if (!user?.userId) throw new Error('User not found');

    const token = this.authService.getCookie('ACCESS_TOKEN');
    const conversationId = `ai-${user.userId}`;
    const url = `${environment.chatServiceUrl}/api/ai-assistant/history/${conversationId}`;

    const response = await fetch(url, {
      method: 'DELETE',
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });

    if (!response.ok) {
      throw new Error(`Clear history failed: HTTP ${response.status}`);
    }
  }
}

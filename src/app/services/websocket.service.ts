import { Injectable, signal, inject, DestroyRef } from '@angular/core';
import { RxStomp, RxStompConfig } from '@stomp/rx-stomp';
import { IMessage } from '@stomp/stompjs';
import { map, catchError, of, Subject } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { UserService } from './user.service';

// Re-export ChatMessage from model
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

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private rxStomp = new RxStomp();
  private destroyRef = inject(DestroyRef);
  private userService = inject(UserService);

  // Connection state
  connectionState = signal<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  
  // AI response streaming
  private aiResponseSubject = new Subject<string>();
  aiResponse$ = this.aiResponseSubject.asObservable();
  
  // AI response chunks (for streaming)
  private aiChunksSubject = this.rxStomp
    .watch('/user/queue/ai-assistant/response')
    .pipe(
      map((message: IMessage) => message.body),
      catchError(error => {
        console.error('AI response error:', error);
        return of('');
      })
    );
  
  aiChunk = toSignal(this.aiChunksSubject, { initialValue: '' });
  
  // AI completion signal
  private aiCompleteSubject = this.rxStomp
    .watch('/user/queue/ai-assistant/complete')
    .pipe(
      map((message: IMessage) => message.body),
      catchError(error => {
        console.error('AI complete error:', error);
        return of('');
      })
    );
  
  aiComplete = toSignal(this.aiCompleteSubject, { initialValue: '' });
  
  // AI error signal
  private aiErrorSubject = this.rxStomp
    .watch('/user/queue/ai-assistant/error')
    .pipe(
      map((message: IMessage) => message.body),
      catchError(error => {
        console.error('AI error:', error);
        return of('');
      })
    );
  
  aiError = toSignal(this.aiErrorSubject, { initialValue: '' });
  
  // Computed: Is AI typing?
  isTyping = signal(false);

  constructor() {
    // Get JWT token from cookies (backend stores token in HttpOnly cookie)
    const getJwtToken = (): string | null => {
      // Parse cookies to get access_token
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'access_token' || name === 'jwt_token' || name === 'token') {
          return decodeURIComponent(value);
        }
      }
      
      // Fallback: try localStorage (for development/testing)
      return localStorage.getItem('access_token') || 
             localStorage.getItem('jwt_token') ||
             localStorage.getItem('token') ||
             null;
    };

    // Configure RxStomp for SpringFood AI Assistant
    const stompConfig: RxStompConfig = {
      // WebSocket endpoint - Direct to chat service (port 9098)
      // Note: Must use direct connection, not via Gateway, for WebSocket
      brokerURL: 'ws://localhost:9098/ws',
      
      // Connect headers - JWT token REQUIRED by backend
      connectHeaders: {},
      
      // Heartbeat (10s as per backend config)
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      
      // Reconnect delay (5s)
      reconnectDelay: 5000,
      
      // Connection timeout (10s)
      connectionTimeout: 10000,
      
      // Debug
      debug: (msg: string) => {
        console.log('[STOMP Debug]', msg);
      },
      
      // Callbacks
      beforeConnect: () => {
        this.connectionState.set('connecting');
        console.log('[WebSocket] Connecting to SpringFood AI Assistant...');
        
        // Update connect headers with latest JWT token from cookies
        const token = getJwtToken();
        if (token) {
          stompConfig.connectHeaders = {
            Authorization: `Bearer ${token}`
          };
          console.log('[WebSocket] JWT token found in cookies, authenticating...');
        } else {
          console.warn('[WebSocket] No JWT token found in cookies!');
          console.warn('[WebSocket] Please login first to use chat feature.');
        }
      }
    };

    this.rxStomp.configure(stompConfig);
    
    // Listen for connection state
    this.rxStomp.connected$.subscribe(() => {
      this.connectionState.set('connected');
      console.log('[WebSocket] Connected to SpringFood AI Assistant!');
    });
    
    // Listen for errors
    this.rxStomp.stompErrors$.subscribe((frame: any) => {
      this.connectionState.set('error');
      console.error('[WebSocket] STOMP error:', frame);
      
      // Check if it's an authentication error
      if (frame.headers && frame.headers.message) {
        const errorMsg = frame.headers.message;
        if (errorMsg.includes('Authentication failed') || errorMsg.includes('TOKEN_EXPIRED')) {
          console.error('[WebSocket] Authentication failed! Please login again.');
        }
      }
    });
    
    // Listen for WebSocket close
    this.rxStomp.webSocketErrors$.subscribe((event: any) => {
      this.connectionState.set('error');
      console.error('[WebSocket] WebSocket error:', event);
    });
    
    // Auto-cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.disconnect();
    });
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.connectionState() === 'disconnected' || this.connectionState() === 'error') {
      this.rxStomp.activate();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.connectionState() === 'connected' || this.connectionState() === 'connecting') {
      this.rxStomp.deactivate();
      this.connectionState.set('disconnected');
    }
  }

  /**
   * Send AI chat message via WebSocket
   * Backend endpoint: /app/ai-assistant/chat
   * Response streams to: /user/queue/ai-assistant/response
   */
  sendAIMessage(message: string): void {
    if (this.connectionState() !== 'connected') {
      console.error('[WebSocket] Cannot send message: Not connected');
      return;
    }

    const user = this.userService.currentUser();
    if (!user) {
      console.error('[WebSocket] Cannot send message: User not found');
      return;
    }

    // Each user has ONE persistent conversation with AI
    const conversationId = `ai-${user.id}`;

    const request: AIMessageRequest = {
      message: message.trim(),
      conversationId
    };

    console.log('[WebSocket] Sending AI message:', request);
    this.isTyping.set(true);

    this.rxStomp.publish({
      destination: '/app/ai-assistant/chat',
      body: JSON.stringify(request)
    });
  }

  /**
   * Send AI chat message via REST API (no auth required - goes through Gateway)
   * Backend endpoint: POST /api/chat/ai-assistant/chat
   */
  async sendAIMessageREST(message: string): Promise<AIMessageResponse> {
    const user = this.userService.currentUser();
    if (!user) {
      throw new Error('User not found');
    }

    // Each user has ONE persistent conversation with AI
    const conversationId = `ai-${user.id}`;

    const request: AIMessageRequest = {
      message: message.trim(),
      conversationId
    };

    console.log('[REST] Sending AI message:', request);

    const response = await fetch('http://localhost:8080/api/chat/ai-assistant/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Clear AI conversation history
   * Backend endpoint: DELETE /api/chat/ai-assistant/history/{conversationId}
   */
  async clearAIHistory(): Promise<void> {
    const user = this.userService.currentUser();
    if (!user) {
      throw new Error('User not found');
    }

    const conversationId = `ai-${user.id}`;

    console.log('[REST] Clearing AI history:', conversationId);

    const response = await fetch(`http://localhost:8080/api/chat/ai-assistant/history/${conversationId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }
}

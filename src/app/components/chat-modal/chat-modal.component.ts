import { Component, ChangeDetectionStrategy, signal, computed, inject, effect } from '@angular/core';
import { ChatBubbleComponent } from './chat-bubble/chat-bubble.component';
import { ChatWindowComponent } from './chat-window/chat-window.component';
import { WebSocketService } from '../../services/websocket.service';
import { AuthService } from '../../services/auth.service';
import { ChatMessage, MessageBuilder, MessageButton } from '../../models/chat-message.model';

@Component({
  selector: 'app-chat-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChatBubbleComponent, ChatWindowComponent],
  template: `
    <app-chat-bubble 
      [isOpen]="isOpen()"
      (toggle)="toggleChat()"
    />
    
    @if (isOpen()) {
      <app-chat-window 
        [messages]="messages()"
        [isTyping]="isTyping()"
        [connectionState]="connectionState()"
        [isMini]="true"
        (close)="closeChat()"
        (sendMessage)="handleSendMessage($event)"
        (buttonClick)="handleButtonClick($event)"
      />
    }
  `,
  styles: [`
    :host {
      display: contents;
    }
  `]
})
export class ChatModalComponent {
  private wsService = inject(WebSocketService);
  private authService = inject(AuthService);
  
  // UI state signals
  isOpen = signal(false);
  
  // Computed signals from WebSocket service
  isTyping = computed(() => this.wsService.isTyping());
  connectionState = computed(() => this.wsService.connectionState());
  isConnected = computed(() => this.wsService.isConnected());
  
  // Messages state
  messages = signal<ChatMessage[]>([
    MessageBuilder.text(
      'Xin chào! Tôi là trợ lý AI của SpringFood. Tôi có thể giúp gì cho bạn? 🍜',
      false
    )
  ]);

  constructor() {
    // Effect: Auto-connect WebSocket khi user authenticated
    effect(() => {
      const authenticated = this.authService.isAuthenticated();
      const state = this.wsService.connectionState();
      
      if (authenticated && state === 'disconnected') {
        console.log('[Chat] User authenticated, connecting WebSocket...');
        this.wsService.connect();
      } else if (!authenticated && state !== 'disconnected') {
        console.log('[Chat] User logged out, disconnecting WebSocket...');
        this.wsService.disconnect();
      }
    });
    
    // Effect: Listen for AI response chunks (signal có ts để đảm bảo trigger)
    effect(() => {
      const chunkData = this.wsService.aiChunk();
      if (chunkData.ts > 0 && chunkData.value) {
        this.appendToLastAIMessage(chunkData.value);
      }
    });

    // Effect: Listen for AI completion
    effect(() => {
      const completeData = this.wsService.aiComplete();
      if (completeData.ts > 0) {
        console.log('[Chat] AI response complete');
      }
    });

    // Effect: Listen for AI errors
    effect(() => {
      const errorData = this.wsService.aiError();
      if (errorData.ts > 0 && errorData.value) {
        console.error('[Chat] ❌ AI error:', errorData.value);
        this.addAIMessage('Xin lỗi, đã có lỗi xảy ra: ' + errorData.value);
      }
    });
  }

  toggleChat(): void {
    if (this.isOpen()) {
      this.closeChat();
    } else {
      this.openChat();
    }
  }

  openChat(): void {
    this.isOpen.set(true);
    // Reconnect nếu chưa connected và user đã đăng nhập
    if (!this.isConnected() && this.authService.isAuthenticated()) {
      this.wsService.connect();
    }
  }

  closeChat(): void {
    this.isOpen.set(false);
  }

  async handleSendMessage(content: string): Promise<void> {
    if (!content.trim()) {
      return;
    }

    console.log('[Chat] Send attempt - state:', this.connectionState(), 'authenticated:', this.authService.isAuthenticated());

    // Nếu chưa connected, thử connect ngay
    if (!this.isConnected() && this.authService.isAuthenticated()) {
      console.log('[Chat] Not connected, attempting connect first...');
      this.wsService.connect();
      // Đợi 1s cho connect
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Check WebSocket connection
    if (!this.isConnected()) {
      console.error('[Chat] ❌ WebSocket still not connected (state:', this.connectionState(), ')');
      this.addAIMessage('Kết nối bị gián đoạn. Vui lòng tải lại trang. 🔌');
      return;
    }

    // Check authentication
    if (!this.authService.isAuthenticated()) {
      console.warn('[Chat] ⚠️ User not authenticated');
      this.messages.update(msgs => [...msgs, MessageBuilder.loginRequired()]);
      return;
    }

    // Add user message to UI immediately
    const userMessage = MessageBuilder.text(content.trim(), true);
    this.messages.update(msgs => [...msgs, userMessage]);

    try {
      this.wsService.sendAIMessage(content);
      const aiMessage = MessageBuilder.text('', false);
      this.messages.update(msgs => [...msgs, aiMessage]);
    } catch (error) {
      console.error('[Chat] ❌ Error sending message:', error);
      this.addAIMessage('Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau. 😔');
    }
  }

  handleButtonClick(button: MessageButton): void {
    console.log('[Chat] Button clicked:', button);
    
    // Handle custom actions that need chat context
    switch (button.action.type) {
      case 'add_to_cart':
        // TODO: Integrate with cart service
        console.log('Add to cart:', button.action.data);
        this.addAIMessage('✅ Đã thêm vào giỏ hàng!');
        break;
        
      case 'api_call':
        // TODO: Make API call
        console.log('API call:', button.action.data);
        break;
        
      case 'emit_event':
        // Handle custom events
        console.log('Custom event:', button.action.data);
        if (button.action.data?.event === 'continue_as_guest') {
          this.addAIMessage('Bạn đang tiếp tục với tư cách khách. Một số tính năng có thể bị giới hạn.');
        }
        break;
    }
  }

  private checkAuthentication(): boolean {
    return this.authService.isAuthenticated();
  }

  private appendToLastAIMessage(chunk: string): void {
    this.messages.update(msgs => {
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg && !lastMsg.isUser) {
        // Get current content
        const currentContent = typeof lastMsg.content === 'string' 
          ? lastMsg.content 
          : (lastMsg.content as any).text || '';
        
        // Append chunk
        const newContent = currentContent + chunk;
        
        // Return updated message
        return [
          ...msgs.slice(0, -1),
          { ...lastMsg, content: newContent }
        ];
      } else {
        // Create new AI message
        return [
          ...msgs,
          MessageBuilder.text(chunk, false)
        ];
      }
    });
  }

  private addAIMessage(content: string): void {
    this.messages.update(msgs => [...msgs, MessageBuilder.text(content, false)]);
  }
}


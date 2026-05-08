import { Component, ChangeDetectionStrategy, signal, inject, effect } from '@angular/core';
import { ChatBubbleComponent } from './chat-bubble/chat-bubble.component';
import { ChatWindowComponent } from './chat-window/chat-window.component';
import { WebSocketService } from '../../services/websocket.service';
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
  wsService = inject(WebSocketService);
  
  isOpen = signal(false);
  isTyping = signal(false);
  connectionState = signal<'disconnected' | 'connecting' | 'connected' | 'error'>('connected');
  
  messages = signal<ChatMessage[]>([
    MessageBuilder.text(
      'Xin chào! Tôi là trợ lý AI của SpringFood. Tôi có thể giúp gì cho bạn? 🍜',
      false
    )
  ]);

  constructor() {
    // Auto-connect WebSocket when component initializes
    this.wsService.connect();
    
    // Sync connection state
    effect(() => {
      this.connectionState.set(this.wsService.connectionState());
    });

    // Listen for AI response chunks (WebSocket streaming)
    effect(() => {
      const chunk = this.wsService.aiChunk();
      if (chunk) {
        console.log('[Chat] Received AI chunk:', chunk);
        this.appendToLastAIMessage(chunk);
      }
    });

    // Listen for AI completion
    effect(() => {
      const complete = this.wsService.aiComplete();
      if (complete) {
        console.log('[Chat] AI response complete:', complete);
        this.isTyping.set(false);
      }
    });

    // Listen for AI errors
    effect(() => {
      const error = this.wsService.aiError();
      if (error) {
        console.error('[Chat] AI error:', error);
        this.isTyping.set(false);
        this.addAIMessage(error);
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
  }

  closeChat(): void {
    this.isOpen.set(false);
  }

  async handleSendMessage(content: string): Promise<void> {
    if (!content.trim()) return;

    // Check if user is authenticated (has token)
    const hasToken = this.checkAuthentication();
    if (!hasToken) {
      // Show login required message with button
      this.messages.update(msgs => [...msgs, MessageBuilder.loginRequired()]);
      
      // Log for debugging
      console.warn('[Chat] User not authenticated. Please login first.');
      return;
    }

    // Add user message to local state immediately
    const userMessage = MessageBuilder.text(content.trim(), true);
    this.messages.update(msgs => [...msgs, userMessage]);

    // Show typing indicator
    this.isTyping.set(true);

    try {
      // Use WebSocket for real-time streaming
      this.wsService.sendAIMessage(content);
      
      // Create placeholder for AI response (will be filled by streaming)
      const aiMessage = MessageBuilder.text('', false);
      this.messages.update(msgs => [...msgs, aiMessage]);
      
    } catch (error) {
      console.error('[Chat] Error sending message:', error);
      
      // Add error message
      const errorMessage = MessageBuilder.text(
        'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau. 😔',
        false
      );
      this.messages.update(msgs => [...msgs, errorMessage]);
      this.isTyping.set(false);
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
    // Check cookies for token
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name] = cookie.trim().split('=');
      if (name === 'access_token' || name === 'jwt_token' || name === 'token') {
        return true;
      }
    }
    
    // Fallback: check localStorage
    if (localStorage.getItem('access_token') || 
        localStorage.getItem('jwt_token') ||
        localStorage.getItem('token')) {
      return true;
    }
    
    return false;
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


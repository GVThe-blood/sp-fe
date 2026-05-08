import { Component, ChangeDetectionStrategy, signal, inject, effect } from '@angular/core';
import { ChatBubbleComponent } from './chat-bubble/chat-bubble.component';
import { ChatWindowComponent } from './chat-window/chat-window.component';
import { WebSocketService, ChatMessage } from '../../services/websocket.service';

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
    {
      id: '1',
      content: 'Xin chào! Tôi là trợ lý AI của SpringFood. Tôi có thể giúp gì cho bạn? 🍜',
      timestamp: new Date(),
      isUser: false
    }
  ]);

  constructor() {
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

    // Add user message to local state immediately
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: content.trim(),
      timestamp: new Date(),
      isUser: true,
      status: 'sent'
    };

    this.messages.update(msgs => [...msgs, userMessage]);

    // Show typing indicator
    this.isTyping.set(true);

    try {
      // Use REST API (no auth required - goes through Gateway)
      const response = await this.wsService.sendAIMessageREST(content);
      
      // Add AI response to messages
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: response.response,
        timestamp: new Date(response.timestamp),
        isUser: false,
        status: 'delivered'
      };

      this.messages.update(msgs => [...msgs, aiMessage]);
      
    } catch (error) {
      console.error('[Chat] Error sending message:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau. 😔',
        timestamp: new Date(),
        isUser: false,
        status: 'delivered'
      };

      this.messages.update(msgs => [...msgs, errorMessage]);
    } finally {
      this.isTyping.set(false);
    }
  }

  private appendToLastAIMessage(chunk: string): void {
    this.messages.update(msgs => {
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg && !lastMsg.isUser) {
        // Append to existing AI message
        return [
          ...msgs.slice(0, -1),
          { ...lastMsg, content: lastMsg.content + chunk }
        ];
      } else {
        // Create new AI message
        return [
          ...msgs,
          {
            id: Date.now().toString(),
            content: chunk,
            timestamp: new Date(),
            isUser: false,
            status: 'delivered'
          }
        ];
      }
    });
  }

  private addAIMessage(content: string): void {
    const aiMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      timestamp: new Date(),
      isUser: false,
      status: 'delivered'
    };

    this.messages.update(msgs => [...msgs, aiMessage]);
  }
}


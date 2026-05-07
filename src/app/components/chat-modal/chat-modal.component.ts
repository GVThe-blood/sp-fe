import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { ChatBubbleComponent } from './chat-bubble/chat-bubble.component';
import { ChatWindowComponent } from './chat-window/chat-window.component';

export interface ChatMessage {
  id: string;
  content: string;
  timestamp: Date;
  isUser: boolean;
  status?: 'sent' | 'delivered' | 'read';
}

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
  isOpen = signal(false);
  isTyping = signal(false);
  messages = signal<ChatMessage[]>([
    {
      id: '1',
      content: 'Hi there! How can I help you with your order today?',
      timestamp: new Date(Date.now() - 180000), // 3 minutes ago
      isUser: false
    },
    {
      id: '2',
      content: 'I need to update my delivery address for tomorrow\'s organic box.',
      timestamp: new Date(Date.now() - 60000), // 1 minute ago
      isUser: true,
      status: 'read'
    }
  ]);

  toggleChat(): void {
    this.isOpen.update(open => !open);
  }

  closeChat(): void {
    this.isOpen.set(false);
  }

  handleSendMessage(content: string): void {
    if (!content.trim()) return;

    // Add user message
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content: content.trim(),
      timestamp: new Date(),
      isUser: true,
      status: 'sent'
    };

    this.messages.update(msgs => [...msgs, newMessage]);

    // Simulate bot typing
    this.isTyping.set(true);
    
    // TODO: Replace with actual API call
    setTimeout(() => {
      this.isTyping.set(false);
      
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Thank you for your message! Our support team will assist you shortly.',
        timestamp: new Date(),
        isUser: false
      };
      
      this.messages.update(msgs => [...msgs, botResponse]);
    }, 2000);
  }
}

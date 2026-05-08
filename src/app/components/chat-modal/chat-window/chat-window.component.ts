import { Component, ChangeDetectionStrategy, input, output, effect, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatHeaderComponent } from '../chat-header/chat-header.component';
import { MessageBubbleComponent } from '../message-bubble/message-bubble.component';
import { TypingIndicatorComponent } from '../typing-indicator/typing-indicator.component';
import { ChatInputComponent } from '../chat-input/chat-input.component';
import { ChatMessage } from '../../../services/websocket.service';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ChatHeaderComponent,
    MessageBubbleComponent,
    TypingIndicatorComponent,
    ChatInputComponent
  ],
  template: `
    <div class="chat-window" [class.mini]="isMini()">
      <app-chat-header
        [isConnected]="connectionState() === 'connected'"
        [connectionStatus]="getConnectionStatus()"
        (close)="close.emit()"
      />
      
      <div class="messages-container" #messagesContainer>
        <div class="messages-list">
          @for (message of messages(); track message.id) {
            <app-message-bubble [message]="message" />
          }
          
          @if (isTyping()) {
            <app-typing-indicator />
          }
        </div>
      </div>
      
      <app-chat-input
        (sendMessage)="sendMessage.emit($event)"
      />
    </div>
  `,
  styles: [`
    .chat-window {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 340px;
      height: 480px;
      max-height: calc(100vh - 40px);
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 999;
      animation: slideUp 300ms cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .chat-window.mini {
      width: 340px;
      height: 480px;
    }
    
    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      background: white;
      scroll-behavior: smooth;
    }
    
    .messages-list {
      display: flex;
      flex-direction: column;
    }
    
    /* Custom Scrollbar */
    .messages-container::-webkit-scrollbar {
      width: 5px;
    }
    
    .messages-container::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .messages-container::-webkit-scrollbar-thumb {
      background: #D1D5DB;
      border-radius: 3px;
      transition: background 300ms cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .messages-container::-webkit-scrollbar-thumb:hover {
      background: #9CA3AF;
    }
    
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .chat-window {
        width: calc(100vw - 32px);
        height: calc(100vh - 40px);
        right: 16px;
        bottom: 20px;
      }
      
      .messages-container {
        padding: 12px;
      }
    }
    
    @media (min-width: 769px) and (max-width: 1024px) {
      .chat-window {
        width: 360px;
        height: 500px;
      }
    }
  `]
})
export class ChatWindowComponent {
  messages = input.required<ChatMessage[]>();
  isTyping = input<boolean>(false);
  connectionState = input<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  isMini = input<boolean>(true); // Default to mini mode
  
  close = output<void>();
  sendMessage = output<string>();
  
  messagesContainer = viewChild<ElementRef>('messagesContainer');
  
  constructor() {
    // Auto-scroll to bottom when new messages arrive
    effect(() => {
      const messages = this.messages();
      const typing = this.isTyping();
      const container = this.messagesContainer()?.nativeElement;
      
      if (container && (messages.length > 0 || typing)) {
        setTimeout(() => {
          container.scrollTop = container.scrollHeight;
        }, 100);
      }
    });
  }
  
  getConnectionStatus(): string {
    const state = this.connectionState();
    switch (state) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Connection Error';
      default: return 'Disconnected';
    }
  }
}

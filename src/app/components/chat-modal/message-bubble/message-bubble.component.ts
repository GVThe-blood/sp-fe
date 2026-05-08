import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatMessage, MessageButton } from '../../../models/chat-message.model';
import { RichMessageComponent } from '../rich-message/rich-message.component';

@Component({
  selector: 'app-message-bubble',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RichMessageComponent],
  template: `
    <div class="message-container" [class.user]="message().isUser">
      <div class="message-avatar">
        @if (message().isUser) {
          <!-- User Avatar: Person Icon (filled) -->
          <svg class="avatar-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
          </svg>
        } @else {
          <!-- AI Avatar: Robot Icon (filled) -->
          <svg class="avatar-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3zM9 9c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm6 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-3 6c-1.65 0-3-1.35-3-3h6c0 1.65-1.35 3-3 3z"/>
          </svg>
        }
      </div>
      
      <div class="message-content">
        <div class="message-bubble" [class.user]="message().isUser">
          @if (isRichMessage()) {
            <!-- Rich Message with buttons, images, cards -->
            <app-rich-message 
              [content]="getRichContent()"
              (buttonClick)="onButtonClick($event)"
            />
          } @else {
            <!-- Plain Text Message -->
            <p class="message-text">{{ getTextContent() }}</p>
          }
        </div>
        <span class="message-timestamp">
          {{ message().timestamp | date:'short' }}
        </span>
      </div>
    </div>
  `,
  styles: [`
    .message-container {
      display: flex;
      gap: 10px;
      margin-bottom: 14px;
      animation: fadeIn 300ms cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .message-container.user {
      flex-direction: row-reverse;
    }
    
    .message-avatar {
      flex-shrink: 0;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #F3F4F6;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .message-container.user .message-avatar {
      background: linear-gradient(135deg, #3B82F6 0%, #A855F7 100%);
    }
    
    .avatar-icon {
      width: 16px;
      height: 16px;
      color: #6B7280;
    }
    
    .message-container.user .avatar-icon {
      color: white;
    }
    
    .message-content {
      display: flex;
      flex-direction: column;
      gap: 3px;
      max-width: 75%;
    }
    
    .message-container.user .message-content {
      align-items: flex-end;
    }
    
    .message-bubble {
      padding: 10px 14px;
      border-radius: 16px;
      background: #F3F4F6;
      color: #1F2937;
      word-wrap: break-word;
      transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .message-bubble:hover {
      box-shadow: 0 2px 4px -1px rgb(0 0 0 / 0.08);
    }
    
    .message-bubble.user {
      background: linear-gradient(135deg, #3B82F6 0%, #A855F7 100%);
      color: white;
    }
    
    .message-text {
      margin: 0;
      font-size: 0.8125rem;
      line-height: 1.5;
      white-space: pre-wrap;
    }
    
    .message-timestamp {
      font-size: 0.625rem;
      color: #9CA3AF;
      padding: 0 4px;
      font-weight: 500;
    }
    
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class MessageBubbleComponent {
  message = input.required<ChatMessage>();
  buttonClick = output<MessageButton>();

  isRichMessage(): boolean {
    return typeof this.message().content === 'object';
  }

  getTextContent(): string {
    const content = this.message().content;
    return typeof content === 'string' ? content : '';
  }

  getRichContent(): any {
    const content = this.message().content;
    return typeof content === 'object' ? content : { text: '' };
  }

  onButtonClick(button: MessageButton): void {
    console.log('[MessageBubble] Button clicked:', button);
    this.buttonClick.emit(button);
  }
}

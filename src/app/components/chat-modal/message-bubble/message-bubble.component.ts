import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatMessage } from '../../../services/websocket.service';

@Component({
  selector: 'app-message-bubble',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="message-container" [class.user]="message().isUser">
      <div class="message-avatar">
        @if (message().isUser) {
          <svg class="avatar-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        } @else {
          <svg class="avatar-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3z"/>
          </svg>
        }
      </div>
      
      <div class="message-content">
        <div class="message-bubble" [class.user]="message().isUser">
          <p class="message-text">{{ message().content }}</p>
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
}

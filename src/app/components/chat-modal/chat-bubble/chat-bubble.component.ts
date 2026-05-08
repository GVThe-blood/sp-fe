import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

@Component({
  selector: 'app-chat-bubble',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      (click)="toggle.emit()"
      [class.scale-0]="isOpen()"
      class="chat-fab"
      [attr.aria-label]="isOpen() ? 'Close chat' : 'Open chat with SpringFood AI'"
    >
      <div class="fab-content">
        <!-- Chat Icon -->
        <svg class="chat-icon" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
          <circle cx="8" cy="10" r="1.5"/>
          <circle cx="12" cy="10" r="1.5"/>
          <circle cx="16" cy="10" r="1.5"/>
        </svg>
        
        <!-- AI Badge -->
        <div class="ai-badge">AI</div>
        
        <!-- Online Status -->
        <div class="status-indicator"></div>
      </div>
      
      <!-- Unread Badge -->
      @if (unreadCount() > 0) {
        <div class="unread-badge">
          {{ unreadCount() > 9 ? '9+' : unreadCount() }}
        </div>
      }
    </button>
  `,
  styles: [`
    .chat-fab {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 64px;
      height: 64px;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .chat-fab:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(76, 175, 80, 0.5);
    }

    .chat-fab:active {
      transform: scale(0.95);
    }

    .chat-fab.scale-0 {
      transform: scale(0);
      opacity: 0;
      pointer-events: none;
    }

    .fab-content {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .chat-icon {
      width: 32px;
      height: 32px;
      transition: transform 0.3s;
    }

    .chat-fab:hover .chat-icon {
      transform: scale(1.1);
    }

    .ai-badge {
      position: absolute;
      top: -6px;
      right: -6px;
      width: 20px;
      height: 20px;
      background: #FF9800;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: bold;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    .status-indicator {
      position: absolute;
      bottom: -4px;
      right: -4px;
      width: 14px;
      height: 14px;
      background: #4CAF50;
      border: 2px solid white;
      border-radius: 50%;
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    .unread-badge {
      position: absolute;
      top: -8px;
      right: -8px;
      min-width: 24px;
      height: 24px;
      background: #F44336;
      color: white;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      padding: 0 6px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      animation: bounce 1s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }
  `]
})
export class ChatBubbleComponent {
  isOpen = input.required<boolean>();
  unreadCount = input(0);
  toggle = output<void>();
}

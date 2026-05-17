import { Component, output, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="chat-header">
      <div class="header-content">
        <div class="header-left">
          <div class="logo-container">
            <svg class="logo-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3z"/>
            </svg>
          </div>
          <div class="header-text">
            <h2 class="header-title">SpringFood AI</h2>
            <p class="header-subtitle">Powered by Gemini</p>
          </div>
        </div>

        <div class="header-right">
          <div class="status-indicator">
            <span class="status-dot" [class.connected]="isConnected()"></span>
            <span class="status-text">{{ connectionStatus() }}</span>
          </div>

          <!-- New conversation: clear lịch sử AI và reset UI -->
          <button
            class="action-button"
            (click)="newConversation.emit()"
            [disabled]="!isConnected()"
            aria-label="New conversation"
            title="Bắt đầu hội thoại mới"
          >
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
          </button>

          <!-- Maximize / Restore: toggle full-screen (xử lý ở chat-window) -->
          <button
            class="action-button"
            (click)="toggleMaximize.emit()"
            [attr.aria-label]="isMaximized() ? 'Restore' : 'Maximize'"
            [title]="isMaximized() ? 'Thu nhỏ' : 'Phóng to'"
          >
            @if (isMaximized()) {
              <!-- Restore icon -->
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 9V5h10v10h-4M5 9h10v10H5V9z"/>
              </svg>
            } @else {
              <!-- Maximize icon -->
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4h4M4 16v4h4m8-16h4v4m-4 12h4v-4"/>
              </svg>
            }
          </button>

          <button
            class="action-button"
            (click)="close.emit()"
            aria-label="Close chat"
            title="Đóng"
          >
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chat-header {
      height: 56px;
      background: white;
      border-bottom: 1px solid #E5E7EB;
      box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
      border-radius: 12px 12px 0 0;
      cursor: move; /* Hint that header có thể là handle để drag (nếu thêm sau) */
      user-select: none;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 100%;
      padding: 0 16px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .logo-container {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3B82F6 0%, #A855F7 100%);
      flex-shrink: 0;
    }

    .logo-icon {
      width: 20px;
      height: 20px;
      color: white;
    }

    .header-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .header-title {
      font-size: 1rem;
      font-weight: 700;
      color: #1F2937;
      margin: 0;
      line-height: 1.2;
    }

    .header-subtitle {
      font-size: 0.7rem;
      font-weight: 400;
      color: #6B7280;
      margin: 0;
      line-height: 1;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-right: 4px;
    }

    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #9CA3AF;
      transition: background 300ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .status-dot.connected {
      background: #10B981;
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
    }

    .status-text {
      font-size: 0.7rem;
      color: #6B7280;
      font-weight: 500;
    }

    .action-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: none;
      background: transparent;
      color: #6B7280;
      cursor: pointer;
      border-radius: 6px;
      transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .action-button:hover:not(:disabled) {
      background: #F3F4F6;
      color: #1F2937;
    }

    .action-button:active:not(:disabled) {
      transform: scale(0.95);
    }

    .action-button:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .icon {
      width: 18px;
      height: 18px;
    }
  `]
})
export class ChatHeaderComponent {
  isConnected = input<boolean>(false);
  connectionStatus = input<string>('Disconnected');
  isMaximized = input<boolean>(false);

  close = output<void>();
  newConversation = output<void>();
  toggleMaximize = output<void>();
}

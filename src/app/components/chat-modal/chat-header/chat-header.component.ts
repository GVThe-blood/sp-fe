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
          
          <button 
            class="close-button" 
            (click)="close.emit()"
            aria-label="Close chat"
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
      gap: 12px;
    }
    
    .status-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
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
    
    .close-button {
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
      transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .close-button:hover {
      background: #F3F4F6;
      color: #1F2937;
    }
    
    .close-button:active {
      transform: scale(0.95);
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
  close = output<void>();
}

import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-typing-indicator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="typing-container">
      <div class="typing-avatar">
        <svg class="avatar-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3z"/>
        </svg>
      </div>
      
      <div class="typing-bubble">
        <div class="typing-dots">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .typing-container {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
      animation: fadeIn 300ms cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .typing-avatar {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #F3F4F6;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .avatar-icon {
      width: 20px;
      height: 20px;
      color: #6B7280;
    }
    
    .typing-bubble {
      padding: 12px 16px;
      border-radius: 16px;
      background: #F3F4F6;
      display: flex;
      align-items: center;
    }
    
    .typing-dots {
      display: flex;
      gap: 4px;
      align-items: center;
    }
    
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #9CA3AF;
      animation: typingDots 1.4s infinite ease-in-out;
    }
    
    .dot:nth-child(1) {
      animation-delay: 0s;
    }
    
    .dot:nth-child(2) {
      animation-delay: 0.2s;
    }
    
    .dot:nth-child(3) {
      animation-delay: 0.4s;
    }
    
    @keyframes typingDots {
      0%, 60%, 100% {
        opacity: 0.3;
        transform: scale(0.8);
      }
      30% {
        opacity: 1;
        transform: scale(1);
      }
    }
    
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class TypingIndicatorComponent {}

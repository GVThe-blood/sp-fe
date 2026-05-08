import { Component, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-input-container">
      <div class="input-wrapper">
        <input
          type="text"
          class="message-input"
          placeholder="Type your message..."
          [(ngModel)]="messageText"
          (keydown.enter)="handleSend()"
          [disabled]="disabled()"
          aria-label="Message input"
        />
        
        <button 
          class="send-button"
          type="button"
          (click)="handleSend()"
          [disabled]="!messageText.trim() || disabled()"
          aria-label="Send message"
          title="Send message"
        >
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="22" y1="2" x2="11" y2="13" stroke-width="2" stroke-linecap="round"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .chat-input-container {
      min-height: 70px;
      background: white;
      border-top: 1px solid #E5E7EB;
      padding: 12px 16px;
      border-radius: 0 0 12px 12px;
    }
    
    .input-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;
      height: 44px;
      padding: 2px;
      border-radius: 9999px;
      background: linear-gradient(135deg, #60A5FA 0%, #C084FC 50%, #F472B6 100%);
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    }
    
    .message-input {
      flex: 1;
      height: 100%;
      padding: 0 18px;
      border: none;
      background: white;
      border-radius: 9999px;
      font-size: 0.875rem;
      color: #1F2937;
      outline: none;
      transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .message-input::placeholder {
      color: #9CA3AF;
    }
    
    .message-input:focus {
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }
    
    .message-input:disabled {
      background: #F9FAFB;
      cursor: not-allowed;
      color: #9CA3AF;
    }
    
    .send-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border: none;
      background: linear-gradient(135deg, #3B82F6 0%, #A855F7 100%);
      border-radius: 50%;
      color: white;
      cursor: pointer;
      transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
      margin-right: 2px;
      flex-shrink: 0;
    }
    
    .send-button:hover:not(:disabled) {
      transform: scale(1.1);
      box-shadow: 0 8px 12px -2px rgba(59, 130, 246, 0.3);
    }
    
    .send-button:active:not(:disabled) {
      transform: scale(1.05);
    }
    
    .send-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: scale(1);
    }
    
    .icon {
      width: 18px;
      height: 18px;
    }
  `]
})
export class ChatInputComponent {
  messageText = '';
  disabled = signal(false);
  sendMessage = output<string>();
  
  handleSend(): void {
    const text = this.messageText.trim();
    if (text && !this.disabled()) {
      this.sendMessage.emit(text);
      this.messageText = '';
    }
  }
}

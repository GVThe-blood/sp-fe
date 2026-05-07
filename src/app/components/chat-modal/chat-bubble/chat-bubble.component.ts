import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

@Component({
  selector: 'app-chat-bubble',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      (click)="toggle.emit()"
      [class.scale-0]="isOpen()"
      class="fixed bottom-6 right-6 w-16 h-16 bg-primary text-on-primary rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out flex items-center justify-center z-50 group hover:scale-110 active:scale-95"
      [attr.aria-label]="isOpen() ? 'Close chat' : 'Open chat with SpringFood AI'"
    >
      <!-- SpringFood AI Logo/Icon -->
      <div class="relative">
        <!-- Chat Icon -->
        <svg 
          class="w-8 h-8 transition-transform group-hover:scale-110" 
          fill="currentColor" 
          viewBox="0 0 24 24"
        >
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
          <circle cx="8" cy="10" r="1.5"/>
          <circle cx="12" cy="10" r="1.5"/>
          <circle cx="16" cy="10" r="1.5"/>
        </svg>
        
        <!-- AI Badge -->
        <div class="absolute -top-1 -right-1 w-5 h-5 bg-secondary text-on-secondary rounded-full flex items-center justify-center text-[10px] font-bold shadow-md">
          AI
        </div>
        
        <!-- Online Status Indicator -->
        <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-tertiary border-2 border-surface rounded-full animate-pulse"></div>
      </div>
      
      <!-- Notification Badge (optional) -->
      @if (unreadCount() > 0) {
        <div class="absolute -top-2 -right-2 w-6 h-6 bg-error text-on-error rounded-full flex items-center justify-center text-xs font-bold shadow-md animate-bounce">
          {{ unreadCount() > 9 ? '9+' : unreadCount() }}
        </div>
      }
    </button>
  `,
  styles: [`
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }
    
    .animate-pulse {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    
    @keyframes bounce {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-4px);
      }
    }
    
    .animate-bounce {
      animation: bounce 1s infinite;
    }
  `]
})
export class ChatBubbleComponent {
  isOpen = input.required<boolean>();
  unreadCount = input(0);
  toggle = output<void>();
}

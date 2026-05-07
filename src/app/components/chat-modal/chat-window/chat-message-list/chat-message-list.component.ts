import { Component, ChangeDetectionStrategy, input, viewChild, ElementRef, effect } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ChatMessage } from '../../chat-modal.component';

@Component({
  selector: 'app-chat-message-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  template: `
    <div 
      #messageContainer
      class="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-surface-bright scroll-smooth"
    >
      @for (message of messages(); track message.id) {
        @if (message.isUser) {
          <!-- User Message -->
          <div class="flex gap-2 items-end justify-end animate-fade-in">
            <div class="flex flex-col gap-1 max-w-[80%] items-end">
              <div class="bg-primary text-on-primary p-3 rounded-2xl rounded-br-md shadow-md">
                <p class="text-sm leading-relaxed">{{ message.content }}</p>
              </div>
              <div class="flex items-center gap-1 px-1">
                <span class="text-[10px] text-outline">
                  {{ message.timestamp | date: 'shortTime' }}
                </span>
                @if (message.status) {
                  <svg 
                    class="w-4 h-4"
                    [class.text-primary]="message.status === 'read'"
                    [class.text-outline]="message.status !== 'read'"
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z"/>
                  </svg>
                }
              </div>
            </div>
          </div>
        } @else {
          <!-- Bot Message -->
          <div class="flex gap-2 items-end animate-fade-in">
            <div class="w-7 h-7 rounded-full overflow-hidden bg-primary-container flex-shrink-0 ring-2 ring-primary/10">
              <img 
                alt="AI Avatar" 
                class="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA4-VvemWLdpIcq7kDHsQiOyqScQb5M-LO76JQ_OGTix0LUfEMcPIKBC9a1UjGP2Cj41LedRZHPtzIvVcRkkG4Bqg5rzpl2x2Uto4kW-1cmkPuSx4WR7fGE4-4hSyjbGgvmJwAYpvTbdqvt__KIYtkLHsX5IbIGhShmMWuVwV3fDR_eT6p016fSKxI5EwLEUkOm9-aemt44JvWv7LghK07O3bFY5CzZVKN_AvUAsCFHVGR65wMzSDfbraUZ_MUrStDrxXr2kvue8y-6"
              />
            </div>
            <div class="flex flex-col gap-1 max-w-[80%]">
              <div class="bg-surface-container text-on-surface p-3 rounded-2xl rounded-bl-md shadow-sm">
                <p class="text-sm leading-relaxed">{{ message.content }}</p>
              </div>
              <span class="text-[10px] text-outline px-1">
                {{ message.timestamp | date: 'shortTime' }}
              </span>
            </div>
          </div>
        }
      }
      
      <!-- Typing Indicator -->
      @if (isTyping()) {
        <div class="flex gap-2 items-end animate-fade-in">
          <div class="w-7 h-7 rounded-full overflow-hidden bg-primary-container flex-shrink-0">
            <img 
              alt="AI Avatar" 
              class="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAMniJWXGEJsrVDPwGz_jo8bRWwVh6IdBilxtNf8BIy3Z_wPbKoKR1_r_jvBDEyFKC1QTGdr2Hq_PXxZefuvK8kSKSLGWS0OmkozvljDnreE1wDhi5YKpqcRvLp1i0HTqO-6ClV_m1w5KiTi3wM7Ozgl4B1aEmANu-o7cq7qKDLjHp2s8fBe9jOZDZKvSMmFmBvxmsPFY6lG1_9hQiU0bM9ILp7k-s8hWCstr65sEnawTiAsVhvVkiFEYk72YOB4Ox7rz6T8klZYeIU"
            />
          </div>
          <div class="bg-surface-container text-on-surface p-3 rounded-2xl rounded-bl-md shadow-sm">
            <div class="flex items-center gap-1">
              <div class="w-2 h-2 bg-outline rounded-full animate-bounce" style="animation-delay: 0ms"></div>
              <div class="w-2 h-2 bg-outline rounded-full animate-bounce" style="animation-delay: 150ms"></div>
              <div class="w-2 h-2 bg-outline rounded-full animate-bounce" style="animation-delay: 300ms"></div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes fade-in {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .animate-fade-in {
      animation: fade-in 0.3s ease-out;
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
      animation: bounce 0.6s infinite;
    }
    
    /* Custom scrollbar */
    ::-webkit-scrollbar {
      width: 6px;
    }
    
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    
    ::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 3px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(0, 0, 0, 0.3);
    }
  `]
})
export class ChatMessageListComponent {
  messages = input.required<ChatMessage[]>();
  isTyping = input.required<boolean>();
  
  private messageContainer = viewChild<ElementRef<HTMLDivElement>>('messageContainer');
  
  constructor() {
    // Auto-scroll to bottom when messages change
    effect(() => {
      const messages = this.messages();
      const isTyping = this.isTyping();
      
      // Trigger scroll after view update
      setTimeout(() => this.scrollToBottom(), 100);
    });
  }
  
  private scrollToBottom(): void {
    const container = this.messageContainer()?.nativeElement;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }
}

import { Component, ChangeDetectionStrategy, output } from '@angular/core';

@Component({
  selector: 'app-chat-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-between p-4 bg-[#4CAF50] text-white border-b border-[#45a049] flex-shrink-0">
      <div class="flex items-center gap-3">
        <!-- Avatar with online status -->
        <div class="relative">
          <div class="w-10 h-10 rounded-full overflow-hidden bg-white/20 ring-2 ring-white/30">
            <img 
              alt="SpringFood AI Support" 
              class="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCbw7HfGu3IqH9I4lKJXo1Xf84lN8xeyKia9n5do_0V96JKOdwR3V2hnNf9AohYcM78hXODQE93qouOm6gme5K6Qkwx4C3SFRhfrU0AZZVN3eZ8Umm32s1eYbvhMVO_UYIxMqBHI9U4FiLCXJWzXPk3pXhUr0Nq5XBWkLg7qMy6sRbGuNz9oACYzD8vB8CoSThAevzsBz1y68jDe-Ixzzhx0SRbIPs93saK4VELXwPRYYBpmMFmi7TJBQOEACzBpx_rFzj2h-6pwkwK"
            />
          </div>
          <div class="absolute bottom-0 right-0 w-3 h-3 bg-[#4CAF50] border-2 border-white rounded-full"></div>
        </div>
        
        <!-- Title and status -->
        <div class="flex flex-col">
          <h3 class="font-semibold text-sm flex items-center gap-2">
            SpringFood AI
            <span class="px-2 py-0.5 bg-[#FF9800] text-white text-[10px] rounded-full font-bold">
              BETA
            </span>
          </h3>
          <p class="text-xs opacity-90">Online • Typically replies instantly</p>
        </div>
      </div>
      
      <!-- Actions -->
      <div class="flex items-center gap-1">
        <button 
          (click)="close.emit()"
          class="p-2 hover:bg-white/20 rounded-full transition-colors"
          aria-label="Close chat"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>
  `
})
export class ChatHeaderComponent {
  close = output<void>();
}

import { Component, ChangeDetectionStrategy, input, output, signal, viewChild, ElementRef, effect } from '@angular/core';
import { ChatMessage } from '../chat-modal.component';
import { ChatHeaderComponent } from './chat-header/chat-header.component';
import { ChatMessageListComponent } from './chat-message-list/chat-message-list.component';
import { ChatInputComponent } from './chat-input/chat-input.component';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChatHeaderComponent, ChatMessageListComponent, ChatInputComponent],
  template: `
    <div 
      class="fixed bottom-6 right-6 w-[360px] h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 animate-slide-up pointer-events-auto"
    >
      <app-chat-header (close)="close.emit()" />
      
      <app-chat-message-list 
        [messages]="messages()"
        [isTyping]="isTyping()"
      />
      
      <app-chat-input (send)="sendMessage.emit($event)" />
    </div>
  `,
  styles: [`
    @keyframes slide-up {
      from {
        opacity: 0;
        transform: translateY(20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    
    .animate-slide-up {
      animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
  `]
})
export class ChatWindowComponent {
  messages = input.required<ChatMessage[]>();
  isTyping = input.required<boolean>();
  close = output<void>();
  sendMessage = output<string>();
}

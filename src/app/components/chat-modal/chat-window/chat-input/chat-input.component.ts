import { Component, ChangeDetectionStrategy, output, signal, viewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="p-4 bg-surface-container-lowest border-t border-outline-variant">
      <div class="flex items-end gap-2">
        <!-- Emoji Button -->
        <button 
          class="p-2 text-outline hover:text-on-surface hover:bg-surface-container rounded-full transition-all flex-shrink-0"
          aria-label="Add emoji"
          type="button"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </button>
        
        <!-- Attachment Button -->
        <button 
          class="p-2 text-outline hover:text-on-surface hover:bg-surface-container rounded-full transition-all flex-shrink-0"
          aria-label="Attach file"
          type="button"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
          </svg>
        </button>
        
        <!-- Input Field -->
        <div class="flex-1 relative">
          <textarea
            #messageInput
            [(ngModel)]="messageText"
            (keydown)="handleKeyDown($event)"
            class="w-full bg-surface-container text-on-surface border border-outline-variant rounded-2xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-outline resize-none max-h-32 min-h-[42px]"
            placeholder="Type your message..."
            rows="1"
            [attr.aria-label]="'Message input'"
          ></textarea>
        </div>
        
        <!-- Send Button -->
        <button 
          (click)="handleSend()"
          [disabled]="!messageText().trim()"
          [class.opacity-50]="!messageText().trim()"
          [class.cursor-not-allowed]="!messageText().trim()"
          class="p-3 bg-primary text-on-primary rounded-full hover:bg-primary/90 transition-all flex-shrink-0 disabled:hover:bg-primary shadow-md hover:shadow-lg active:scale-95"
          aria-label="Send message"
          type="button"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
      
      <!-- Character count (optional) -->
      @if (messageText().length > 0) {
        <div class="mt-2 text-xs text-outline text-right">
          {{ messageText().length }} / 1000
        </div>
      }
    </div>
  `,
  styles: [`
    textarea {
      field-sizing: content;
    }
  `]
})
export class ChatInputComponent {
  send = output<string>();
  
  messageText = signal('');
  private inputRef = viewChild<ElementRef<HTMLTextAreaElement>>('messageInput');
  
  handleSend(): void {
    const text = this.messageText().trim();
    if (text) {
      this.send.emit(text);
      this.messageText.set('');
      
      // Reset textarea height
      const textarea = this.inputRef()?.nativeElement;
      if (textarea) {
        textarea.style.height = 'auto';
      }
    }
  }
  
  handleKeyDown(event: KeyboardEvent): void {
    // Send on Enter, new line on Shift+Enter
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.handleSend();
    }
  }
}

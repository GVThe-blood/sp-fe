import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  effect,
  viewChild,
  ElementRef,
  signal,
  computed,
  HostListener,
  DestroyRef,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatHeaderComponent } from '../chat-header/chat-header.component';
import { MessageBubbleComponent } from '../message-bubble/message-bubble.component';
import { TypingIndicatorComponent } from '../typing-indicator/typing-indicator.component';
import { ChatInputComponent } from '../chat-input/chat-input.component';
import { ChatMessage, MessageButton } from '../../../models/chat-message.model';

const STORAGE_KEY = 'springfood-chat-window-size';
const MIN_WIDTH = 300;
const MIN_HEIGHT = 380;

interface PersistedSize {
  width: number;
  height: number;
  maximized: boolean;
}

@Component({
  selector: 'app-chat-window',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ChatHeaderComponent,
    MessageBubbleComponent,
    TypingIndicatorComponent,
    ChatInputComponent
  ],
  template: `
    <div
      class="chat-window"
      [class.maximized]="isMaximized()"
      [style.width.px]="!isMaximized() ? width() : null"
      [style.height.px]="!isMaximized() ? height() : null"
    >
      <!-- Resize handle ở góc trái-trên (chat window neo bottom-right) -->
      @if (!isMaximized()) {
        <div
          class="resize-handle"
          (mousedown)="startResize($event)"
          aria-label="Resize chat window"
          role="separator"
        ></div>
      }

      <app-chat-header
        [isConnected]="connectionState() === 'connected'"
        [connectionStatus]="getConnectionStatus()"
        [isMaximized]="isMaximized()"
        (close)="close.emit()"
        (newConversation)="newConversation.emit()"
        (toggleMaximize)="toggleMaximize()"
      />

      <div class="messages-container" #messagesContainer>
        <div class="messages-list">
          @for (message of messages(); track message.id) {
            <app-message-bubble
              [message]="message"
              (buttonClick)="buttonClick.emit($event)"
            />
          }

          @if (isTyping()) {
            <app-typing-indicator />
          }
        </div>
      </div>

      <app-chat-input
        (sendMessage)="sendMessage.emit($event)"
      />
    </div>
  `,
  styles: [`
    .chat-window {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 340px;
      height: 480px;
      max-height: calc(100vh - 40px);
      max-width: calc(100vw - 40px);
      min-width: 300px;
      min-height: 380px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 999;
      animation: slideUp 300ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .chat-window.maximized {
      top: 16px;
      left: 16px;
      right: 16px;
      bottom: 16px;
      width: auto !important;
      height: auto !important;
      max-width: none;
      max-height: none;
      border-radius: 16px;
    }

    .resize-handle {
      position: absolute;
      top: 0;
      left: 0;
      width: 16px;
      height: 16px;
      cursor: nwse-resize;
      z-index: 10;
      /* Visual hint: 2 đường chéo nhỏ */
      background:
        linear-gradient(135deg, transparent 40%, #9CA3AF 40%, #9CA3AF 50%, transparent 50%, transparent 70%, #9CA3AF 70%, #9CA3AF 80%, transparent 80%);
      border-top-left-radius: 12px;
      opacity: 0.6;
      transition: opacity 150ms ease;
    }

    .resize-handle:hover {
      opacity: 1;
    }

    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      background: white;
      scroll-behavior: smooth;
    }

    .messages-list {
      display: flex;
      flex-direction: column;
    }

    /* Custom Scrollbar */
    .messages-container::-webkit-scrollbar {
      width: 5px;
    }

    .messages-container::-webkit-scrollbar-track {
      background: transparent;
    }

    .messages-container::-webkit-scrollbar-thumb {
      background: #D1D5DB;
      border-radius: 3px;
      transition: background 300ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .messages-container::-webkit-scrollbar-thumb:hover {
      background: #9CA3AF;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    /* Mobile: ép full-screen, bỏ resize */
    @media (max-width: 640px) {
      .chat-window {
        width: calc(100vw - 16px) !important;
        height: calc(100vh - 16px) !important;
        right: 8px;
        bottom: 8px;
        min-width: 0;
        min-height: 0;
      }
      .resize-handle {
        display: none;
      }
    }
  `]
})
export class ChatWindowComponent {
  messages = input.required<ChatMessage[]>();
  isTyping = input<boolean>(false);
  connectionState = input<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  isMini = input<boolean>(true);

  close = output<void>();
  sendMessage = output<string>();
  buttonClick = output<MessageButton>();
  newConversation = output<void>();

  messagesContainer = viewChild<ElementRef>('messagesContainer');
  private destroyRef = inject(DestroyRef);

  // Window size state — persist trong localStorage để giữ qua reload.
  private initial = this.loadPersistedSize();
  width = signal<number>(this.initial.width);
  height = signal<number>(this.initial.height);
  isMaximized = signal<boolean>(this.initial.maximized);

  // Resize drag state
  private resizing = false;
  private startX = 0;
  private startY = 0;
  private startWidth = 0;
  private startHeight = 0;

  constructor() {
    // Auto-scroll to bottom when new messages arrive
    effect(() => {
      const messages = this.messages();
      const typing = this.isTyping();
      const container = this.messagesContainer()?.nativeElement;

      if (container && (messages.length > 0 || typing)) {
        setTimeout(() => {
          container.scrollTop = container.scrollHeight;
        }, 100);
      }
    });

    // Persist size khi width/height/maximized thay đổi
    effect(() => {
      const size: PersistedSize = {
        width: this.width(),
        height: this.height(),
        maximized: this.isMaximized()
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(size));
      } catch {
        // localStorage có thể bị disable trong incognito - bỏ qua
      }
    });

    this.destroyRef.onDestroy(() => this.endResize());
  }

  getConnectionStatus(): string {
    const state = this.connectionState();
    switch (state) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Connection Error';
      default: return 'Disconnected';
    }
  }

  toggleMaximize(): void {
    this.isMaximized.update(v => !v);
  }

  // ===== Drag resize (góc trái-trên kéo để mở rộng vì window neo bottom-right) =====

  startResize(event: MouseEvent): void {
    if (this.isMaximized()) return;
    event.preventDefault();
    this.resizing = true;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.startWidth = this.width();
    this.startHeight = this.height();
    document.body.style.userSelect = 'none';
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.resizing) return;
    // Vì window neo `bottom right`, kéo handle về phía trên-trái sẽ TĂNG kích thước.
    const dx = this.startX - event.clientX;
    const dy = this.startY - event.clientY;

    const maxW = window.innerWidth - 40;
    const maxH = window.innerHeight - 40;

    const newWidth = Math.min(maxW, Math.max(MIN_WIDTH, this.startWidth + dx));
    const newHeight = Math.min(maxH, Math.max(MIN_HEIGHT, this.startHeight + dy));

    this.width.set(newWidth);
    this.height.set(newHeight);
  }

  @HostListener('document:mouseup')
  endResize(): void {
    if (!this.resizing) return;
    this.resizing = false;
    document.body.style.userSelect = '';
  }

  private loadPersistedSize(): PersistedSize {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistedSize>;
        return {
          width: typeof parsed.width === 'number' && parsed.width >= MIN_WIDTH ? parsed.width : 340,
          height: typeof parsed.height === 'number' && parsed.height >= MIN_HEIGHT ? parsed.height : 480,
          maximized: !!parsed.maximized
        };
      }
    } catch {
      // ignore parse errors
    }
    return { width: 340, height: 480, maximized: false };
  }
}

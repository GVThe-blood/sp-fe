import { Component, ChangeDetectionStrategy, signal, computed, inject, effect } from '@angular/core';
import { ChatBubbleComponent } from './chat-bubble/chat-bubble.component';
import { ChatWindowComponent } from './chat-window/chat-window.component';
import { WebSocketService, AICardPayload, AIProductCard, AIShopCard } from '../../services/websocket.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import {
  ChatMessage,
  MessageBuilder,
  MessageButton,
  MessageCard
} from '../../models/chat-message.model';

const WELCOME_MESSAGE = 'Xin chào! Tôi là trợ lý AI của SpringFood. Tôi có thể giúp gì cho bạn? 🍜';

@Component({
  selector: 'app-chat-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChatBubbleComponent, ChatWindowComponent],
  template: `
    <app-chat-bubble
      [isOpen]="isOpen()"
      (toggle)="toggleChat()"
    />

    @if (isOpen()) {
      <app-chat-window
        [messages]="messages()"
        [isTyping]="isTyping()"
        [connectionState]="connectionState()"
        [isMini]="true"
        (close)="closeChat()"
        (sendMessage)="handleSendMessage($event)"
        (buttonClick)="handleButtonClick($event)"
        (newConversation)="startNewConversation()"
      />
    }
  `,
  styles: [`
    :host { display: contents; }
  `]
})
export class ChatModalComponent {
  private wsService = inject(WebSocketService);
  private authService = inject(AuthService);
  private toast = inject(NotificationService);

  // UI state signals
  isOpen = signal(false);
  /** Guards `startNewConversation` from being triggered while a clear is in flight. */
  private isClearing = signal(false);

  // Computed signals from WebSocket service
  isTyping = computed(() => this.wsService.isTyping());
  connectionState = computed(() => this.wsService.connectionState());
  isConnected = computed(() => this.wsService.isConnected());

  // Messages state
  messages = signal<ChatMessage[]>([
    MessageBuilder.text(WELCOME_MESSAGE, false)
  ]);

  constructor() {
    // Effect: Auto-connect WebSocket khi user authenticated
    effect(() => {
      const authenticated = this.authService.isAuthenticated();
      const state = this.wsService.connectionState();

      if (authenticated && state === 'disconnected') {
        console.log('[Chat] User authenticated, connecting WebSocket...');
        this.wsService.connect();
      } else if (!authenticated && state !== 'disconnected') {
        console.log('[Chat] User logged out, disconnecting WebSocket...');
        this.wsService.disconnect();
      }
    });

    // Effect: Listen for AI response chunks (signal có ts để đảm bảo trigger)
    effect(() => {
      const chunkData = this.wsService.aiChunk();
      if (chunkData.ts > 0 && chunkData.value) {
        this.appendToLastAIMessage(chunkData.value);
      }
    });

    // Effect: Listen for AI completion
    effect(() => {
      const completeData = this.wsService.aiComplete();
      if (completeData.ts > 0) {
        console.log('[Chat] AI response complete');
      }
    });

    // Effect: Listen for AI errors
    effect(() => {
      const errorData = this.wsService.aiError();
      if (errorData.ts > 0 && errorData.value) {
        console.error('[Chat] ❌ AI error:', errorData.value);
        this.addAIMessage('Xin lỗi, đã có lỗi xảy ra: ' + errorData.value);
      }
    });

    // Effect: Listen for AI cards (product + shop) gửi sau khi stream xong.
    // Render thẻ trực tiếp trong tin nhắn hội thoại.
    effect(() => {
      const cardData = this.wsService.aiCards();
      if (cardData.ts > 0 && cardData.value) {
        this.renderCardsMessage(cardData.value);
      }
    });
  }

  toggleChat(): void {
    if (this.isOpen()) this.closeChat();
    else this.openChat();
  }

  openChat(): void {
    this.isOpen.set(true);
    if (!this.isConnected() && this.authService.isAuthenticated()) {
      this.wsService.connect();
    }
  }

  closeChat(): void {
    this.isOpen.set(false);
  }

  /**
   * Tạo cuộc hội thoại mới: yêu cầu WebSocketService sinh conversationId mới
   * (format `ai-{userId}-{timestamp}`) → lần gọi BE tiếp theo sẽ tạo memory key
   * mới ở backend → coi như cuộc hội thoại độc lập, không cần xóa history cũ.
   *
   * Bảo vệ chống spam click bằng cờ `isClearing` (giữ tên cũ để không phá flow
   * code khác đang đọc nó).
   */
  startNewConversation(): void {
    if (!this.authService.isAuthenticated()) {
      this.toast.warning('Vui lòng đăng nhập để bắt đầu hội thoại mới');
      return;
    }
    if (this.isClearing()) return;
    this.isClearing.set(true);
    try {
      this.wsService.startNewConversation();
      this.messages.set([MessageBuilder.text(WELCOME_MESSAGE, false)]);
      this.toast.success('Đã bắt đầu hội thoại mới');
    } catch (err) {
      console.error('[Chat] Start new conversation failed:', err);
      this.toast.error('Không thể tạo hội thoại mới. Vui lòng thử lại.');
    } finally {
      this.isClearing.set(false);
    }
  }

  async handleSendMessage(content: string): Promise<void> {
    if (!content.trim()) return;

    if (!this.authService.isAuthenticated()) {
      this.messages.update(msgs => [...msgs, MessageBuilder.loginRequired()]);
      return;
    }

    if (!this.isConnected()) {
      console.log('[Chat] Not connected, force reconnecting...');
      this.wsService.disconnect();
      await new Promise(resolve => setTimeout(resolve, 200));
      this.wsService.connect();

      for (let i = 0; i < 50; i++) {
        if (this.isConnected()) break;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    if (!this.isConnected()) {
      this.addAIMessage('Kết nối bị gián đoạn. Vui lòng tải lại trang (F5). 🔌');
      return;
    }

    // Add user message + placeholder AI message
    this.messages.update(msgs => [
      ...msgs,
      MessageBuilder.text(content.trim(), true),
      MessageBuilder.text('', false)
    ]);

    try {
      this.wsService.sendAIMessage(content);
    } catch (error) {
      console.error('[Chat] ❌ Error sending message:', error);
      this.addAIMessage('Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau. 😔');
    }
  }

  handleButtonClick(button: MessageButton): void {
    console.log('[Chat] Button clicked:', button);

    switch (button.action.type) {
      case 'add_to_cart':
        // TODO: Integrate cart service add by productId
        console.log('Add to cart:', button.action.data);
        this.addAIMessage('✅ Đã thêm vào giỏ hàng!');
        break;

      case 'api_call':
        console.log('API call:', button.action.data);
        break;

      case 'emit_event':
        if (button.action.data?.event === 'continue_as_guest') {
          this.addAIMessage('Bạn đang tiếp tục với tư cách khách. Một số tính năng có thể bị giới hạn.');
        }
        break;
    }
  }

  // ============= Helpers =============

  private appendToLastAIMessage(chunk: string): void {
    this.messages.update(msgs => {
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg && !lastMsg.isUser) {
        const currentContent = typeof lastMsg.content === 'string'
          ? lastMsg.content
          : (lastMsg.content as any).text || '';
        const newContent = currentContent + chunk;
        return [...msgs.slice(0, -1), { ...lastMsg, content: newContent }];
      }
      return [...msgs, MessageBuilder.text(chunk, false)];
    });
  }

  private addAIMessage(content: string): void {
    this.messages.update(msgs => [...msgs, MessageBuilder.text(content, false)]);
  }

  /**
   * Convert payload từ BE thành carousel cards và push vào messages.
   * Hiển thị thẻ product/shop trực tiếp trong hội thoại sau khi AI text xong.
   */
  private renderCardsMessage(payload: AICardPayload): void {
    const cards: MessageCard[] = [];

    if (payload.products?.length) {
      for (const p of payload.products) {
        cards.push(this.toProductCard(p));
      }
    }
    if (payload.shops?.length) {
      for (const s of payload.shops) {
        cards.push(this.toShopCard(s));
      }
    }

    if (cards.length === 0) return;

    this.messages.update(msgs => [...msgs, MessageBuilder.carousel(cards)]);
  }

  private toProductCard(p: AIProductCard): MessageCard {
    const priceNum = typeof p.price === 'number' ? p.price : Number(p.price);
    const priceText = isFinite(priceNum)
      ? priceNum.toLocaleString('vi-VN') + ' ₫'
      : '';
    return {
      title: p.name,
      subtitle: priceText,
      description: p.description || (p.shopName ? 'Cửa hàng: ' + p.shopName : ''),
      image: p.image
        ? { url: p.image, alt: p.name, aspectRatio: '1/1' }
        : undefined,
      buttons: [
        {
          id: `view-product-${p.id}`,
          label: 'Xem chi tiết',
          action: {
            type: 'view_product',
            label: 'Xem',
            data: { productId: p.id },
            style: 'primary'
          }
        },
        {
          id: `add-cart-${p.id}`,
          label: 'Thêm vào giỏ',
          action: {
            type: 'add_to_cart',
            label: 'Thêm',
            data: { productId: p.id, quantity: 1 },
            style: 'success'
          }
        }
      ]
    };
  }

  private toShopCard(s: AIShopCard): MessageCard {
    const subtitleParts: string[] = [];
    if (s.totalProducts != null) subtitleParts.push(s.totalProducts + ' sản phẩm');
    if (s.totalSold != null) subtitleParts.push('Đã bán: ' + s.totalSold);
    return {
      title: s.name,
      subtitle: subtitleParts.join(' · ') || undefined,
      description: s.introduction,
      image: s.logo ? { url: s.logo, alt: s.name, aspectRatio: '16/9' } : undefined,
      buttons: [
        {
          id: `view-shop-${s.id}`,
          label: 'Xem cửa hàng',
          action: {
            type: 'view_shop',
            label: 'Xem',
            data: { shopId: s.id },
            style: 'primary'
          }
        }
      ]
    };
  }
}

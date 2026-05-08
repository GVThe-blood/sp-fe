import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { 
  RichMessageContent, 
  MessageButton, 
  MessageCard, 
  MessageImage,
  ActionType 
} from '../../../models/chat-message.model';

@Component({
  selector: 'app-rich-message',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="rich-message">
      <!-- Text Content -->
      @if (content().text) {
        <p class="message-text">{{ content().text }}</p>
      }

      <!-- Images -->
      @if (content().images && content().images!.length > 0) {
        <div class="message-images">
          @for (image of content().images; track image.url) {
            <img 
              [src]="image.url" 
              [alt]="image.alt || 'Image'"
              [style.width]="image.width"
              [style.height]="image.height"
              [style.aspect-ratio]="image.aspectRatio"
              class="message-image"
            />
          }
        </div>
      }

      <!-- Buttons -->
      @if (content().buttons && content().buttons!.length > 0) {
        <div class="message-buttons">
          @for (button of content().buttons; track button.id) {
            <button
              [class]="'message-button ' + (button.action.style || 'secondary')"
              [disabled]="button.disabled"
              (click)="handleButtonClick(button)"
            >
              @if (button.action.icon) {
                <span class="button-icon">{{ button.action.icon }}</span>
              }
              <span class="button-label">{{ button.label }}</span>
            </button>
          }
        </div>
      }

      <!-- Cards -->
      @if (content().cards && content().cards!.length > 0) {
        <div class="message-cards" [class.carousel]="content().cards!.length > 1">
          @for (card of content().cards; track $index) {
            <div class="message-card">
              @if (card.image) {
                <img 
                  [src]="card.image.url" 
                  [alt]="card.image.alt || card.title"
                  [style.aspect-ratio]="card.image.aspectRatio || '16/9'"
                  class="card-image"
                />
              }
              
              <div class="card-content">
                @if (card.title) {
                  <h3 class="card-title">{{ card.title }}</h3>
                }
                
                @if (card.subtitle) {
                  <p class="card-subtitle">{{ card.subtitle }}</p>
                }
                
                @if (card.description) {
                  <p class="card-description">{{ card.description }}</p>
                }
                
                @if (card.buttons && card.buttons.length > 0) {
                  <div class="card-buttons">
                    @for (button of card.buttons; track button.id) {
                      <button
                        [class]="'card-button ' + (button.action.style || 'secondary')"
                        [disabled]="button.disabled"
                        (click)="handleButtonClick(button)"
                      >
                        {{ button.label }}
                      </button>
                    }
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .rich-message {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .message-text {
      margin: 0;
      font-size: 0.8125rem;
      line-height: 1.5;
      white-space: pre-wrap;
      color: inherit;
    }

    /* Images */
    .message-images {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .message-image {
      max-width: 100%;
      border-radius: 8px;
      object-fit: cover;
    }

    /* Buttons */
    .message-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 4px;
    }

    .message-button {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border: none;
      border-radius: 8px;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
      white-space: nowrap;
    }

    .message-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .message-button.primary {
      background: linear-gradient(135deg, #3B82F6 0%, #A855F7 100%);
      color: white;
    }

    .message-button.primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .message-button.secondary {
      background: #F3F4F6;
      color: #1F2937;
    }

    .message-button.secondary:hover:not(:disabled) {
      background: #E5E7EB;
    }

    .message-button.success {
      background: #10B981;
      color: white;
    }

    .message-button.success:hover:not(:disabled) {
      background: #059669;
    }

    .message-button.danger {
      background: #EF4444;
      color: white;
    }

    .message-button.danger:hover:not(:disabled) {
      background: #DC2626;
    }

    .message-button.link {
      background: transparent;
      color: #3B82F6;
      padding: 4px 8px;
    }

    .message-button.link:hover:not(:disabled) {
      text-decoration: underline;
    }

    .button-icon {
      font-size: 1rem;
    }

    .button-label {
      line-height: 1;
    }

    /* Cards */
    .message-cards {
      display: flex;
      gap: 12px;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: thin;
      scrollbar-color: #CBD5E1 transparent;
    }

    .message-cards::-webkit-scrollbar {
      height: 6px;
    }

    .message-cards::-webkit-scrollbar-track {
      background: transparent;
    }

    .message-cards::-webkit-scrollbar-thumb {
      background: #CBD5E1;
      border-radius: 3px;
    }

    .message-cards.carousel {
      padding-bottom: 8px;
    }

    .message-card {
      flex: 0 0 auto;
      width: 220px;
      background: white;
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      overflow: hidden;
      scroll-snap-align: start;
      transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .message-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    .card-image {
      width: 100%;
      object-fit: cover;
      display: block;
    }

    .card-content {
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .card-title {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 700;
      color: #1F2937;
      line-height: 1.3;
    }

    .card-subtitle {
      margin: 0;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #3B82F6;
      line-height: 1.2;
    }

    .card-description {
      margin: 0;
      font-size: 0.75rem;
      color: #6B7280;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .card-buttons {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-top: 4px;
    }

    .card-button {
      width: 100%;
      padding: 8px 12px;
      border: none;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .card-button.primary {
      background: linear-gradient(135deg, #3B82F6 0%, #A855F7 100%);
      color: white;
    }

    .card-button.primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
    }

    .card-button.secondary {
      background: #F3F4F6;
      color: #1F2937;
    }

    .card-button.secondary:hover:not(:disabled) {
      background: #E5E7EB;
    }

    .card-button.success {
      background: #10B981;
      color: white;
    }

    .card-button.success:hover:not(:disabled) {
      background: #059669;
    }

    .card-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class RichMessageComponent {
  content = input.required<RichMessageContent>();
  buttonClick = output<MessageButton>();

  constructor(private router: Router) {}

  handleButtonClick(button: MessageButton): void {
    if (button.disabled) return;

    console.log('[RichMessage] Button clicked:', button);

    // Handle built-in actions
    switch (button.action.type) {
      case 'navigate':
        if (button.action.data) {
          this.router.navigate([button.action.data]);
        }
        break;

      case 'open_url':
        if (button.action.data) {
          window.open(button.action.data, '_blank');
        }
        break;

      case 'login':
        this.router.navigate(['/login']);
        break;

      case 'view_product':
        if (button.action.data?.productId) {
          this.router.navigate(['/products', button.action.data.productId]);
        }
        break;

      case 'view_shop':
        if (button.action.data?.shopId) {
          this.router.navigate(['/shops', button.action.data.shopId]);
        }
        break;

      default:
        // Emit custom action for parent to handle
        this.buttonClick.emit(button);
        break;
    }
  }
}

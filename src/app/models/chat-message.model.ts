/**
 * Rich Message System for SpringFood AI Chat
 * Supports text, buttons, images, cards, and custom components
 */

export type MessageType = 'text' | 'rich' | 'card' | 'carousel';

export type ActionType = 
  | 'navigate'      // Navigate to route
  | 'open_url'      // Open external URL
  | 'api_call'      // Call API endpoint
  | 'emit_event'    // Emit custom event
  | 'login'         // Trigger login
  | 'add_to_cart'   // Add product to cart
  | 'view_product'  // View product detail
  | 'view_shop'     // View shop detail
  | 'custom';       // Custom action

export interface MessageAction {
  type: ActionType;
  label: string;
  data?: any;
  style?: 'primary' | 'secondary' | 'success' | 'danger' | 'link';
  icon?: string;
}

export interface MessageButton {
  id: string;
  label: string;
  action: MessageAction;
  disabled?: boolean;
}

export interface MessageImage {
  url: string;
  alt?: string;
  width?: string;
  height?: string;
  aspectRatio?: string;
}

export interface MessageCard {
  title?: string;
  subtitle?: string;
  description?: string;
  image?: MessageImage;
  buttons?: MessageButton[];
}

export interface RichMessageContent {
  text?: string;
  buttons?: MessageButton[];
  images?: MessageImage[];
  cards?: MessageCard[];
  component?: {
    name: string;
    props?: Record<string, any>;
  };
}

export interface ChatMessage {
  id: string;
  content: string | RichMessageContent;
  timestamp: Date;
  isUser: boolean;
  status?: 'sent' | 'delivered' | 'read';
  senderId?: string;
  senderName?: string;
  type?: MessageType;
}

/**
 * Helper functions to create rich messages
 */
export class MessageBuilder {
  /**
   * Create text message
   */
  static text(content: string, isUser: boolean = false): ChatMessage {
    return {
      id: Date.now().toString(),
      content,
      timestamp: new Date(),
      isUser,
      type: 'text',
      status: 'delivered'
    };
  }

  /**
   * Create rich message with buttons
   */
  static withButtons(text: string, buttons: MessageButton[]): ChatMessage {
    return {
      id: Date.now().toString(),
      content: {
        text,
        buttons
      },
      timestamp: new Date(),
      isUser: false,
      type: 'rich',
      status: 'delivered'
    };
  }

  /**
   * Create card message
   */
  static card(card: MessageCard): ChatMessage {
    return {
      id: Date.now().toString(),
      content: {
        cards: [card]
      },
      timestamp: new Date(),
      isUser: false,
      type: 'card',
      status: 'delivered'
    };
  }

  /**
   * Create carousel message (multiple cards)
   */
  static carousel(cards: MessageCard[]): ChatMessage {
    return {
      id: Date.now().toString(),
      content: {
        cards
      },
      timestamp: new Date(),
      isUser: false,
      type: 'carousel',
      status: 'delivered'
    };
  }

  /**
   * Create login required message with button
   */
  static loginRequired(): ChatMessage {
    return this.withButtons(
      '🔒 Bạn cần đăng nhập để sử dụng tính năng chat AI.\n\nVui lòng đăng nhập để tiếp tục trò chuyện với SpringFood AI Assistant.',
      [
        {
          id: 'login-btn',
          label: 'Đăng nhập ngay',
          action: {
            type: 'login',
            label: 'Đăng nhập',
            style: 'primary'
          }
        },
        {
          id: 'continue-guest',
          label: 'Tiếp tục với khách',
          action: {
            type: 'emit_event',
            label: 'Tiếp tục',
            data: { event: 'continue_as_guest' },
            style: 'secondary'
          }
        }
      ]
    );
  }

  /**
   * Create product recommendation message
   */
  static productRecommendation(products: any[]): ChatMessage {
    const cards: MessageCard[] = products.map(product => ({
      title: product.name,
      subtitle: `${product.price.toLocaleString('vi-VN')} ₫`,
      description: product.description,
      image: {
        url: product.imageUrl,
        alt: product.name,
        aspectRatio: '1/1'
      },
      buttons: [
        {
          id: `view-${product.id}`,
          label: 'Xem chi tiết',
          action: {
            type: 'view_product',
            label: 'Xem',
            data: { productId: product.id },
            style: 'primary'
          }
        },
        {
          id: `add-${product.id}`,
          label: 'Thêm vào giỏ',
          action: {
            type: 'add_to_cart',
            label: 'Thêm',
            data: { productId: product.id, quantity: 1 },
            style: 'success'
          }
        }
      ]
    }));

    return this.carousel(cards);
  }

  /**
   * Parse AI response to rich message
   * Supports markdown-like syntax for buttons and actions
   * 
   * Example:
   * "Check out our menu! [View Menu](action:navigate:/menu)"
   * "Login to continue [Login](action:login)"
   */
  static parseAIResponse(text: string): ChatMessage {
    // Check if text contains action buttons
    const buttonRegex = /\[([^\]]+)\]\(action:([^:]+):?([^)]*)\)/g;
    const matches = [...text.matchAll(buttonRegex)];

    if (matches.length === 0) {
      // Plain text message
      return this.text(text);
    }

    // Extract buttons and clean text
    const buttons: MessageButton[] = [];
    let cleanText = text;

    matches.forEach((match, index) => {
      const [fullMatch, label, actionType, actionData] = match;
      
      buttons.push({
        id: `btn-${index}`,
        label,
        action: {
          type: actionType as ActionType,
          label,
          data: actionData ? JSON.parse(actionData) : undefined,
          style: actionType === 'login' ? 'primary' : 'secondary'
        }
      });

      // Remove button syntax from text
      cleanText = cleanText.replace(fullMatch, '');
    });

    return this.withButtons(cleanText.trim(), buttons);
  }
}

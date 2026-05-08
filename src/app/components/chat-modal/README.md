# Chat Modal Component

Modern Angular 19 chatbot component với SpringFood AI branding.

## 🎯 Features

- ✅ **Angular 19 Signals** - Reactive state management với signals
- ✅ **Standalone Components** - Không cần NgModule
- ✅ **OnPush Change Detection** - Optimal performance
- ✅ **Control Flow Syntax** - `@if`, `@for` thay vì `*ngIf`, `*ngFor`
- ✅ **Responsive Design** - Mobile-friendly
- ✅ **Smooth Animations** - Fade in, slide up, bounce effects
- ✅ **Typing Indicator** - Real-time typing animation
- ✅ **Message Status** - Sent, delivered, read indicators
- ✅ **Auto-scroll** - Tự động scroll xuống khi có tin nhắn mới
- ✅ **Keyboard Shortcuts** - Enter để gửi, Shift+Enter để xuống dòng

## 📁 Component Structure

```
chat-modal/
├── chat-modal.component.ts          # Main container component
├── chat-bubble/
│   └── chat-bubble.component.ts     # Floating chat button
└── chat-window/
    ├── chat-window.component.ts     # Chat window container
    ├── chat-header/
    │   └── chat-header.component.ts # Header với avatar & status
    ├── chat-message-list/
    │   └── chat-message-list.component.ts # Message list với auto-scroll
    └── chat-input/
        └── chat-input.component.ts  # Input field với emoji & attachment buttons
```

## 🚀 Usage

### 1. Import vào app.component.ts

```typescript
import { ChatModalComponent } from './components/chat-modal/chat-modal.component';

@Component({
  imports: [ChatModalComponent],
  template: `
    <router-outlet></router-outlet>
    <app-chat-modal></app-chat-modal>
  `
})
export class AppComponent {}
```

### 2. Component đã được thêm vào app.component.html

```html
<app-chat-modal></app-chat-modal>
```

## 🎨 Design System

Component sử dụng Material Design 3 tokens:

- `bg-primary` - Primary color
- `bg-surface-container` - Surface colors
- `text-on-primary` - Text colors
- `border-outline-variant` - Border colors

## 💬 Message Interface

```typescript
export interface ChatMessage {
  id: string;
  content: string;
  timestamp: Date;
  isUser: boolean;
  status?: 'sent' | 'delivered' | 'read';
}
```

## 🔌 API Integration (TODO)

Hiện tại component sử dụng mock data. Để tích hợp API:

1. Tạo `ChatService` trong `src/app/services/`
2. Inject service vào `ChatModalComponent`
3. Replace mock response trong `handleSendMessage()` method

```typescript
// Example API integration
handleSendMessage(content: string): void {
  const newMessage: ChatMessage = {
    id: Date.now().toString(),
    content: content.trim(),
    timestamp: new Date(),
    isUser: true,
    status: 'sent'
  };

  this.messages.update(msgs => [...msgs, newMessage]);
  this.isTyping.set(true);

  // Call API
  this.chatService.sendMessage(content).subscribe({
    next: (response) => {
      this.isTyping.set(false);
      const botResponse: ChatMessage = {
        id: response.id,
        content: response.content,
        timestamp: new Date(response.timestamp),
        isUser: false
      };
      this.messages.update(msgs => [...msgs, botResponse]);
    },
    error: (error) => {
      this.isTyping.set(false);
      console.error('Failed to send message:', error);
    }
  });
}
```

## 🎭 Animations

- **Fade In** - Messages fade in khi xuất hiện
- **Slide Up** - Chat window slide up từ dưới lên
- **Bounce** - Typing indicator dots bounce
- **Pulse** - Online status indicator pulse
- **Scale** - Button scale on hover/click

## 🎯 Key Features

### Chat Bubble
- Floating button ở góc dưới bên phải
- SpringFood AI branding với AI badge
- Online status indicator (pulse animation)
- Unread count badge (optional)
- Smooth scale animation on hover

### Chat Window
- Fixed position ở góc dưới bên phải
- 360px width x 600px height
- Rounded corners với shadow
- Slide up animation khi mở

### Chat Header
- SpringFood AI avatar
- Online status
- Beta badge
- Close button

### Message List
- Auto-scroll to bottom
- Typing indicator
- Message status (sent/delivered/read)
- Timestamp
- Custom scrollbar
- Smooth fade-in animation

### Chat Input
- Multi-line textarea
- Auto-resize
- Emoji button (placeholder)
- Attachment button (placeholder)
- Send button (disabled khi empty)
- Character count
- Enter to send, Shift+Enter for new line

## 🔧 Customization

### Colors
Thay đổi colors trong Tailwind config hoặc inline styles.

### Avatar
Thay đổi avatar URL trong các component:
- `chat-header.component.ts`
- `chat-message-list.component.ts`

### Position
Thay đổi position trong:
- `chat-bubble.component.ts`: `bottom-6 right-6`
- `chat-window.component.ts`: `bottom-6 right-6`

### Size
Thay đổi size trong `chat-window.component.ts`:
```typescript
class="... w-[360px] h-[600px] ..."
```

## 📱 Responsive

Component responsive cho mobile:
- Chat window chiếm full width trên mobile
- Buttons và inputs scale phù hợp
- Touch-friendly tap targets

## ♿ Accessibility

- ARIA labels cho buttons
- Keyboard navigation
- Focus management
- Screen reader friendly

## 🐛 Known Issues

- Emoji picker chưa implement
- File attachment chưa implement
- Message persistence chưa có (messages mất khi refresh)
- API integration chưa có

## 📝 TODO

- [ ] Implement emoji picker
- [ ] Implement file attachment
- [ ] Add message persistence (localStorage/API)
- [ ] Add API integration
- [ ] Add message search
- [ ] Add chat history
- [ ] Add typing indicator for multiple users
- [ ] Add message reactions
- [ ] Add message editing/deletion
- [ ] Add rich text formatting
- [ ] Add image preview
- [ ] Add voice messages
- [ ] Add video calls
- [ ] Add notification sound
- [ ] Add unread count
- [ ] Add chat export
- [ ] Add dark mode support
- [ ] Add i18n support

## 🎓 Angular 19 Patterns Used

1. **Signals** - `signal()`, `computed()`, `effect()`
2. **Signal Inputs** - `input()`, `input.required()`
3. **Signal Outputs** - `output()`
4. **Control Flow** - `@if`, `@for`
5. **OnPush Change Detection** - Optimal performance
6. **Standalone Components** - No NgModule needed
7. **inject()** - Dependency injection
8. **viewChild()** - Query DOM elements
9. **effect()** - Side effects (auto-scroll)

## 📚 References

- [Angular 19 Signals](https://angular.dev/guide/signals)
- [Angular 19 Control Flow](https://angular.dev/guide/templates/control-flow)
- [Material Design 3](https://m3.material.io/)

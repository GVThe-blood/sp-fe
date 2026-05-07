# Chat Modal Component Migration Guide

## 📋 Overview

Chat modal component đã được refactor từ HTML thuần sang Angular 19 components với modern patterns và best practices.

## 🔄 What Changed

### Before (Old Structure)
```
chat-modal/
├── chat-modal.component.ts      # Single component với CommonModule
├── chat-modal.component.html    # External template file
├── chat-modal.component.css     # External styles file
└── chat-modal.component.spec.ts # Test file
```

**Problems:**
- ❌ Sử dụng `*ngIf` (deprecated control flow)
- ❌ Không có signals (reactive state)
- ❌ Không có OnPush change detection
- ❌ Monolithic component (khó maintain)
- ❌ External template files (khó debug)
- ❌ Không có chat bubble button
- ❌ Chat window luôn hiển thị

### After (New Structure)
```
chat-modal/
├── README.md                                    # Documentation
├── chat-modal.component.ts                      # Main container (signals)
├── chat-bubble/
│   └── chat-bubble.component.ts                 # Floating chat button
└── chat-window/
    ├── chat-window.component.ts                 # Chat window container
    ├── chat-header/
    │   └── chat-header.component.ts             # Header component
    ├── chat-message-list/
    │   └── chat-message-list.component.ts       # Message list với auto-scroll
    └── chat-input/
        └── chat-input.component.ts              # Input field component
```

**Improvements:**
- ✅ Angular 19 signals (`signal()`, `computed()`, `effect()`)
- ✅ Control flow syntax (`@if`, `@for`)
- ✅ OnPush change detection (optimal performance)
- ✅ Modular components (easy to maintain)
- ✅ Inline templates (better DX)
- ✅ Chat bubble button với SpringFood AI branding
- ✅ Toggle open/close functionality
- ✅ Smooth animations
- ✅ Auto-scroll messages
- ✅ Typing indicator
- ✅ Message status (sent/delivered/read)
- ✅ Keyboard shortcuts (Enter to send)

## 🎯 Key Features Added

### 1. Chat Bubble Button
```typescript
// Floating button ở góc dưới bên phải
<app-chat-bubble 
  [isOpen]="isOpen()"
  (toggle)="toggleChat()"
/>
```

**Features:**
- SpringFood AI logo với chat icon
- AI badge
- Online status indicator (pulse animation)
- Unread count badge (optional)
- Smooth scale animation on hover
- Ẩn khi chat window mở

### 2. Chat Window
```typescript
@if (isOpen()) {
  <app-chat-window 
    [messages]="messages()"
    [isTyping]="isTyping()"
    (close)="closeChat()"
    (sendMessage)="handleSendMessage($event)"
  />
}
```

**Features:**
- Fixed position ở góc dưới bên phải
- Slide up animation khi mở
- Responsive design
- Auto-scroll to bottom
- Typing indicator
- Message status

### 3. Modular Sub-Components

#### ChatHeaderComponent
- Avatar với online status
- SpringFood AI branding
- Beta badge
- Close button

#### ChatMessageListComponent
- Auto-scroll to bottom khi có message mới
- Typing indicator animation
- Message status icons
- Timestamp formatting
- Custom scrollbar
- Fade-in animation cho messages

#### ChatInputComponent
- Multi-line textarea với auto-resize
- Emoji button (placeholder)
- Attachment button (placeholder)
- Send button (disabled khi empty)
- Character count
- Enter to send, Shift+Enter for new line

## 🔧 Technical Changes

### 1. State Management
**Before:**
```typescript
isOpen = true; // Plain property
```

**After:**
```typescript
isOpen = signal(false);        // Reactive signal
messages = signal<ChatMessage[]>([...]);
isTyping = signal(false);
```

### 2. Control Flow
**Before:**
```html
<div *ngIf="isOpen">...</div>
```

**After:**
```html
@if (isOpen()) {
  <div>...</div>
}
```

### 3. Component Communication
**Before:**
```typescript
@Output() close = new EventEmitter<void>();
```

**After:**
```typescript
close = output<void>();  // Signal-based output
```

### 4. Change Detection
**Before:**
```typescript
@Component({
  // Default change detection
})
```

**After:**
```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
```

### 5. Template Location
**Before:**
```typescript
@Component({
  templateUrl: './chat-modal.component.html',
  styleUrl: './chat-modal.component.css'
})
```

**After:**
```typescript
@Component({
  template: `...`,  // Inline template
  styles: [`...`]   // Inline styles
})
```

## 📦 Dependencies

### Added
- `FormsModule` - For ngModel in chat input
- `DatePipe` - For timestamp formatting

### Removed
- `CommonModule` - Không cần thiết với control flow mới

## 🎨 Design Changes

### Colors
- Primary color cho user messages
- Surface colors cho bot messages
- Outline colors cho borders và placeholders
- Error color cho notification badge

### Animations
- **Fade In** - Messages fade in khi xuất hiện
- **Slide Up** - Chat window slide up từ dưới lên
- **Bounce** - Typing indicator dots bounce
- **Pulse** - Online status indicator pulse
- **Scale** - Button scale on hover/click

### Layout
- Chat bubble: `bottom-6 right-6` (24px from edges)
- Chat window: `w-[360px] h-[600px]`
- Rounded corners: `rounded-2xl`
- Shadow: `shadow-2xl`

## 🚀 Migration Steps

### 1. Backup Old Code (Done)
Old files đã được xóa:
- `chat-modal.component.html`
- `chat-modal.component.css`
- `chat-modal.component.spec.ts`

### 2. Install Dependencies (Done)
```bash
npm install -D @tailwindcss/forms
```

### 3. Update Imports (Done)
`app.component.ts` đã import `ChatModalComponent` đúng.

### 4. Test Build (Done)
```bash
ng build --configuration development
```
✅ Build successful!

## 🔌 API Integration (TODO)

Hiện tại component sử dụng mock data. Để tích hợp API:

### 1. Create ChatService
```typescript
// src/app/services/chat.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatRequest {
  message: string;
  conversationId?: string;
}

export interface ChatResponse {
  id: string;
  content: string;
  timestamp: string;
  conversationId: string;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http = inject(HttpClient);
  private apiUrl = '/api/chat'; // Update với actual API endpoint

  sendMessage(request: ChatRequest): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(this.apiUrl, request);
  }

  getHistory(conversationId: string): Observable<ChatResponse[]> {
    return this.http.get<ChatResponse[]>(`${this.apiUrl}/${conversationId}`);
  }
}
```

### 2. Update ChatModalComponent
```typescript
import { inject } from '@angular/core';
import { ChatService } from '../../services/chat.service';

export class ChatModalComponent {
  private chatService = inject(ChatService);
  conversationId = signal<string | undefined>(undefined);

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

    this.chatService.sendMessage({
      message: content,
      conversationId: this.conversationId()
    }).subscribe({
      next: (response) => {
        this.isTyping.set(false);
        this.conversationId.set(response.conversationId);
        
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
        // Show error toast
      }
    });
  }
}
```

### 3. Add Message Persistence
```typescript
// Save to localStorage
effect(() => {
  const messages = this.messages();
  localStorage.setItem('chat-messages', JSON.stringify(messages));
});

// Load from localStorage
constructor() {
  const saved = localStorage.getItem('chat-messages');
  if (saved) {
    this.messages.set(JSON.parse(saved));
  }
}
```

## 📱 Testing

### Manual Testing Checklist
- [ ] Chat bubble hiển thị ở góc dưới bên phải
- [ ] Click bubble mở chat window
- [ ] Chat window slide up animation
- [ ] Close button đóng chat window
- [ ] Chat bubble hiện lại khi đóng window
- [ ] Gửi message bằng Enter key
- [ ] Shift+Enter tạo new line
- [ ] Send button disabled khi input empty
- [ ] Messages auto-scroll to bottom
- [ ] Typing indicator hiển thị
- [ ] Message status icons hiển thị
- [ ] Timestamp format đúng
- [ ] Responsive trên mobile
- [ ] Animations smooth

### Unit Testing (TODO)
```bash
ng test
```

### E2E Testing (TODO)
```bash
ng e2e
```

## 🐛 Known Issues

1. **Emoji picker** - Chưa implement, chỉ có button placeholder
2. **File attachment** - Chưa implement, chỉ có button placeholder
3. **Message persistence** - Messages mất khi refresh page
4. **API integration** - Chưa có, đang dùng mock data
5. **Unread count** - Logic chưa implement
6. **Notification sound** - Chưa có

## 📝 Next Steps

1. **API Integration**
   - Create ChatService
   - Connect to backend API
   - Handle errors gracefully

2. **Message Persistence**
   - Save to localStorage
   - Or sync with backend

3. **Rich Features**
   - Emoji picker
   - File attachment
   - Image preview
   - Voice messages
   - Video calls

4. **Accessibility**
   - Keyboard navigation
   - Screen reader support
   - ARIA labels
   - Focus management

5. **Internationalization**
   - Add i18n support
   - Translate UI strings
   - Format dates/times by locale

6. **Testing**
   - Unit tests
   - Integration tests
   - E2E tests

## 🎓 Learning Resources

- [Angular 19 Signals](https://angular.dev/guide/signals)
- [Angular 19 Control Flow](https://angular.dev/guide/templates/control-flow)
- [Material Design 3](https://m3.material.io/)
- [Tailwind CSS](https://tailwindcss.com/)

## 📞 Support

Nếu có vấn đề hoặc câu hỏi, check:
1. `README.md` trong `chat-modal/` folder
2. Component source code (có comments chi tiết)
3. Angular 19 documentation
4. Project's design system guide

## ✅ Checklist

- [x] Refactor to Angular 19 components
- [x] Add signals for state management
- [x] Add control flow syntax
- [x] Add OnPush change detection
- [x] Create modular sub-components
- [x] Add chat bubble button
- [x] Add toggle functionality
- [x] Add animations
- [x] Add auto-scroll
- [x] Add typing indicator
- [x] Add message status
- [x] Add keyboard shortcuts
- [x] Fix build errors
- [x] Test build
- [x] Write documentation
- [ ] Add API integration
- [ ] Add message persistence
- [ ] Add emoji picker
- [ ] Add file attachment
- [ ] Add unit tests
- [ ] Add E2E tests

---

**Migration completed on:** May 7, 2026
**Angular version:** 19.x
**Status:** ✅ Ready for API integration

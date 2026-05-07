# Chat Modal Quick Start Guide

## 🚀 5-Minute Setup

### 1. Component đã được tích hợp sẵn
Component đã được import trong `app.component.ts` và sẵn sàng sử dụng!

```typescript
// app.component.ts
import { ChatModalComponent } from './components/chat-modal/chat-modal.component';

@Component({
  imports: [ChatModalComponent],
  template: `
    <router-outlet></router-outlet>
    <app-chat-modal></app-chat-modal>
  `
})
```

### 2. Chạy development server
```bash
ng serve
```

### 3. Mở browser
```
http://localhost:4200
```

### 4. Test features
- ✅ Click vào chat bubble ở góc dưới bên phải
- ✅ Chat window sẽ slide up
- ✅ Gõ message và nhấn Enter để gửi
- ✅ Xem typing indicator animation
- ✅ Click nút X để đóng chat

## 🎯 Basic Usage

### Toggle Chat
```typescript
// Chat bubble tự động toggle khi click
// Không cần code gì thêm!
```

### Send Message
```typescript
// Gõ message trong input field
// Nhấn Enter để gửi
// Hoặc click nút Send
```

### Keyboard Shortcuts
```
Enter: Gửi message
Shift+Enter: Xuống dòng mới
Escape: Đóng chat (future)
```

## 🔌 API Integration (Next Step)

### Step 1: Create ChatService
```bash
ng generate service services/chat
```

### Step 2: Add API endpoint
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
  private apiUrl = 'YOUR_API_ENDPOINT'; // TODO: Update this

  sendMessage(request: ChatRequest): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(this.apiUrl, request);
  }
}
```

### Step 3: Update ChatModalComponent
```typescript
// src/app/components/chat-modal/chat-modal.component.ts
import { inject } from '@angular/core';
import { ChatService } from '../../services/chat.service';

export class ChatModalComponent {
  private chatService = inject(ChatService);

  handleSendMessage(content: string): void {
    // Add user message
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
    this.chatService.sendMessage({ message: content }).subscribe({
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
}
```

### Step 4: Update environment
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  chatApiUrl: 'http://localhost:8080/api/chat' // Your API endpoint
};
```

## 🎨 Customization

### Change Colors
```typescript
// Update Tailwind classes in components
// Primary color: bg-primary, text-on-primary
// Surface color: bg-surface-container
```

### Change Position
```typescript
// chat-bubble.component.ts & chat-window.component.ts
class="... bottom-6 right-6 ..."  // Change to bottom-4 left-4 for bottom-left
```

### Change Size
```typescript
// chat-window.component.ts
class="... w-[360px] h-[600px] ..."  // Change to w-[400px] h-[700px]
```

### Change Avatar
```typescript
// chat-header.component.ts & chat-message-list.component.ts
src="YOUR_AVATAR_URL"
```

## 📱 Mobile Responsive

Component tự động responsive:
- Desktop: 360px × 600px
- Tablet: 360px × 500px
- Mobile: Full width - 32px

## 🐛 Troubleshooting

### Chat bubble không hiển thị
```bash
# Check console for errors
# Verify app.component.html has <app-chat-modal></app-chat-modal>
```

### Messages không gửi được
```bash
# Check if API endpoint is correct
# Check network tab in DevTools
# Verify CORS settings on backend
```

### Styling bị lỗi
```bash
# Rebuild Tailwind
ng build --configuration development
```

### TypeScript errors
```bash
# Clear cache and rebuild
rm -rf node_modules/.cache
ng build
```

## 📚 Documentation

- **README.md** - Full documentation
- **DESIGN.md** - Design specifications
- **MIGRATION.md** - Migration guide from old version
- **QUICKSTART.md** - This file

## 🎓 Learn More

### Angular 19 Features Used
- [Signals](https://angular.dev/guide/signals)
- [Control Flow](https://angular.dev/guide/templates/control-flow)
- [Standalone Components](https://angular.dev/guide/components/importing)

### Design System
- [Material Design 3](https://m3.material.io/)
- [Tailwind CSS](https://tailwindcss.com/)

## ✅ Checklist

- [x] Component installed
- [x] Build successful
- [x] Chat bubble visible
- [x] Chat window opens/closes
- [x] Messages display correctly
- [x] Animations working
- [ ] API integrated
- [ ] Message persistence added
- [ ] Production ready

## 🎯 Next Steps

1. **Test thoroughly**
   - Click chat bubble
   - Send messages
   - Test keyboard shortcuts
   - Test on mobile

2. **Integrate API**
   - Create ChatService
   - Connect to backend
   - Handle errors

3. **Add features**
   - Emoji picker
   - File attachment
   - Message persistence
   - Notification sound

4. **Deploy**
   - Build for production
   - Test on staging
   - Deploy to production

## 💡 Tips

- Use Chrome DevTools to inspect components
- Check Angular DevTools for signal values
- Use Network tab to debug API calls
- Test on different screen sizes
- Check accessibility with screen reader

## 🆘 Need Help?

1. Check documentation in `README.md`
2. Review component source code (có comments chi tiết)
3. Check Angular 19 documentation
4. Ask team members

---

**Status:** ✅ Ready to use
**Version:** 1.0.0
**Last Updated:** May 7, 2026

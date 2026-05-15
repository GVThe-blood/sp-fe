# SpringFood AI Chat - Quick Reference

## 🚀 Quick Start

### Start Backend
```bash
cd f:\Document\TASC\Backend\springfood-microservice\chat
mvn spring-boot:run
```

### Start Frontend
```bash
cd f:\Document\TASC\Frontend\Springfood-frontend\springfood
npm start
```

### Test Chat
1. Open `http://localhost:4200`
2. Click green chat bubble (bottom-right)
3. Type message and send
4. AI responds in 2-3 seconds

## 📡 API Endpoints

### REST (Active)
```bash
# Send message
POST http://localhost:8080/api/chat/ai-assistant/chat
Body: { "message": "Xin chào" }

# Stream response
GET http://localhost:8080/api/chat/ai-assistant/chat/stream?message=hello

# Clear history
DELETE http://localhost:8080/api/chat/ai-assistant/history/ai-1
```

### WebSocket (Pending JWT)
```typescript
// Connect
ws://localhost:9098/ws
Headers: { Authorization: "Bearer <JWT>" }

// Send
Destination: /app/ai-assistant/chat
Body: { "message": "Xin chào" }

// Receive
Subscribe: /user/queue/ai-assistant/response
Subscribe: /user/queue/ai-assistant/complete
Subscribe: /user/queue/ai-assistant/error
```

## 💻 Code Examples

### Send Message (REST)
```typescript
import { WebSocketService } from './services/websocket.service';

constructor(private wsService: WebSocketService) {}

async sendMessage(message: string) {
  try {
    const response = await this.wsService.sendAIMessageREST(message);
    console.log('AI:', response.response);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### Clear History
```typescript
async clearHistory() {
  try {
    await this.wsService.clearAIHistory();
    console.log('History cleared');
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### WebSocket (Future)
```typescript
// Connect
this.wsService.connect();

// Send message
this.wsService.sendAIMessage('Xin chào');

// Listen for chunks
effect(() => {
  const chunk = this.wsService.aiChunk();
  if (chunk) console.log('Chunk:', chunk);
});

// Listen for completion
effect(() => {
  const complete = this.wsService.aiComplete();
  if (complete) console.log('Complete:', complete);
});

// Disconnect
this.wsService.disconnect();
```

## 🔧 Configuration

### Backend URLs
```typescript
// Development
REST_API = 'http://localhost:8080/api/chat'
WS_URL = 'ws://localhost:9098/ws'

// Production
REST_API = 'https://your-domain.com/api/chat'
WS_URL = 'wss://your-domain.com/ws'
```

### Update in Code
```typescript
// File: src/app/services/websocket.service.ts

// Line 89: WebSocket URL
brokerURL: 'ws://localhost:9098/ws',

// Line 165: REST API URL
fetch('http://localhost:8080/api/chat/ai-assistant/chat', {
```

## 🐛 Troubleshooting

### Connection Refused
```bash
# Check services
curl http://localhost:9098/management/health  # Chat
curl http://localhost:8080/management/health  # Gateway

# Check ports
netstat -ano | findstr "9098"
netstat -ano | findstr "8080"
```

### Empty Response
```bash
# Check API key
cat chat/.env

# Should contain:
GEMINI_API_KEY=your-key-here
```

### CORS Error
```yaml
# File: chat/src/main/resources/config/application.yml
spring:
  websocket:
    allowed-origins: 'http://localhost:4200'
```

## 📊 Message Structure

### Request
```typescript
interface AIMessageRequest {
  message: string;
  conversationId?: string;  // Optional, auto-generated
}
```

### Response
```typescript
interface AIMessageResponse {
  conversationId: string;   // "ai-1", "ai-2", etc.
  message: string;          // User's message
  response: string;         // AI's response
  timestamp: string;        // ISO 8601 format
}
```

### Chat Message (UI)
```typescript
interface ChatMessage {
  id: string;
  content: string;
  timestamp: Date;
  isUser: boolean;
  status?: 'sent' | 'delivered' | 'read';
  senderId?: string;
  senderName?: string;
}
```

## 🎯 Key Concepts

### One Conversation Per User
```typescript
// Each user has ONE persistent conversation
conversationId = "ai-" + userId
// Example: "ai-1", "ai-2", etc.

// History maintained across sessions
// Last 10 messages stored
```

### Authentication
```typescript
// REST API: No auth required (via Gateway)
// WebSocket: JWT required in handshake

// Future: Add JWT token
connectHeaders: {
  Authorization: `Bearer ${jwtToken}`
}
```

### Connection States
```typescript
type ConnectionState = 
  | 'disconnected'  // Not connected
  | 'connecting'    // Connecting...
  | 'connected'     // Connected
  | 'error';        // Connection error
```

## 📁 File Structure

```
src/app/
├── services/
│   └── websocket.service.ts       # WebSocket + REST API
├── components/
│   └── chat-modal/
│       ├── chat-modal.component.ts      # Container
│       ├── chat-bubble/
│       │   └── chat-bubble.component.ts # FAB button
│       └── chat-window/
│           └── chat-window.component.ts # Chat UI
└── docs/
    ├── AI_CHAT_INTEGRATION.md           # Full guide
    ├── TESTING_AI_CHAT.md               # Test guide
    ├── INTEGRATION_SUMMARY.md           # Summary
    └── AI_CHAT_QUICK_REFERENCE.md       # This file
```

## 🔑 Environment Variables

### Backend (.env in chat/)
```bash
GEMINI_API_KEY=your-api-key-here
GEMINI_MODEL=gemini-1.5-flash
```

### Frontend (environment.ts)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080',
  wsUrl: 'ws://localhost:9098/ws'
};
```

## 📈 Performance

### Expected Metrics
- Message send: < 100ms
- AI response: 2-3 seconds
- UI update: < 16ms (60 FPS)
- Memory: < 50 MB
- Bundle size: ~819 KB (raw), ~183 KB (gzipped)

### Rate Limits (Gemini Free Tier)
- 15 requests/minute (gemini-1.5-flash)
- 2 requests/minute (gemini-1.5-pro fallback)
- 1,000,000 tokens/month

## 🧪 Testing Commands

### Manual API Test
```bash
# Send message
curl -X POST http://localhost:8080/api/chat/ai-assistant/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Xin chào"}'

# Stream response
curl -N http://localhost:8080/api/chat/ai-assistant/chat/stream?message=hello

# Clear history
curl -X DELETE http://localhost:8080/api/chat/ai-assistant/history/ai-1
```

### Browser Console Test
```javascript
// Get service instance
const wsService = document.querySelector('app-root').__ngContext__[8].wsService;

// Send message
wsService.sendAIMessageREST('Xin chào').then(r => console.log(r));

// Check state
console.log(wsService.connectionState());
```

## 📚 Documentation

- **Full Guide:** [AI_CHAT_INTEGRATION.md](./AI_CHAT_INTEGRATION.md)
- **Testing:** [TESTING_AI_CHAT.md](./TESTING_AI_CHAT.md)
- **Summary:** [INTEGRATION_SUMMARY.md](./INTEGRATION_SUMMARY.md)
- **Backend:** `../../Backend/springfood-microservice/chat/AI-QUICK-START.md`

## 🎯 Status

- ✅ REST API: Working
- ⏳ WebSocket: Pending JWT
- ✅ UI Components: Complete
- ✅ Error Handling: Complete
- ✅ Documentation: Complete
- ⏳ Authentication: Pending
- ⏳ Production: Pending

## 💡 Tips

1. **Use REST API for now** - WebSocket needs JWT
2. **Each user = one conversation** - conversationId = "ai-" + userId
3. **Backend is FREE** - Gemini API free tier
4. **Check backend logs** - Helpful for debugging
5. **Test locally first** - Before deploying

## 🆘 Support

**Issues?**
1. Check [TESTING_AI_CHAT.md](./TESTING_AI_CHAT.md)
2. Check backend logs
3. Check browser console
4. Check network tab
5. Ask team for help

**Common Solutions:**
- Restart backend services
- Clear browser cache
- Check API key
- Verify CORS config
- Check port availability

---

**Quick Reference Version:** 1.0

**Last Updated:** 2024-01-01

**Status:** ✅ Ready to Use

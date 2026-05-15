# SpringFood AI Chat Integration

## 🎯 Overview

Frontend Angular 19 chat modal đã được tích hợp với backend SpringFood AI Assistant service.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Angular 19)                     │
├─────────────────────────────────────────────────────────────┤
│  ChatModalComponent                                          │
│    ├─ ChatBubbleComponent (FAB button)                      │
│    └─ ChatWindowComponent (Chat UI)                         │
│                                                              │
│  WebSocketService                                            │
│    ├─ REST API (sendAIMessageREST) ✅ ACTIVE               │
│    └─ WebSocket (sendAIMessage) ⏳ PENDING JWT             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓ HTTP/WebSocket
┌─────────────────────────────────────────────────────────────┐
│                   API Gateway (Port 8080)                    │
│  - Extracts user info from JWT                              │
│  - Sets UserContextHolder                                   │
│  - Routes to chat service                                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Chat Service (Port 9098)                    │
├─────────────────────────────────────────────────────────────┤
│  AIAssistantController                                       │
│    ├─ POST /api/ai-assistant/chat (REST)                   │
│    ├─ GET /api/ai-assistant/chat/stream (SSE)              │
│    ├─ /app/ai-assistant/chat (WebSocket)                   │
│    └─ DELETE /api/ai-assistant/history/{id}                │
│                                                              │
│  AIAssistantService                                          │
│    ├─ Spring AI ChatClient                                  │
│    ├─ Conversation history (10 messages)                    │
│    └─ Gemini 1.5 Flash (FREE tier)                         │
└─────────────────────────────────────────────────────────────┘
```

## 📡 API Endpoints

### REST API (✅ Currently Used)

**1. Send Chat Message**
```typescript
POST http://localhost:8080/api/chat/ai-assistant/chat
Content-Type: application/json

{
  "message": "Gợi ý món ăn ngon",
  "conversationId": "ai-1" // Optional, auto-generated
}

Response:
{
  "conversationId": "ai-1",
  "message": "Gợi ý món ăn ngon",
  "response": "Tôi gợi ý bạn thử...",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**2. Stream Chat Response (SSE)**
```typescript
GET http://localhost:8080/api/chat/ai-assistant/chat/stream?message=Xin%20chào
Accept: text/event-stream

Response: (streaming chunks)
data: Xin
data:  chào
data: !
...
```

**3. Clear History**
```typescript
DELETE http://localhost:8080/api/chat/ai-assistant/history/ai-1
```

### WebSocket API (⏳ Pending JWT Implementation)

**Connect:**
```typescript
ws://localhost:9098/ws
Headers: {
  Authorization: "Bearer <JWT_TOKEN>"
}
```

**Send Message:**
```typescript
Destination: /app/ai-assistant/chat
Body: {
  "message": "Xin chào",
  "conversationId": "ai-1"
}
```

**Receive Responses:**
```typescript
Subscribe: /user/queue/ai-assistant/response  // Streaming chunks
Subscribe: /user/queue/ai-assistant/complete  // Completion signal
Subscribe: /user/queue/ai-assistant/error     // Error messages
```

## 🔐 Authentication

### Current Status: REST API (No Auth Required)

REST endpoints go through API Gateway which:
1. Extracts user info from JWT (if present)
2. Sets `UserContextHolder` with user context
3. Routes to chat service

**Frontend doesn't need to send JWT token for REST endpoints.**

### Future: WebSocket (JWT Required)

WebSocket protocol requires authentication in handshake:
```typescript
connectHeaders: {
  Authorization: `Bearer ${jwtToken}`
}
```

**TODO:** Implement authentication service to get JWT token.

## 💾 Conversation Management

### One Persistent Conversation Per User

Each user has **ONE** persistent conversation with AI:
```typescript
conversationId = "ai-" + userId
// Example: "ai-1", "ai-2", etc.
```

### Conversation History

- Backend stores last **10 messages** per conversation
- History is maintained across sessions
- Can be cleared via DELETE endpoint

## 🎨 Frontend Components

### 1. WebSocketService

**Location:** `src/app/services/websocket.service.ts`

**Features:**
- ✅ REST API integration (active)
- ✅ WebSocket configuration (ready for JWT)
- ✅ RxJS + Angular 19 Signals
- ✅ Error handling
- ✅ Connection state management

**Methods:**
```typescript
// REST API (currently used)
sendAIMessageREST(message: string): Promise<AIMessageResponse>
clearAIHistory(): Promise<void>

// WebSocket (pending JWT)
connect(): void
disconnect(): void
sendAIMessage(message: string): void
```

### 2. ChatModalComponent

**Location:** `src/app/components/chat-modal/chat-modal.component.ts`

**Features:**
- ✅ Message history management
- ✅ Typing indicator
- ✅ Error handling
- ✅ Real-time UI updates with Signals

### 3. ChatWindowComponent

**Location:** `src/app/components/chat-modal/chat-window/chat-window.component.ts`

**Features:**
- ✅ Message list with auto-scroll
- ✅ Input field with send button
- ✅ Connection status indicator
- ✅ SpringFood branding (#4CAF50)

### 4. ChatBubbleComponent

**Location:** `src/app/components/chat-modal/chat-bubble/chat-bubble.component.ts`

**Features:**
- ✅ Floating Action Button (FAB)
- ✅ Draggable position
- ✅ SpringFood green color

## 🚀 Usage

### Basic Chat Flow

1. User opens chat modal (clicks FAB button)
2. User types message and sends
3. Frontend calls `sendAIMessageREST(message)`
4. Backend processes with Gemini AI
5. Response displayed in chat window

### Example Code

```typescript
// In your component
import { WebSocketService } from './services/websocket.service';

constructor(private wsService: WebSocketService) {}

async sendMessage(message: string) {
  try {
    const response = await this.wsService.sendAIMessageREST(message);
    console.log('AI Response:', response.response);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## 🔧 Configuration

### Backend URLs

**Development:**
```typescript
// REST API (via Gateway)
const API_BASE_URL = 'http://localhost:8080/api/chat';

// WebSocket (direct to service)
const WS_URL = 'ws://localhost:9098/ws';
```

**Production:**
```typescript
// Update these in websocket.service.ts
const API_BASE_URL = 'https://your-domain.com/api/chat';
const WS_URL = 'wss://your-domain.com/ws';
```

### CORS Configuration

Backend already configured to allow:
```yaml
spring:
  websocket:
    allowed-origins: 'http://localhost:3000,http://localhost:8080,http://localhost:9000'
```

Add your frontend URL if different.

## 🐛 Troubleshooting

### 1. Connection Refused

**Problem:** Cannot connect to backend

**Solution:**
```bash
# Check if chat service is running
curl http://localhost:9098/management/health

# Check if API Gateway is running
curl http://localhost:8080/management/health
```

### 2. CORS Error

**Problem:** CORS policy blocking requests

**Solution:**
- Add your frontend URL to `allowed-origins` in backend config
- Restart chat service

### 3. 401 Unauthorized (WebSocket)

**Problem:** WebSocket connection rejected

**Solution:**
- WebSocket requires JWT token in handshake
- Use REST API until authentication is implemented
- Or get JWT token from login and add to `connectHeaders`

### 4. Empty Response

**Problem:** AI returns empty response

**Solution:**
- Check if `GEMINI_API_KEY` is set in backend `.env`
- Check backend logs for API errors
- Verify Gemini API quota

## 📝 TODO

### High Priority

- [ ] Implement authentication service
- [ ] Get JWT token from login
- [ ] Enable WebSocket with JWT
- [ ] Test streaming responses

### Medium Priority

- [ ] Add message persistence (localStorage)
- [ ] Add conversation history UI
- [ ] Add clear history button
- [ ] Add retry mechanism for failed messages

### Low Priority

- [ ] Add message reactions
- [ ] Add file upload support
- [ ] Add voice input
- [ ] Add dark mode support

## 🎯 Next Steps

1. **Test REST API Integration**
   ```bash
   # Start backend services
   cd chat
   mvn spring-boot:run
   
   # Start frontend
   cd springfood
   npm start
   
   # Open chat and send message
   ```

2. **Implement Authentication**
   - Create `AuthService` in frontend
   - Store JWT token in localStorage
   - Update `WebSocketService` to use token

3. **Enable WebSocket Streaming**
   - Add JWT token to WebSocket handshake
   - Test streaming responses
   - Handle connection errors

4. **Production Deployment**
   - Update URLs to production endpoints
   - Configure SSL/TLS for WebSocket (wss://)
   - Set up monitoring and logging

## 📚 References

- [Backend AI Quick Start](../../Backend/springfood-microservice/chat/AI-QUICK-START.md)
- [Backend AI Integration Guide](../../Backend/springfood-microservice/chat/AI-ASSISTANT-INTEGRATION.md)
- [Spring AI Documentation](https://docs.spring.io/spring-ai/reference/)
- [@stomp/rx-stomp Documentation](https://stomp-js.github.io/rx-stomp/)
- [Angular 19 Signals Guide](https://angular.dev/guide/signals)

## 💡 Tips

1. **Use REST API for now** - WebSocket requires JWT which isn't implemented yet
2. **Each user has ONE conversation** - conversationId = "ai-" + userId
3. **Backend is FREE** - Using Gemini API free tier (15 req/min)
4. **Streaming works** - Backend supports SSE for real-time responses
5. **History is persistent** - Last 10 messages stored per user

## 🎉 Success Criteria

- ✅ Chat modal opens and closes
- ✅ User can send messages
- ✅ AI responds with relevant answers
- ✅ Messages display in chat window
- ✅ Typing indicator shows during AI processing
- ✅ Error messages display on failure
- ⏳ WebSocket streaming (pending JWT)
- ⏳ Conversation history persistence (pending)

---

**Status:** ✅ REST API Integration Complete | ⏳ WebSocket Pending JWT

**Last Updated:** 2024-01-01

**Maintainer:** SpringFood Development Team

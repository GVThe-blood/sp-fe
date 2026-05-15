# 🚀 WebSocket Quick Reference

## 📡 Connection

```typescript
// Auto-connect in component
constructor() {
  this.wsService.connect();
}

// Manual connect/disconnect
this.wsService.connect();
this.wsService.disconnect();
```

## 📤 Send Message

```typescript
// Send AI message
this.wsService.sendAIMessage('Xin chào');

// Check connection first
if (this.wsService.isConnected()) {
  this.wsService.sendAIMessage(message);
}
```

## 📥 Receive Messages

```typescript
// Listen for AI chunks (streaming)
effect(() => {
  const chunk = this.wsService.aiChunk();
  if (chunk) {
    console.log('Chunk:', chunk);
  }
});

// Listen for completion
effect(() => {
  const complete = this.wsService.aiComplete();
  if (complete) {
    console.log('Complete');
  }
});

// Listen for errors
effect(() => {
  const error = this.wsService.aiError();
  if (error) {
    console.error('Error:', error);
  }
});
```

## 🔍 Check State

```typescript
// Connection state
const state = this.wsService.connectionState(); // 'disconnected' | 'connecting' | 'connected' | 'error'

// Computed signals
const isConnected = this.wsService.isConnected();
const isConnecting = this.wsService.isConnecting();
const hasError = this.wsService.hasError();

// Typing indicator
const isTyping = this.wsService.isTyping();
```

## 🎯 STOMP Destinations

### Send to Server
```
/app/ai-assistant/chat     → AI chat
```

### Receive from Server
```
/user/queue/ai-assistant/response  → AI chunks
/user/queue/ai-assistant/complete  → Complete signal
/user/queue/ai-assistant/error     → Errors
```

## 🔐 Authentication

```typescript
// JWT token from cookies (automatic)
// Or from localStorage (fallback)

// Check authentication
const hasToken = this.checkAuthentication();
```

## 🐛 Debug

```typescript
// Enable verbose logging
localStorage.setItem('debug', 'stomp:*');

// Check connection
console.log('State:', this.wsService.connectionState());
console.log('Connected:', this.wsService.isConnected());

// Check token
console.log('Cookies:', document.cookie);
console.log('Token:', localStorage.getItem('access_token'));
```

## 📊 Console Logs

### Success Flow
```
[WebSocket] Connecting to SpringFood AI Assistant...
[WebSocket] Authenticating with JWT token
[WebSocket] ✅ Connected to SpringFood AI Assistant
[Chat] 📤 Sending message to AI: { length: 8, connected: true }
[Chat] 📨 Received AI chunk: Xin...
[Chat] ✅ AI response complete
```

### Error Flow
```
[WebSocket] ❌ Connection error: Connection refused
[WebSocket] ❌ STOMP error: Authentication failed
[Chat] ❌ AI error: Rate limit exceeded
```

## 🔧 Configuration

```typescript
// WebSocket URL
brokerURL: 'ws://localhost:9098/ws'

// Heartbeat
heartbeatIncoming: 10000  // 10s
heartbeatOutgoing: 10000  // 10s

// Reconnect
reconnectDelay: 5000      // 5s

// Timeout
connectionTimeout: 10000  // 10s
```

## 🧪 Test Commands

```bash
# Start backend
cd chat && mvn spring-boot:run

# Start frontend
cd springfood && npm start

# Test connection
curl http://localhost:9098/actuator/health

# Open test client
start test-resources\websocket-angular-test.html
```

## 📚 Documentation

- Backend: `chat/WEBSOCKET-INTEGRATION-GUIDE.md`
- Frontend: `WEBSOCKET-CHAT-INTEGRATION.md`
- Summary: `../Backend/WEBSOCKET-INTEGRATION-SUMMARY.md`

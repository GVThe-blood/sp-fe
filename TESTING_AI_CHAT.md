# Testing SpringFood AI Chat

## 🧪 Quick Test Guide

### Prerequisites

1. **Backend Services Running**
   ```bash
   # Terminal 1: Start Chat Service
   cd f:\Document\TASC\Backend\springfood-microservice\chat
   mvn spring-boot:run
   
   # Terminal 2: Start API Gateway (if not running)
   cd f:\Document\TASC\Backend\springfood-microservice\api-gateway
   mvn spring-boot:run
   ```

2. **Gemini API Key Configured**
   ```bash
   # Check if .env exists in chat service
   cat f:\Document\TASC\Backend\springfood-microservice\chat\.env
   
   # Should contain:
   GEMINI_API_KEY=your-api-key-here
   ```

3. **Frontend Running**
   ```bash
   cd f:\Document\TASC\Frontend\Springfood-frontend\springfood
   npm start
   ```

### Test Scenarios

#### ✅ Test 1: Basic Chat Flow

1. Open browser: `http://localhost:4200`
2. Click green chat bubble (bottom-right corner)
3. Chat window opens with welcome message
4. Type: "Xin chào"
5. Press Enter or click Send
6. **Expected:** AI responds in Vietnamese

**Success Criteria:**
- ✅ Chat bubble visible and clickable
- ✅ Chat window opens smoothly
- ✅ Message sent successfully
- ✅ AI response appears within 2-3 seconds
- ✅ Typing indicator shows during processing

#### ✅ Test 2: Multiple Messages

1. Send: "Gợi ý món ăn ngon"
2. Wait for response
3. Send: "Món nào phổ biến nhất?"
4. Wait for response
5. Send: "Giá bao nhiêu?"

**Expected:** AI maintains context and provides relevant answers

**Success Criteria:**
- ✅ All messages sent successfully
- ✅ AI responses are contextually relevant
- ✅ Message history preserved
- ✅ Scroll works properly

#### ✅ Test 3: Error Handling

1. Stop backend services
2. Try sending message
3. **Expected:** Error message displayed

**Success Criteria:**
- ✅ Error message: "Xin lỗi, đã có lỗi xảy ra..."
- ✅ No crash or blank screen
- ✅ Can retry after backend restarts

#### ✅ Test 4: UI/UX

1. **Draggable Bubble:**
   - Drag chat bubble to different positions
   - **Expected:** Bubble moves smoothly

2. **Auto-scroll:**
   - Send multiple messages
   - **Expected:** Chat scrolls to latest message

3. **Input Field:**
   - Type long message
   - **Expected:** Input expands properly

4. **Close/Open:**
   - Close chat window
   - Open again
   - **Expected:** Messages preserved

### Manual API Testing

#### Test REST Endpoint Directly

```bash
# Test via API Gateway (no auth required)
curl -X POST http://localhost:8080/api/chat/ai-assistant/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Xin chào"
  }'

# Expected Response:
{
  "conversationId": "ai-1",
  "message": "Xin chào",
  "response": "Xin chào! Tôi là trợ lý AI của SpringFood...",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### Test Streaming Endpoint

```bash
# Test SSE streaming
curl -N http://localhost:8080/api/chat/ai-assistant/chat/stream?message=Xin%20chào

# Expected: Streaming chunks
data: Xin
data:  chào
data: !
...
```

### Browser Console Testing

Open browser console (F12) and run:

```javascript
// Test WebSocket Service
const wsService = document.querySelector('app-root').__ngContext__[8].wsService;

// Send message via REST
wsService.sendAIMessageREST('Xin chào').then(response => {
  console.log('Response:', response);
});

// Check connection state
console.log('Connection:', wsService.connectionState());
```

### Common Issues & Solutions

#### 1. "Cannot connect to backend"

**Symptoms:**
- Error message in chat
- Console shows network error

**Solutions:**
```bash
# Check if services are running
curl http://localhost:9098/management/health  # Chat service
curl http://localhost:8080/management/health  # API Gateway

# Check ports
netstat -ano | findstr "9098"
netstat -ano | findstr "8080"
```

#### 2. "Empty AI response"

**Symptoms:**
- Message sent but no response
- Backend logs show API error

**Solutions:**
```bash
# Check Gemini API key
cat chat/.env

# Check backend logs
# Look for: "Gemini API error" or "Rate limit exceeded"

# Verify API key at: https://aistudio.google.com/app/apikey
```

#### 3. "CORS error"

**Symptoms:**
- Browser console shows CORS error
- Request blocked by browser

**Solutions:**
```yaml
# Add frontend URL to backend config
# File: chat/src/main/resources/config/application.yml
spring:
  websocket:
    allowed-origins: 'http://localhost:4200,http://localhost:3000,http://localhost:8080'
```

#### 4. "Chat bubble not visible"

**Symptoms:**
- No chat bubble on page
- Console shows component error

**Solutions:**
```typescript
// Check if ChatModalComponent is imported in app.component.ts
import { ChatModalComponent } from './components/chat-modal/chat-modal.component';

// Check if it's in template
<app-chat-modal />
```

### Performance Testing

#### Response Time

```bash
# Measure API response time
time curl -X POST http://localhost:8080/api/chat/ai-assistant/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Xin chào"}'

# Expected: < 3 seconds
```

#### Concurrent Users

```bash
# Send 10 concurrent requests
for i in {1..10}; do
  curl -X POST http://localhost:8080/api/chat/ai-assistant/chat \
    -H "Content-Type: application/json" \
    -d "{\"message\": \"Test $i\"}" &
done
wait

# Expected: All succeed (may hit rate limit)
```

### Monitoring

#### Backend Logs

```bash
# Watch chat service logs
tail -f chat/logs/spring.log

# Look for:
# - "REST AI chat - user: 1, conversation: ai-1"
# - "AI response generated successfully"
# - Any errors or warnings
```

#### Frontend Console

```javascript
// Enable verbose logging
localStorage.setItem('debug', 'stomp:*');

// Reload page and check console for STOMP debug messages
```

### Test Checklist

- [ ] Backend services running (chat + gateway)
- [ ] Gemini API key configured
- [ ] Frontend running on port 4200
- [ ] Chat bubble visible
- [ ] Chat window opens/closes
- [ ] Can send messages
- [ ] AI responds correctly
- [ ] Typing indicator works
- [ ] Error handling works
- [ ] Message history preserved
- [ ] Auto-scroll works
- [ ] Draggable bubble works
- [ ] No console errors
- [ ] Response time < 3s
- [ ] Vietnamese language support

### Success Metrics

**Functional:**
- ✅ 100% message delivery rate
- ✅ < 3s average response time
- ✅ 0 crashes or blank screens
- ✅ Proper error messages

**UX:**
- ✅ Smooth animations
- ✅ Responsive UI
- ✅ Clear visual feedback
- ✅ Intuitive interactions

**Technical:**
- ✅ No memory leaks
- ✅ No console errors
- ✅ Proper cleanup on destroy
- ✅ Efficient re-renders

### Next Steps After Testing

1. **If all tests pass:**
   - ✅ Mark integration as complete
   - 📝 Document any issues found
   - 🚀 Deploy to staging

2. **If tests fail:**
   - 🐛 Debug and fix issues
   - 🔄 Re-run tests
   - 📊 Update documentation

3. **Future enhancements:**
   - 🔐 Add JWT authentication
   - 📡 Enable WebSocket streaming
   - 💾 Add message persistence
   - 🎨 Add more UI features

---

**Test Status:** ⏳ Ready for Testing

**Last Updated:** 2024-01-01

**Tester:** _______________

**Test Date:** _______________

**Result:** [ ] PASS | [ ] FAIL

**Notes:**
_______________________________________
_______________________________________
_______________________________________

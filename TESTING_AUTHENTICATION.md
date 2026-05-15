# Testing Chat Authentication Flow

## Overview

This guide helps you test the authentication check in the chat modal.

---

## Test Scenarios

### Scenario 1: User Not Logged In ❌

**Setup:**
1. Clear all cookies and localStorage
2. Open chat modal
3. Try to send a message

**Expected Behavior:**
```
User types: "Hello"
User clicks Send

AI Response (gray bubble):
🔒 Bạn cần đăng nhập để sử dụng tính năng chat AI.

Vui lòng đăng nhập để tiếp tục trò chuyện với SpringFood AI Assistant.

Console:
[Chat] User not authenticated. Please login first.
```

**Verification:**
- [ ] Message does NOT send to backend
- [ ] Login required message appears
- [ ] Message has lock emoji 🔒
- [ ] Message is in gray bubble (AI style)
- [ ] Console shows warning
- [ ] Input field clears after attempt

---

### Scenario 2: User Logged In ✅

**Setup:**
1. Login to SpringFood
2. Verify token in cookies (DevTools → Application → Cookies)
3. Open chat modal
4. Send a message

**Expected Behavior:**
```
User types: "Hello"
User clicks Send

User Message (blue gradient bubble):
Hello

AI Response (gray bubble):
[Streaming response from Gemini AI...]

Console:
[WebSocket] Sending AI message: { message: "Hello", conversationId: "ai-123" }
[Chat] Received AI chunk: "Xin chào..."
[Chat] AI response complete
```

**Verification:**
- [ ] Message sends to backend via WebSocket
- [ ] User message appears in blue gradient bubble
- [ ] Typing indicator shows while AI is responding
- [ ] AI response streams in character by character
- [ ] Final response is complete and readable
- [ ] Input field clears after sending

---

## Cookie Testing

### Check Cookies in Browser

**Chrome/Edge:**
1. Open DevTools (F12)
2. Go to Application tab
3. Expand Cookies in left sidebar
4. Click on `http://localhost:4200`
5. Look for: `access_token`, `jwt_token`, or `token`

**Firefox:**
1. Open DevTools (F12)
2. Go to Storage tab
3. Expand Cookies
4. Click on `http://localhost:4200`
5. Look for: `access_token`, `jwt_token`, or `token`

**Safari:**
1. Open Web Inspector (Cmd+Option+I)
2. Go to Storage tab
3. Click Cookies
4. Look for: `access_token`, `jwt_token`, or `token`

### Cookie Format
```
Name: access_token (or jwt_token, or token)
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Domain: localhost
Path: /
Expires: [Date]
HttpOnly: [true/false] ← Important!
Secure: [true/false]
SameSite: [Lax/Strict/None]
```

---

## HttpOnly Cookie Issue

### What is HttpOnly?

**HttpOnly Cookie:**
- Cannot be read by JavaScript
- `document.cookie` will NOT show it
- More secure (prevents XSS attacks)
- Backend can still read it

**Non-HttpOnly Cookie:**
- Can be read by JavaScript
- `document.cookie` will show it
- Less secure but more flexible
- Frontend can access it

### Testing HttpOnly

**Test Script (Browser Console):**
```javascript
// Check if cookies are accessible
console.log('All cookies:', document.cookie);

// Check specific tokens
const cookies = document.cookie.split(';');
const tokens = cookies.filter(c => 
  c.includes('access_token') || 
  c.includes('jwt_token') || 
  c.includes('token')
);

console.log('Found tokens:', tokens);

// If empty, cookies might be HttpOnly
if (tokens.length === 0) {
  console.warn('⚠️ No tokens found in document.cookie');
  console.warn('Cookies might be HttpOnly');
  console.warn('Check DevTools → Application → Cookies');
}
```

### If Cookies Are HttpOnly

**Problem:**
- JavaScript cannot read the token
- Authentication check will always fail
- Chat will always show "login required" message
- WebSocket connection will fail authentication

**Solutions:**

**Option 1: Backend provides non-HttpOnly cookie for WebSocket**
```java
// Backend: Set separate cookie for WebSocket
Cookie wsToken = new Cookie("ws_token", jwtToken);
wsToken.setHttpOnly(false); // Allow JavaScript access
wsToken.setPath("/");
wsToken.setMaxAge(3600);
response.addCookie(wsToken);
```

**Option 2: Backend accepts token in WebSocket query parameter**
```typescript
// Frontend: Send token in URL
const token = await fetch('/api/auth/ws-token').then(r => r.text());
brokerURL: `ws://localhost:9098/ws?token=${token}`
```

**Option 3: Backend provides endpoint to check authentication**
```typescript
// Frontend: Check auth via API
async checkAuth(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/check', {
      credentials: 'include' // Send cookies
    });
    return response.ok;
  } catch {
    return false;
  }
}
```

**Option 4: Use session-based WebSocket authentication**
```java
// Backend: Use session instead of token
@Configuration
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
  @Override
  public void configureClientInboundChannel(ChannelRegistration registration) {
    registration.interceptors(new SessionAuthInterceptor());
  }
}
```

---

## Testing Steps

### Step 1: Clear State
```javascript
// Browser Console
localStorage.clear();
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});
location.reload();
```

### Step 2: Test Without Login
1. Open chat modal
2. Type a message
3. Click Send
4. Verify login required message appears
5. Check console for warning

### Step 3: Login
1. Go to login page
2. Enter credentials
3. Submit login form
4. Verify redirect to home page

### Step 4: Check Cookies
1. Open DevTools → Application → Cookies
2. Verify token exists
3. Note if HttpOnly is true/false

### Step 5: Test With Login
1. Open chat modal
2. Type a message
3. Click Send
4. Verify message sends
5. Verify AI response appears

### Step 6: Test WebSocket Connection
1. Open DevTools → Network → WS
2. Look for WebSocket connection
3. Verify connection is established
4. Check for authentication errors

---

## Debugging

### Console Logs to Check

**Authentication Check:**
```
[Chat] User not authenticated. Please login first.
```

**WebSocket Connection:**
```
[STOMP Debug] Opening Web Socket...
[WebSocket] Connecting to SpringFood AI Assistant...
[WebSocket] JWT token found in cookies, authenticating...
[WebSocket] Connected to SpringFood AI Assistant!
```

**Message Sending:**
```
[WebSocket] Sending AI message: { message: "...", conversationId: "..." }
[Chat] Received AI chunk: "..."
[Chat] AI response complete
```

**Errors:**
```
[WebSocket] STOMP error: Authentication failed
[WebSocket] Authentication failed! Please login again.
[WebSocket] Cannot send message: Not connected
```

### Network Tab

**WebSocket Connection:**
1. Open DevTools → Network
2. Filter: WS (WebSocket)
3. Look for: `ws://localhost:9098/ws`
4. Status should be: `101 Switching Protocols`
5. Check frames for STOMP messages

**REST API Calls:**
1. Filter: XHR/Fetch
2. Look for: `/api/auth/login`
3. Check response for token
4. Verify cookies are set

---

## Common Issues

### Issue 1: "Login required" message always shows

**Possible Causes:**
- Cookies are HttpOnly
- Token name doesn't match
- Token is expired
- Token is not set

**Debug:**
```javascript
// Check cookies
console.log('Cookies:', document.cookie);

// Check localStorage
console.log('LocalStorage:', {
  access_token: localStorage.getItem('access_token'),
  jwt_token: localStorage.getItem('jwt_token'),
  token: localStorage.getItem('token')
});
```

**Fix:**
- Verify token is set after login
- Check token name matches backend
- Ensure token is not HttpOnly (or use alternative auth)

### Issue 2: WebSocket connection fails

**Possible Causes:**
- Token is invalid
- Token is expired
- Backend requires different auth method
- CORS issues

**Debug:**
```javascript
// Check WebSocket connection
// DevTools → Network → WS
// Look for error messages in frames
```

**Fix:**
- Verify token is valid
- Check backend WebSocket config
- Ensure CORS is configured
- Try alternative auth method

### Issue 3: Message sends but no response

**Possible Causes:**
- Backend AI service is down
- Gemini API key is invalid
- WebSocket subscription failed
- Backend error

**Debug:**
```javascript
// Check backend logs
// Look for AI service errors
// Verify Gemini API key
```

**Fix:**
- Check backend logs
- Verify AI service is running
- Test Gemini API key
- Check WebSocket subscriptions

---

## Test Cases

### Test Case 1: No Token
```
Given: User is not logged in
When: User tries to send message
Then: Login required message appears
And: Message does not send to backend
And: Console shows warning
```

### Test Case 2: Valid Token in Cookie
```
Given: User is logged in
And: Token is in cookie (not HttpOnly)
When: User sends message
Then: Message sends to backend
And: AI response appears
And: WebSocket connection is established
```

### Test Case 3: Valid Token in LocalStorage
```
Given: User is logged in
And: Token is in localStorage (fallback)
When: User sends message
Then: Message sends to backend
And: AI response appears
And: WebSocket connection is established
```

### Test Case 4: HttpOnly Cookie
```
Given: User is logged in
And: Token is in HttpOnly cookie
When: User tries to send message
Then: Login required message appears (false negative)
And: JavaScript cannot read token
And: Alternative auth method needed
```

### Test Case 5: Expired Token
```
Given: User was logged in
And: Token has expired
When: User tries to send message
Then: Login required message appears
Or: WebSocket authentication fails
And: User needs to login again
```

---

## Success Criteria

✅ **Without Login:**
- Login required message appears
- Message does not send
- Console shows warning
- No WebSocket connection

✅ **With Login:**
- Message sends successfully
- AI response appears
- WebSocket connection established
- Streaming works correctly

✅ **Error Handling:**
- Expired token detected
- Invalid token handled
- Connection errors shown
- User-friendly error messages

---

## Next Steps

### If Tests Pass ✅
1. Deploy to staging
2. Test with real users
3. Monitor error logs
4. Collect feedback

### If Tests Fail ❌
1. Check console logs
2. Verify cookie configuration
3. Test alternative auth methods
4. Contact backend team

### If HttpOnly Issue ⚠️
1. Discuss with backend team
2. Choose alternative auth method
3. Implement solution
4. Re-test authentication flow

---

## Contact

**Frontend Issues:**
- Check browser console
- Verify cookie configuration
- Test in different browsers

**Backend Issues:**
- Check backend logs
- Verify WebSocket config
- Test AI service
- Verify Gemini API key

**Integration Issues:**
- Check CORS configuration
- Verify token format
- Test WebSocket handshake
- Review authentication flow

---

**Status:** 📋 **READY FOR TESTING**

**Priority:** 🔴 **HIGH** (Authentication is critical)

**Estimated Time:** 30 minutes

**Required:** Browser, DevTools, Backend running

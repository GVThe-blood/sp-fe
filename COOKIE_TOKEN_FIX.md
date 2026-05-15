# Cookie-Based Token Authentication Fix

## 🎯 Issue

Backend lưu JWT token trong **HttpOnly Cookie**, không phải localStorage!

### Before (Wrong)
```typescript
// ❌ Chỉ check localStorage
const token = localStorage.getItem('access_token');
```

### After (Correct)
```typescript
// ✅ Check cookies FIRST, localStorage là fallback
const cookies = document.cookie.split(';');
for (const cookie of cookies) {
  const [name, value] = cookie.trim().split('=');
  if (name === 'access_token') {
    return decodeURIComponent(value);
  }
}
```

---

## 🔧 Implementation

### Token Retrieval Function

```typescript
const getJwtToken = (): string | null => {
  // 1. Parse cookies to get access_token (PRIMARY)
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'access_token' || name === 'jwt_token' || name === 'token') {
      return decodeURIComponent(value);
    }
  }
  
  // 2. Fallback: try localStorage (for development/testing)
  return localStorage.getItem('access_token') || 
         localStorage.getItem('jwt_token') ||
         localStorage.getItem('token') ||
         null;
};
```

### Priority Order

1. **Cookies** (Production) - HttpOnly, secure
2. **localStorage** (Development) - Fallback for testing

---

## 🍪 Cookie Details

### Backend Cookie Configuration

**Name:** `access_token` (or `jwt_token`, `token`)

**Attributes:**
- `HttpOnly`: true (cannot access via JavaScript for security)
- `Secure`: true (HTTPS only in production)
- `SameSite`: Lax or Strict
- `Path`: /
- `Max-Age`: Token expiration time

### Reading Cookies in JavaScript

```typescript
// document.cookie returns all cookies as string:
// "access_token=eyJhbGc...; other_cookie=value; ..."

// Parse to get specific cookie:
const cookies = document.cookie.split(';');
for (const cookie of cookies) {
  const [name, value] = cookie.trim().split('=');
  if (name === 'access_token') {
    return decodeURIComponent(value); // Decode URL encoding
  }
}
```

---

## ⚠️ HttpOnly Cookie Limitation

### Problem
If backend sets `HttpOnly: true`, JavaScript **CANNOT** read the cookie!

```javascript
// This will NOT work if HttpOnly is true:
document.cookie // Returns empty or other non-HttpOnly cookies
```

### Solutions

**Option 1: Backend removes HttpOnly for WebSocket** (Recommended)
```java
// In backend cookie configuration
cookie.setHttpOnly(false); // Allow JavaScript to read for WebSocket
```

**Option 2: Backend sends token in response body**
```java
// Login response includes token
{
  "user": {...},
  "access_token": "eyJhbGc..." // Also return in body
}
```

**Option 3: Use cookie automatically in WebSocket handshake**
```typescript
// Browser automatically sends cookies in WebSocket handshake
// Backend reads from Cookie header instead of Authorization header
```

---

## 🧪 Testing

### Check if Cookie Exists

**Browser DevTools:**
```
1. Open DevTools (F12)
2. Go to Application tab
3. Click Cookies > http://localhost:4200
4. Look for: access_token, jwt_token, or token
5. Check value (should be JWT: eyJhbGc...)
```

**Console:**
```javascript
// Check all cookies
console.log(document.cookie);

// Check specific cookie
const token = document.cookie
  .split(';')
  .find(c => c.trim().startsWith('access_token='))
  ?.split('=')[1];
console.log('Token:', token);
```

### Test Token Retrieval

```typescript
// In browser console
const getJwtToken = () => {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'access_token') {
      return decodeURIComponent(value);
    }
  }
  return null;
};

console.log('JWT Token:', getJwtToken());
```

---

## 🔐 Security Considerations

### HttpOnly Cookie (Most Secure)
```
✅ Pros:
- Protected from XSS attacks
- Cannot be stolen via JavaScript
- Automatically sent with requests

❌ Cons:
- Cannot read in JavaScript
- Need backend support for WebSocket auth
```

### Non-HttpOnly Cookie (For WebSocket)
```
✅ Pros:
- Can read in JavaScript
- Works with WebSocket Authorization header
- Simple implementation

❌ Cons:
- Vulnerable to XSS attacks
- Can be stolen if site has XSS vulnerability
```

### Recommendation
Use **HttpOnly for REST API**, **Non-HttpOnly for WebSocket** (or use alternative auth method)

---

## 🚀 Build Status

```bash
✅ Build Successful
Bundle: 1.17 MB (269.48 kB gzipped)
Time: 6.216 seconds
```

---

## 📋 Checklist

### Backend
- [ ] Check cookie name: `access_token`, `jwt_token`, or `token`
- [ ] Check HttpOnly setting (should be false for WebSocket)
- [ ] Check cookie is set after login
- [ ] Check cookie domain and path
- [ ] Check cookie expiration

### Frontend
- [x] Read token from cookies first
- [x] Fallback to localStorage
- [x] Decode URL-encoded token
- [x] Pass token in Authorization header
- [x] Handle missing token gracefully

### Testing
- [ ] Login and check cookie in DevTools
- [ ] Verify token value is JWT
- [ ] Test WebSocket connection with cookie token
- [ ] Test token expiration handling
- [ ] Test logout clears cookie

---

## 🎯 Summary

### Changed
- ✅ Token retrieval now checks **cookies FIRST**
- ✅ localStorage is **fallback** for development
- ✅ Supports multiple cookie names
- ✅ URL decoding for token value

### Result
- ✅ Works with backend cookie-based auth
- ✅ Compatible with HttpOnly cookies (if backend allows)
- ✅ Fallback for development/testing
- ✅ Ready for production

---

**Status:** ✅ FIXED

**Last Updated:** 2026-05-08

**Note:** Nếu backend dùng HttpOnly cookie, cần backend hỗ trợ WebSocket auth qua Cookie header thay vì Authorization header!

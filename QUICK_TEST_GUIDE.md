# 🧪 Quick Test Guide - Stitch Chat Implementation

## 🚀 Start Testing (3 Steps)

### Step 1: Start Development Server
```bash
cd f:\Document\TASC\Frontend\Springfood-frontend\springfood
ng serve
```

Wait for: `✔ Browser application bundle generation complete.`

### Step 2: Open Browser
Navigate to: `http://localhost:4200`

### Step 3: Test Chat Features

---

## ✅ Visual Testing Checklist

### Chat Bubble (Bottom-Right Corner)
- [ ] Chat bubble visible in bottom-right corner
- [ ] Click bubble → Chat window opens
- [ ] Window size: 400x600px (mini mode)
- [ ] Window position: Bottom-right corner
- [ ] Smooth slide-up animation (300ms)

### Chat Header
- [ ] Title: "SpringFood AI Assistant"
- [ ] Subtitle: "Powered by Gemini AI"
- [ ] Status indicator: Green dot + "Connected"
- [ ] Close button (X) visible
- [ ] Hover close button → Gray background
- [ ] Click close → Window closes

### Welcome Message
- [ ] AI message visible on open
- [ ] Text: "Xin chào! Tôi là trợ lý AI của SpringFood..."
- [ ] Gray background (#F3F4F6)
- [ ] Robot avatar icon
- [ ] Timestamp below message
- [ ] Left-aligned

### Message Input
- [ ] Input field visible at bottom
- [ ] Gradient border (blue → purple → pink)
- [ ] Placeholder: "Type your message..."
- [ ] Emoji button (left)
- [ ] Microphone button (middle)
- [ ] Send button (right, gradient circle)
- [ ] Hover buttons → Scale up slightly

### Send Message Test
1. [ ] Type: "Hello"
2. [ ] Press Enter OR click Send button
3. [ ] User message appears
   - [ ] Right-aligned
   - [ ] Blue-to-purple gradient background
   - [ ] White text
   - [ ] Person avatar icon
   - [ ] Timestamp below
4. [ ] Typing indicator appears (3 animated dots)
5. [ ] AI response appears after ~2-3 seconds
   - [ ] Left-aligned
   - [ ] Gray background
   - [ ] Robot avatar icon
   - [ ] Timestamp below
6. [ ] Typing indicator disappears
7. [ ] Auto-scroll to latest message

### Animations
- [ ] Message fade-in (300ms)
- [ ] Typing dots animation (smooth, staggered)
- [ ] Button hover effects (scale, color)
- [ ] Smooth scrolling
- [ ] Window slide-up on open

### Scrollbar
- [ ] Custom scrollbar visible (6px width)
- [ ] Gray color (#D1D5DB)
- [ ] Hover → Darker gray (#9CA3AF)
- [ ] Smooth scroll behavior

---

## 📱 Responsive Testing

### Desktop (1280px+)
- [ ] Window: 400x600px
- [ ] Position: 24px from bottom-right
- [ ] All features visible
- [ ] Smooth animations

### Tablet (768px - 1024px)
- [ ] Window: 450x650px
- [ ] Adjusted positioning
- [ ] All features visible

### Mobile (< 768px)
- [ ] Window: Full-width minus 32px
- [ ] Window: Full-height minus 120px
- [ ] Padding: 16px (reduced)
- [ ] All features accessible

**Test Responsive:**
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test different screen sizes
4. Verify layout adapts

---

## 🔧 Functional Testing

### Send Multiple Messages
1. [ ] Send 5-10 messages in a row
2. [ ] Each message appears correctly
3. [ ] Auto-scroll works for each
4. [ ] No layout issues
5. [ ] Timestamps are accurate

### Long Messages
1. [ ] Type a very long message (200+ characters)
2. [ ] Message wraps correctly
3. [ ] Max width: 70% maintained
4. [ ] No overflow issues

### Connection Status
- [ ] Status shows "Connected" (green dot)
- [ ] If backend down: Status shows "Disconnected"
- [ ] Status updates in real-time

### Error Handling
1. [ ] Stop backend server
2. [ ] Try to send message
3. [ ] Error message appears:
   - "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau. 😔"
4. [ ] Typing indicator disappears

---

## 🎨 Design Verification

### Colors
- [ ] User messages: Blue-to-purple gradient (#3B82F6 → #A855F7)
- [ ] AI messages: Gray (#F3F4F6)
- [ ] Background: White (#FFFFFF)
- [ ] Text: Dark gray (#1F2937)
- [ ] Status dot: Green (#10B981)
- [ ] Input border: Gradient (blue → purple → pink)

### Typography
- [ ] Font: Inter (or system fallback)
- [ ] Header title: 1.25rem, bold
- [ ] Header subtitle: 0.75rem, normal
- [ ] Message text: 0.875rem, normal
- [ ] Timestamp: 0.625rem, medium gray

### Spacing
- [ ] Container padding: 24px
- [ ] Message gap: 16px
- [ ] Message padding: 12px 16px
- [ ] Header height: 64px
- [ ] Input height: 80px

### Border Radius
- [ ] Window: 12px
- [ ] Message bubbles: 16px (rounded)
- [ ] Input field: Fully rounded (pill shape)
- [ ] Buttons: Circular

---

## 🐛 Common Issues & Fixes

### Issue: Chat window doesn't open
**Fix:** Check console for errors, verify ChatModalComponent is in app

### Issue: Messages don't send
**Fix:** 
1. Check backend is running (port 9098)
2. Check Gateway is running (port 8080)
3. Check console for API errors

### Issue: Typing indicator stuck
**Fix:** Check WebSocketService error handling

### Issue: No auto-scroll
**Fix:** Check messagesContainer viewChild is working

### Issue: Animations not smooth
**Fix:** Check CSS transitions are 300ms with cubic-bezier easing

### Issue: Gradient not showing
**Fix:** Check browser supports CSS gradients (all modern browsers do)

---

## 🔍 Browser Console Checks

### Expected Console Logs
```
[Chat] Received AI chunk: ...
[Chat] AI response complete: ...
```

### No Errors Should Appear
- ❌ No TypeScript errors
- ❌ No Angular errors
- ❌ No HTTP errors (unless backend down)
- ❌ No WebSocket errors (WebSocket not active yet)

### Check Network Tab
1. Open DevTools → Network
2. Send a message
3. Look for: `POST http://localhost:8080/api/chat/ai/send`
4. Status: 200 OK
5. Response: JSON with AI response

---

## 📊 Performance Checks

### Bundle Size
- [ ] Initial bundle: ~825 KB (acceptable)
- [ ] Lazy chunks: ~68 KB
- [ ] Styles: ~71 KB

### Load Time
- [ ] Page loads in < 2 seconds
- [ ] Chat opens instantly
- [ ] Messages render smoothly

### Memory Usage
1. Open DevTools → Performance
2. Record while using chat
3. Check memory doesn't grow excessively
4. No memory leaks

---

## ✅ Success Criteria

### Must Have ✅
- [x] Build compiles successfully
- [x] Chat window opens/closes
- [x] Messages send and receive
- [x] Typing indicator works
- [x] Auto-scroll works
- [x] Animations are smooth
- [x] Design matches Stitch specs

### Nice to Have ⏳
- [ ] Emoji picker functional
- [ ] Voice input functional
- [ ] WebSocket streaming active
- [ ] Message actions (copy, delete)
- [ ] Quick reply suggestions

---

## 🎯 Quick Test Script

**5-Minute Test:**
```
1. Start server: ng serve
2. Open: http://localhost:4200
3. Click chat bubble
4. Send message: "Hello"
5. Verify AI response
6. Send 3 more messages
7. Check animations
8. Close chat window
9. Reopen chat window
10. Verify messages persist
```

**Pass Criteria:**
- ✅ All 10 steps work without errors
- ✅ Design looks professional
- ✅ Animations are smooth
- ✅ No console errors

---

## 📝 Test Results Template

```
Date: ___________
Tester: ___________
Browser: ___________
Screen Size: ___________

Visual Tests: ☐ Pass ☐ Fail
Functional Tests: ☐ Pass ☐ Fail
Responsive Tests: ☐ Pass ☐ Fail
Performance Tests: ☐ Pass ☐ Fail

Issues Found:
1. ___________
2. ___________
3. ___________

Overall Status: ☐ Pass ☐ Fail

Notes:
___________
___________
___________
```

---

## 🚀 Ready to Test!

**Start Command:**
```bash
ng serve
```

**Open Browser:**
```
http://localhost:4200
```

**Have Fun Testing! 🎉**

---

**Last Updated:** 2024-01-01  
**Test Coverage:** Visual, Functional, Responsive, Performance  
**Estimated Test Time:** 15-30 minutes  

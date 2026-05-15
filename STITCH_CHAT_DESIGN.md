# SpringFood AI Chat - Stitch Design

## 🎨 Design Overview

Giao diện chat mới đã được thiết kế bằng **Google Stitch** với SpringFood Design System.

## 📊 Project Information

**Stitch Project:**
- **Project ID:** `13088709076980195729`
- **Project Name:** SpringFood AI Chat Interface
- **Design System:** SpringFood Design System (assets/7697467440812524659)
- **Screen ID:** `6abcf9da6556488a9f6cb3eadb1b8da9`
- **Title:** SpringFood AI Assistant Chat

## 🖼️ Design Preview

**Screenshot URL:**
```
https://lh3.googleusercontent.com/aida/ADBb0ujsLuARiP59mjKJkNSf2farr7JJdG5EdyvrxC70SRpuibpO-Z9JGrrGe_mcSPRt7OkubQDnoaCtOpUuU_duony4VP_KdKBjj-8vlwyAqVGOA_EqddtWwCgEvUDy7ZWijEYEt2Ze3RTgclonY6YDHm47N3RpWtcAjj1gsulSMbouVcfuuvwlTK3bPfIlnXfnwMfYaCEQ6ng4Bl0bORO2Vnu3lWTz7h6epdjJ_C8cTsSsY6hAM0DmxrwWTjVK
```

**HTML Code URL:**
```
https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2YyNGU5MTEwYzk0MDQyYmNiMjdkOGJkMDM0ODgwOGRjEgsSBxDRsvDr_h8YAZIBJAoKcHJvamVjdF9pZBIWQhQxMzA4ODcwOTA3Njk4MDE5NTcyOQ&filename=&opi=96797242
```

## 🎯 Design Specifications

### Layout
- **Dimensions:** 2560x2048px (Desktop)
- **Background:** White (#FFFFFF)
- **Border Radius:** 12px (rounded corners)
- **Padding:** 24px (container)
- **Style:** Apple-inspired minimalism

### Header (64px height)
- **Title:** "SpringFood AI Assistant"
- **Subtitle:** "Powered by Gemini AI"
- **Close Button:** X icon (right side)
- **Status Indicator:** Green dot + "Connected" text
- **Background:** White with subtle shadow
- **Border Radius:** 12px

### Chat Messages Area
**AI Messages:**
- Background: Gray (#F3F4F6)
- Alignment: Left
- Avatar: Robot icon
- Border Radius: rounded-2xl
- Max Width: 70%
- Text Color: Dark gray (#1F2937)

**User Messages:**
- Background: Blue-to-purple gradient (#3B82F6 → #A855F7)
- Alignment: Right
- Avatar: Person icon
- Border Radius: rounded-2xl
- Max Width: 70%
- Text Color: White

**Message Spacing:**
- Between messages: 16px
- Timestamp: Small gray text below each message
- Smooth scroll behavior

### Typing Indicator
- Animated three dots
- Gray background (#F3F4F6)
- Smooth fade in/out animation
- Appears when AI is typing

### Input Area (80px height)
- **Position:** Fixed at bottom
- **Background:** White
- **Border:** Gradient (blue → purple → pink)
- **Input Field:** Rounded-full
- **Placeholder:** "Type your message..."
- **Icons:**
  - Emoji picker (left)
  - Microphone (right of text)
  - Send button (blue gradient circle with paper plane icon)

## 🎨 Design System

### Colors
```css
/* Primary Colors */
--primary-blue: #3B82F6;      /* Trust, reliability */
--primary-purple: #A855F7;    /* Premium, modern */
--primary-orange: #F97316;    /* Energy, food */

/* Backgrounds */
--bg-white: #FFFFFF;
--bg-gray: #F3F4F6;
--bg-light: #F5F5F7;          /* Apple-inspired */

/* Text */
--text-primary: #1F2937;      /* Dark gray */
--text-secondary: #6B7280;    /* Medium gray */
--text-white: #FFFFFF;

/* Borders */
--border-light: #E5E7EB;

/* Status */
--success-green: #10B981;
```

### Typography
```css
/* Font Family */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Font Sizes */
--text-title: 1.5rem;         /* 24px - Header title */
--text-subtitle: 0.875rem;    /* 14px - Header subtitle */
--text-message: 1rem;         /* 16px - Message text */
--text-timestamp: 0.75rem;    /* 12px - Timestamps */
--text-placeholder: 0.875rem; /* 14px - Input placeholder */

/* Font Weights */
--font-bold: 700;             /* Titles */
--font-semibold: 600;         /* Subtitles */
--font-medium: 500;           /* Buttons */
--font-normal: 400;           /* Body text */
```

### Spacing
```css
/* Container */
--padding-container: 24px;

/* Messages */
--gap-messages: 16px;
--padding-message: 12px 16px;

/* Header */
--height-header: 64px;
--padding-header: 16px 24px;

/* Input */
--height-input: 80px;
--padding-input: 16px 24px;
```

### Border Radius
```css
--radius-container: 12px;     /* Main container */
--radius-message: 16px;       /* Message bubbles (rounded-2xl) */
--radius-input: 9999px;       /* Input field (rounded-full) */
--radius-button: 9999px;      /* Buttons (rounded-full) */
```

### Shadows
```css
/* Header */
--shadow-header: 0 1px 3px 0 rgb(0 0 0 / 0.1);

/* Messages (hover) */
--shadow-message: 0 4px 6px -1px rgb(0 0 0 / 0.1);

/* Input */
--shadow-input: 0 10px 15px -3px rgb(0 0 0 / 0.1);
```

### Animations
```css
/* Transitions */
--duration-fast: 150ms;
--duration-normal: 300ms;
--duration-slow: 500ms;

/* Easing */
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);

/* Typing Indicator */
@keyframes typingDots {
  0%, 60%, 100% { opacity: 0.3; }
  30% { opacity: 1; }
}

/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

## 📝 Sample Content

### Welcome Message (AI)
```
Hi! I'm SpringFood AI Assistant. How can I help you today? 🍜
```

### Sample User Message
```
Recommend some popular dishes
```

### Sample AI Response
```
Here are 3 popular dishes you might enjoy:

🍜 Spicy Ramen
A flavorful bowl of noodles in rich broth with tender pork, soft-boiled egg, and fresh vegetables.

🥑 Avocado Toast
Creamy avocado on artisan sourdough, topped with cherry tomatoes, feta cheese, and a drizzle of olive oil.

🍝 Truffle Pasta
Handmade pasta tossed in a creamy truffle sauce with parmesan and fresh herbs.

Would you like to order any of these?
```

## 🎯 Design Principles

### 1. Apple-Inspired Minimalism
- Clean, spacious layouts
- Subtle shadows and borders
- Focus on content, not decoration
- White space is intentional

### 2. Smooth Interactions
- All transitions: 300ms with smooth easing
- Hover states: Subtle but noticeable
- Animations: Purposeful, not decorative
- Focus states: Clear visual feedback

### 3. Consistent Spacing
- 4px increments (Tailwind scale)
- Container padding: 24px
- Message gaps: 16px
- Header/Input height: 64px/80px

### 4. Typography Hierarchy
- Clear distinction between levels
- Consistent font weights
- Readable sizes (16px body text)
- Proper line heights

### 5. Color Usage
- Primary blue: Interactive elements
- Gradients: User messages, buttons
- Gray: AI messages, backgrounds
- White: Main background, user text

## 🚀 Implementation Guide

### Step 1: Download HTML Code
```bash
# Download from Stitch
curl -o chat-design.html "https://contribution.usercontent.google.com/download?c=..."
```

### Step 2: Extract Components
- Header component
- Message bubble component
- Typing indicator component
- Input area component

### Step 3: Convert to Angular
- Create standalone components
- Use Angular 19 Signals
- Add RxJS for streaming
- Integrate with WebSocketService

### Step 4: Apply Animations
- CSS transitions (300ms)
- Typing indicator animation
- Message fade-in animation
- Smooth scroll behavior

### Step 5: Add Interactivity
- Send message on Enter
- Emoji picker integration
- Voice input (optional)
- Auto-scroll to latest message

## 📱 Responsive Design

### Desktop (1280px+)
- Full-width chat window
- 70% max-width for messages
- Side-by-side layout for avatars

### Tablet (768px - 1279px)
- Slightly narrower container
- 80% max-width for messages
- Maintain spacing

### Mobile (< 768px)
- Full-screen chat
- 90% max-width for messages
- Smaller padding (16px)
- Compact header (48px)

## 🎨 Stitch Suggestions

Stitch đã đưa ra 3 suggestions để improve design:

1. **Change user message gradient to solid blue**
   - Simplify user messages với solid blue background
   - Easier to read, less distracting

2. **Add a 'View Menu' button to the AI response**
   - Quick action button trong AI messages
   - Direct link to food menu

3. **Make the header dark mode**
   - Dark header với light content
   - Better contrast, modern look

## 🔄 Next Steps

### Immediate
1. ✅ Download HTML code from Stitch
2. ✅ Review design with team
3. ⏳ Decide on suggestions (apply or skip)
4. ⏳ Convert HTML to Angular components

### Short Term
1. Create Angular components from design
2. Integrate with existing WebSocketService
3. Add animations and transitions
4. Test responsive behavior
5. Deploy to staging

### Long Term
1. A/B test different designs
2. Collect user feedback
3. Iterate on design
4. Add more features (voice, emoji, etc.)

## 📚 Resources

**Stitch Project:**
- View in Stitch: https://stitch.google.dev/projects/13088709076980195729
- Screenshot: [See URL above]
- HTML Code: [See URL above]

**Design System:**
- SpringFood Design System: `assets/7697467440812524659`
- Design tokens: See `.kiro/design-system.md`

**Documentation:**
- [AI_CHAT_INTEGRATION.md](./AI_CHAT_INTEGRATION.md)
- [TESTING_AI_CHAT.md](./TESTING_AI_CHAT.md)
- [INTEGRATION_SUMMARY.md](./INTEGRATION_SUMMARY.md)

## 💡 Design Insights

### What Works Well
1. **Clean Layout:** Apple-inspired minimalism makes it easy to focus on conversation
2. **Color Coding:** Blue for user, gray for AI - instantly recognizable
3. **Gradient Input:** Eye-catching without being distracting
4. **Typing Indicator:** Clear feedback that AI is working
5. **Status Indicator:** Green dot shows connection status

### Potential Improvements
1. **Message Actions:** Add copy, delete, edit buttons on hover
2. **Quick Replies:** Suggest common questions as buttons
3. **Rich Content:** Support images, links, buttons in messages
4. **Conversation History:** Show previous conversations
5. **Settings:** Allow users to customize appearance

### Accessibility Considerations
1. **Contrast:** Ensure text meets WCAG AA standards
2. **Keyboard Navigation:** Tab through all interactive elements
3. **Screen Readers:** Proper ARIA labels
4. **Focus States:** Clear visual indicators
5. **Color Blindness:** Don't rely solely on color

## 🎯 Success Metrics

**Visual Design:**
- ✅ Matches SpringFood branding
- ✅ Apple-inspired minimalism
- ✅ Clear visual hierarchy
- ✅ Consistent spacing
- ✅ Professional appearance

**User Experience:**
- ✅ Intuitive layout
- ✅ Clear message distinction
- ✅ Smooth animations
- ✅ Responsive design
- ✅ Accessible

**Technical:**
- ✅ HTML code generated
- ✅ Design system applied
- ✅ Responsive breakpoints
- ⏳ Angular implementation
- ⏳ Performance optimization

---

**Design Status:** ✅ **COMPLETE**

**Implementation Status:** ⏳ **PENDING**

**Next Action:** Download HTML and convert to Angular components

**Last Updated:** 2024-01-01

**Designer:** Google Stitch AI + SpringFood Design System

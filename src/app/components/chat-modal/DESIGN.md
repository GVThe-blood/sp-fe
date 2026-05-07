# Chat Modal Design Specification

## 🎨 Visual Design

### Chat Bubble Button
```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│                                     │
│                                     │
│                              ┌────┐ │
│                              │ 🔴 │ │ ← Notification badge (optional)
│                              └────┘ │
│                           ┌────────┐│
│                           │   💬   ││ ← Chat icon
│                           │   AI   ││ ← AI badge
│                           │    ●   ││ ← Online status
│                           └────────┘│
│                                     │
└─────────────────────────────────────┘
```

**Specifications:**
- Size: 64px × 64px
- Position: Fixed, bottom-right (24px from edges)
- Background: Primary color
- Border radius: Full circle (50%)
- Shadow: Large elevation
- Icon: Chat bubble with dots
- AI Badge: Small circle with "AI" text
- Online Status: Small green dot with pulse animation
- Notification Badge: Red circle with count (if unread > 0)

**States:**
- Default: Scale 1.0
- Hover: Scale 1.1
- Active: Scale 0.95
- Hidden: Scale 0 (when chat window open)

### Chat Window
```
┌─────────────────────────────────────┐
│ ┌─────────────────────────────────┐ │
│ │ 👤 SpringFood AI    [BETA]  [×] │ │ ← Header
│ │ Online • Replies instantly      │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │ 👤 Hi there! How can I help?   │ │ ← Bot message
│ │    10:42 AM                     │ │
│ │                                 │ │
│ │              I need help! 👤    │ │ ← User message
│ │              10:45 AM ✓✓        │ │
│ │                                 │ │
│ │ 👤 ● ● ●                        │ │ ← Typing indicator
│ │                                 │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 😊 📎 [Type a message...] [→]  │ │ ← Input area
│ │              123 / 1000         │ │ ← Character count
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Specifications:**
- Size: 360px × 600px
- Position: Fixed, bottom-right (24px from edges)
- Background: Surface color
- Border radius: 16px
- Shadow: Extra large elevation
- Border: 1px outline variant

**Layout:**
1. **Header** (64px height)
   - Avatar (40px circle)
   - Title + Status
   - Beta badge
   - Close button

2. **Message List** (flex-1, scrollable)
   - Bot messages (left-aligned)
   - User messages (right-aligned)
   - Typing indicator
   - Auto-scroll to bottom

3. **Input Area** (auto height)
   - Emoji button
   - Attachment button
   - Text input (multi-line)
   - Send button
   - Character count

## 🎭 Component Hierarchy

```
ChatModalComponent (Container)
├── ChatBubbleComponent (Floating button)
│   ├── Chat Icon
│   ├── AI Badge
│   ├── Online Status
│   └── Notification Badge
│
└── ChatWindowComponent (Modal window)
    ├── ChatHeaderComponent
    │   ├── Avatar
    │   ├── Title & Status
    │   ├── Beta Badge
    │   └── Close Button
    │
    ├── ChatMessageListComponent
    │   ├── Bot Messages
    │   │   ├── Avatar
    │   │   ├── Message Bubble
    │   │   └── Timestamp
    │   │
    │   ├── User Messages
    │   │   ├── Message Bubble
    │   │   ├── Timestamp
    │   │   └── Status Icon
    │   │
    │   └── Typing Indicator
    │       ├── Avatar
    │       └── Animated Dots
    │
    └── ChatInputComponent
        ├── Emoji Button
        ├── Attachment Button
        ├── Text Input
        ├── Send Button
        └── Character Count
```

## 🎨 Color Palette

### Light Mode
```css
/* Primary */
--primary: #FF6B35;              /* SpringFood orange */
--on-primary: #FFFFFF;

/* Secondary */
--secondary: #4ECDC4;            /* Teal accent */
--on-secondary: #000000;

/* Tertiary */
--tertiary: #44D62C;             /* Online green */
--on-tertiary: #000000;

/* Surface */
--surface: #FFFFFF;
--surface-container: #F5F5F5;
--surface-container-low: #FAFAFA;
--surface-container-high: #EEEEEE;
--surface-bright: #FAFAFA;
--on-surface: #1C1B1F;

/* Outline */
--outline: #79747E;
--outline-variant: #E0E0E0;

/* Error */
--error: #F44336;
--on-error: #FFFFFF;
```

### Dark Mode (Future)
```css
/* Primary */
--primary: #FFB4A2;
--on-primary: #5F1600;

/* Surface */
--surface: #1C1B1F;
--surface-container: #2B2930;
--on-surface: #E6E1E5;
```

## 📐 Spacing System

```css
/* Spacing tokens */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
```

**Usage:**
- Padding: 16px (space-4)
- Gap between elements: 8px (space-2)
- Gap between sections: 16px (space-4)
- Margin from edges: 24px (space-6)

## 🔤 Typography

```css
/* Font Family */
--font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Font Sizes */
--text-xs: 10px;    /* Character count, timestamps */
--text-sm: 12px;    /* Status text */
--text-base: 14px;  /* Message content, input */
--text-lg: 16px;    /* Title */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

## 🎬 Animations

### 1. Fade In (Messages)
```css
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Duration: 300ms */
/* Easing: ease-out */
```

### 2. Slide Up (Chat Window)
```css
@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Duration: 300ms */
/* Easing: cubic-bezier(0.16, 1, 0.3, 1) */
```

### 3. Bounce (Typing Dots)
```css
@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

/* Duration: 600ms */
/* Easing: infinite */
/* Delay: 0ms, 150ms, 300ms */
```

### 4. Pulse (Online Status)
```css
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Duration: 2000ms */
/* Easing: cubic-bezier(0.4, 0, 0.6, 1) */
/* Repeat: infinite */
```

### 5. Scale (Button Hover)
```css
/* Hover: scale(1.1) */
/* Active: scale(0.95) */
/* Transition: 200ms ease-out */
```

## 📱 Responsive Breakpoints

### Desktop (Default)
```css
/* Chat Window */
width: 360px;
height: 600px;
bottom: 24px;
right: 24px;

/* Chat Bubble */
width: 64px;
height: 64px;
bottom: 24px;
right: 24px;
```

### Tablet (768px - 1024px)
```css
/* Chat Window */
width: 360px;
height: 500px;
bottom: 16px;
right: 16px;

/* Chat Bubble */
width: 56px;
height: 56px;
bottom: 16px;
right: 16px;
```

### Mobile (< 768px)
```css
/* Chat Window */
width: calc(100vw - 32px);
height: calc(100vh - 100px);
bottom: 16px;
right: 16px;
left: 16px;

/* Chat Bubble */
width: 56px;
height: 56px;
bottom: 16px;
right: 16px;
```

## 🎯 Interactive States

### Chat Bubble Button
```
Default:
- Background: Primary
- Shadow: Large
- Scale: 1.0

Hover:
- Background: Primary
- Shadow: Extra large
- Scale: 1.1
- Cursor: pointer

Active:
- Background: Primary
- Shadow: Large
- Scale: 0.95

Disabled:
- Background: Surface container
- Opacity: 0.5
- Cursor: not-allowed
```

### Send Button
```
Default:
- Background: Primary
- Opacity: 1.0

Hover:
- Background: Primary
- Opacity: 0.9
- Shadow: Large

Active:
- Background: Primary
- Scale: 0.95

Disabled:
- Background: Primary
- Opacity: 0.5
- Cursor: not-allowed
```

### Input Field
```
Default:
- Background: Surface container
- Border: 1px outline variant

Focus:
- Background: Surface
- Border: 2px primary
- Ring: 2px primary (outer)

Error:
- Border: 2px error
- Ring: 2px error (outer)
```

## 🔍 Accessibility

### ARIA Labels
```html
<!-- Chat Bubble -->
<button aria-label="Open chat with SpringFood AI">

<!-- Close Button -->
<button aria-label="Close chat">

<!-- Send Button -->
<button aria-label="Send message">

<!-- Input Field -->
<textarea aria-label="Message input">
```

### Keyboard Navigation
```
Tab: Navigate between interactive elements
Enter: Send message (in input)
Shift+Enter: New line (in input)
Escape: Close chat window
```

### Focus Management
```
1. Open chat → Focus on input field
2. Close chat → Focus on chat bubble
3. Tab order: Emoji → Attachment → Input → Send
```

### Screen Reader
```
- Announce new messages
- Announce typing indicator
- Announce message status changes
- Announce character count
```

## 📊 Performance Metrics

### Target Metrics
```
First Paint: < 100ms
Time to Interactive: < 200ms
Animation FPS: 60fps
Bundle Size: < 50KB (gzipped)
```

### Optimization Strategies
```
1. OnPush change detection
2. Signals for reactive state
3. Lazy load emoji picker
4. Virtual scrolling for long message lists
5. Image lazy loading
6. Debounce typing indicator
7. Throttle scroll events
```

## 🎨 Design Tokens

### Border Radius
```css
--radius-sm: 8px;    /* Buttons */
--radius-md: 12px;   /* Message bubbles */
--radius-lg: 16px;   /* Chat window */
--radius-xl: 20px;   /* Input field */
--radius-full: 9999px; /* Chat bubble, avatars */
```

### Shadows
```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow-md: 0 4px 6px rgba(0,0,0,0.1);
--shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
--shadow-xl: 0 20px 25px rgba(0,0,0,0.1);
--shadow-2xl: 0 25px 50px rgba(0,0,0,0.15);
```

### Z-Index
```css
--z-base: 1;
--z-dropdown: 10;
--z-sticky: 20;
--z-fixed: 30;
--z-modal: 40;
--z-popover: 50;
--z-tooltip: 60;
```

**Chat Components:**
- Chat Bubble: z-50
- Chat Window: z-50

## 🎭 Message Bubble Design

### Bot Message
```
┌─────────────────────────────┐
│ 👤                          │
│    ┌──────────────────────┐ │
│    │ Message content here │ │
│    │ with multiple lines  │ │
│    └──────────────────────┘ │
│    10:42 AM                 │
└─────────────────────────────┘
```

**Specifications:**
- Background: Surface container
- Text color: On surface
- Border radius: 16px (top-left: 4px)
- Padding: 12px
- Max width: 80%
- Shadow: Small

### User Message
```
┌─────────────────────────────┐
│                          👤 │
│ ┌──────────────────────┐    │
│ │ Message content here │    │
│ │ with multiple lines  │    │
│ └──────────────────────┘    │
│                 10:45 AM ✓✓ │
└─────────────────────────────┘
```

**Specifications:**
- Background: Primary
- Text color: On primary
- Border radius: 16px (top-right: 4px)
- Padding: 12px
- Max width: 80%
- Shadow: Medium

### Typing Indicator
```
┌─────────────────────────────┐
│ 👤                          │
│    ┌────────┐               │
│    │ ● ● ●  │               │
│    └────────┘               │
└─────────────────────────────┘
```

**Specifications:**
- Background: Surface container
- Dots: Outline color
- Dot size: 8px
- Gap: 4px
- Animation: Bounce (staggered)

## 🎨 Icon Design

### Chat Icon (Bubble)
```svg
<svg viewBox="0 0 24 24">
  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
  <circle cx="8" cy="10" r="1.5"/>
  <circle cx="12" cy="10" r="1.5"/>
  <circle cx="16" cy="10" r="1.5"/>
</svg>
```

### Close Icon
```svg
<svg viewBox="0 0 24 24">
  <path d="M6 18L18 6M6 6l12 12"/>
</svg>
```

### Send Icon
```svg
<svg viewBox="0 0 24 24">
  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
</svg>
```

### Status Icons
```svg
<!-- Sent (single check) -->
<svg viewBox="0 0 24 24">
  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
</svg>

<!-- Delivered/Read (double check) -->
<svg viewBox="0 0 24 24">
  <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z"/>
</svg>
```

---

**Design System:** Material Design 3
**Framework:** Angular 19 + Tailwind CSS
**Status:** ✅ Implemented
**Last Updated:** May 7, 2026

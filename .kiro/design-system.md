# SpringFood Design System

> Design system và quy tắc thiết kế cho dự án SpringFood E-commerce

## 📋 Mục lục
- [Colors](#colors)
- [Typography](#typography)
- [Spacing](#spacing)
- [Border Radius](#border-radius)
- [Shadows](#shadows)
- [Animations](#animations)
- [Components](#components)
- [Layout](#layout)
- [Icons](#icons)

---

## 🎨 Colors

### Primary Colors
```css
/* Brand Colors */
--primary-blue: #3B82F6;      /* blue-500 */
--primary-purple: #A855F7;    /* purple-500 */
--primary-orange: #F97316;    /* orange-500 */

/* Gradient Combinations */
--gradient-primary: linear-gradient(to right, #3B82F6, #A855F7);
--gradient-accent: linear-gradient(to right, #3B82F6, #F97316);
--gradient-search: linear-gradient(to right, #60A5FA, #C084FC, #F472B6);
```

### Neutral Colors
```css
/* Background */
--bg-primary: #F5F5F7;        /* Apple-style light gray */
--bg-white: #FFFFFF;
--bg-card: #FFFFFF;

/* Text Colors */
--text-primary: #1F2937;      /* gray-800 */
--text-secondary: #6B7280;    /* gray-500 */
--text-tertiary: #9CA3AF;     /* gray-400 */
--text-muted: #D1D5DB;        /* gray-300 */
```

### Semantic Colors
```css
/* Interactive States */
--hover-blue: #2563EB;        /* blue-600 */
--hover-gray: #4B5563;        /* gray-600 */
--active-blue: #1D4ED8;       /* blue-700 */

/* Borders */
--border-light: #E5E7EB;      /* gray-200 */
--border-hover: #BFDBFE;      /* blue-200 */
```

### Usage Rules
- **Primary Blue**: CTAs, links, active states
- **Purple**: Accent elements, gradients
- **Orange**: Highlights, special offers
- **Gray-800**: Primary text
- **Gray-500**: Secondary text, descriptions
- **#F5F5F7**: Page background (Apple-inspired)

---

## 📝 Typography

### Font Family
```css
/* System Font Stack (Apple-style) */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
             'Helvetica Neue', Arial, sans-serif;
```

### Font Sizes
```css
/* Headings */
--text-7xl: 4.5rem;    /* 72px - Hero titles */
--text-5xl: 3rem;      /* 48px - Section titles */
--text-4xl: 2.25rem;   /* 36px - Large headings */
--text-3xl: 1.875rem;  /* 30px - Card titles */
--text-2xl: 1.5rem;    /* 24px - Subheadings */
--text-xl: 1.25rem;    /* 20px - Card subtitles */

/* Body Text */
--text-base: 1rem;     /* 16px - Body text */
--text-sm: 0.875rem;   /* 14px - Small text */
--text-xs: 0.75rem;    /* 12px - Labels, nav items */
```

### Font Weights
```css
--font-bold: 700;      /* Headings */
--font-semibold: 600;  /* Subheadings, emphasis */
--font-medium: 500;    /* Buttons, labels */
--font-normal: 400;    /* Body text */
```

### Line Heights
```css
--leading-tight: 1.25;   /* Headings */
--leading-normal: 1.5;   /* Body text */
--leading-relaxed: 1.75; /* Long-form content */
```

### Typography Rules
- **Hero titles**: text-5xl/7xl, font-bold, tracking-tight
- **Section headings**: text-3xl/4xl, font-semibold, tracking-tight
- **Card titles**: text-xl/2xl, font-semibold
- **Body text**: text-sm/base, font-normal
- **Labels**: text-xs, font-semibold, uppercase, tracking-wider

---

## 📏 Spacing

### Spacing Scale (Tailwind)
```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

### Common Patterns
```css
/* Component Padding */
--padding-card: 2rem;           /* p-8 */
--padding-card-small: 1.5rem;   /* p-6 */
--padding-section: 3rem 1rem;   /* py-12 px-4 */

/* Component Gaps */
--gap-items: 1rem;              /* gap-4 */
--gap-nav: 2rem;                /* gap-8 */
--gap-grid: 1rem;               /* gap-4 */

/* Container Max Width */
--container-max: 1536px;        /* max-w-screen-2xl */
--container-content: 896px;     /* max-w-7xl */
```

### Spacing Rules
- Section padding: `py-12` (48px vertical)
- Card padding: `p-8` (32px) for large, `p-6` (24px) for small
- Grid gaps: `gap-4` (16px)
- Nav items: `gap-8` (32px)
- Button padding: `px-4 py-1.5` for small, `px-6 py-3` for large

---

## 🔲 Border Radius

### Radius Scale
```css
--radius-sm: 0.125rem;    /* 2px - Subtle */
--radius-md: 0.375rem;    /* 6px - Default */
--radius-lg: 0.5rem;      /* 8px - Cards */
--radius-xl: 0.75rem;     /* 12px - Large cards */
--radius-2xl: 1rem;       /* 16px - Featured cards */
--radius-full: 9999px;    /* Circular - Buttons, badges */
```

### Usage
- **Cards**: `rounded-2xl` (16px)
- **Dropdowns**: `rounded-lg` (8px)
- **Buttons**: `rounded-full` (circular)
- **Input fields**: `rounded-full` (circular)
- **Images**: `rounded-2xl` or no radius

---

## 🌑 Shadows

### Shadow Scale
```css
/* Elevation Levels */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
```

### Usage
- **Cards (default)**: No shadow
- **Cards (hover)**: `shadow-xl`
- **Dropdowns**: `shadow-xl`
- **Buttons**: `shadow-sm`
- **Floating elements**: `shadow-xl`

---

## ✨ Animations

### Timing Functions
```css
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);  /* Apple-style easing */
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
```

### Duration
```css
--duration-fast: 150ms;      /* Quick interactions */
--duration-normal: 300ms;    /* Standard transitions */
--duration-slow: 500ms;      /* Emphasis animations */
```

### Common Animations
```css
/* Dropdown Fade */
@keyframes dropdownFade {
  from { opacity: 0; transform: translateY(-12px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Slide Down (Staggered) */
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Scale on Hover */
.hover-scale {
  transition: transform 500ms ease;
}
.hover-scale:hover {
  transform: scale(1.05);
}
```

### Animation Rules
- **Hover states**: 300ms transition
- **Dropdowns**: 300ms fade + slide
- **Images**: 500ms scale on hover
- **Staggered animations**: 80ms delay between items
- **Use**: `transition-all`, `transition-colors`, `transition-transform`

---

## 🧩 Components

### Buttons

#### Primary Button (CTA)
```html
<button class="bg-gradient-to-r from-blue-500 to-purple-500 
               text-white px-4 py-1.5 rounded-full text-xs 
               font-medium hover:from-blue-600 hover:to-purple-600 
               transition-all shadow-sm">
  Button Text
</button>
```

#### Icon Button
```html
<button class="hover:text-gray-600 transition-colors">
  <svg class="w-4 h-4">...</svg>
</button>
```

### Cards

#### Standard Card
```html
<div class="bg-white rounded-2xl overflow-hidden 
            hover:shadow-xl transition-all duration-300">
  <!-- Content -->
</div>
```

#### Card with Hover Border
```html
<div class="relative bg-white rounded-2xl overflow-hidden 
            hover:shadow-xl transition-all duration-300">
  <!-- Content -->
  <div class="absolute inset-0 rounded-2xl border-2 
              border-transparent group-hover:border-blue-200 
              transition-colors duration-300"></div>
</div>
```

### Inputs

#### Search Input
```html
<div class="p-[2px] rounded-full bg-gradient-to-r 
            from-blue-400 via-purple-400 to-pink-400 shadow-lg">
  <input class="w-full px-6 py-3 text-sm bg-white rounded-full 
                border-none focus:outline-none focus:ring-0" 
         placeholder="Search...">
</div>
```

### Dropdowns
```html
<div class="absolute bg-white rounded-lg shadow-xl py-2 
            min-w-[160px] z-50 animate-dropdown">
  <!-- Items -->
</div>
```

---

## 📐 Layout

### Container
```html
<div class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
  <!-- Content -->
</div>
```

### Grid Layouts
```html
<!-- 3 Columns -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-4">

<!-- 2 Columns -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-4">

<!-- Auto-fit Carousel -->
<div class="grid grid-flow-col auto-cols-max gap-x-16">
```

### Responsive Breakpoints
```css
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

### Z-Index Scale
```css
--z-base: 0;
--z-dropdown: 40;
--z-backdrop: 30;
--z-sticky: 50;
--z-modal: 100;
```

---

## 🎯 Icons

### Icon Sizes
```css
--icon-xs: 0.75rem;   /* w-3 h-3 - 12px */
--icon-sm: 1rem;      /* w-4 h-4 - 16px */
--icon-md: 1.5rem;    /* w-6 h-6 - 24px */
--icon-lg: 2rem;      /* w-8 h-8 - 32px */
```

### Icon Usage
- **Nav icons**: `w-4 h-4` (16px)
- **Button icons**: `w-4 h-4` (16px)
- **Feature icons**: `w-6 h-6` (24px)
- **Hero icons**: `w-8 h-8` (32px)

### Icon Style
```html
<svg class="w-4 h-4" fill="none" stroke="currentColor" 
     viewBox="0 0 24 24" stroke-width="2">
  <path stroke-linecap="round" stroke-linejoin="round" d="..."/>
</svg>
```

---

## 🎨 Design Principles

### 1. Apple-Inspired Minimalism
- Clean, spacious layouts
- Subtle shadows and borders
- Focus on content, not decoration
- White space is intentional

### 2. Smooth Interactions
- All transitions use `cubic-bezier(0.4, 0, 0.2, 1)`
- Hover states are subtle but noticeable
- Animations are purposeful, not decorative

### 3. Consistent Spacing
- Use Tailwind spacing scale (4px increments)
- Maintain consistent gaps in grids
- Section padding: `py-12`
- Card padding: `p-8` or `p-6`

### 4. Typography Hierarchy
- Clear distinction between heading levels
- Consistent use of font weights
- Tracking-tight for large headings
- Tracking-wider for small labels

### 5. Color Usage
- Primary blue for interactive elements
- Gradients for emphasis and CTAs
- Gray-800 for primary text
- #F5F5F7 for backgrounds

---

## 📱 Responsive Design Rules

### Mobile First
- Start with mobile layout
- Add complexity at larger breakpoints
- Use `sm:`, `md:`, `lg:` prefixes

### Common Patterns
```html
<!-- Text Size -->
<h1 class="text-3xl md:text-5xl lg:text-7xl">

<!-- Padding -->
<div class="px-4 sm:px-6 lg:px-8">

<!-- Grid -->
<div class="grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

<!-- Flex Direction -->
<div class="flex-col md:flex-row">
```

---

## 🚀 Component Checklist

Khi tạo component mới, đảm bảo:

- [ ] Sử dụng đúng color palette
- [ ] Font size và weight phù hợp với hierarchy
- [ ] Spacing nhất quán (4px increments)
- [ ] Border radius: `rounded-2xl` cho cards
- [ ] Hover states với `transition-all duration-300`
- [ ] Responsive breakpoints: mobile → tablet → desktop
- [ ] Z-index phù hợp với layer
- [ ] Icons size `w-4 h-4` hoặc `w-6 h-6`
- [ ] Container: `max-w-screen-2xl mx-auto px-4`
- [ ] Accessibility: proper contrast, focus states

---

## 📚 References

- **Tailwind CSS**: https://tailwindcss.com/docs
- **Apple Design**: https://developer.apple.com/design/
- **Color Palette**: Tailwind default colors
- **Icons**: Heroicons (outline style)

---

**Last Updated**: 2024
**Version**: 1.0.0

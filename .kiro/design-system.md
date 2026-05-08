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

### Primary Colors (Spring Green)
```css
/* Spring Green - Main Brand Color */
--primary: #306c00;              /* Primary base */
--primary-container: #6db33f;    /* Main primary (buttons, highlights) */
--primary-light: #90d960;        /* Hover states */
--primary-lighter: #abf779;      /* Light backgrounds */
--on-primary: #ffffff;           /* Text on primary */
--on-primary-container: #1a4100; /* Text on primary container */
```

### Secondary Colors (Warm Orange)
```css
/* Warm Orange - Accent & CTAs */
--secondary: #964900;            /* Secondary base */
--secondary-container: #ff8928;  /* Main secondary (CTAs, urgency) */
--secondary-light: #ffb786;      /* Hover states */
--secondary-lighter: #ffdcc6;    /* Light backgrounds */
--on-secondary: #ffffff;         /* Text on secondary */
--on-secondary-container: #642f00; /* Text on secondary container */
```

### Tertiary Colors (Slate Blue)
```css
/* Slate Blue - Supporting Elements */
--tertiary: #555f71;             /* Tertiary base */
--tertiary-container: #98a2b7;   /* Main tertiary */
--tertiary-light: #bdc7dc;       /* Hover states */
--tertiary-lighter: #d9e3f9;     /* Light backgrounds */
--on-tertiary: #ffffff;          /* Text on tertiary */
--on-tertiary-container: #2f394a; /* Text on tertiary container */
```

### Neutral/Surface Colors
```css
/* Backgrounds & Surfaces */
--background: #f7fafc;           /* Page background */
--surface: #f7fafc;              /* Surface base */
--surface-container: #ebeef0;    /* Card backgrounds */
--surface-container-high: #e5e9eb;
--surface-container-highest: #e0e3e5;
--surface-container-low: #f1f4f6;
--surface-container-lowest: #ffffff; /* Pure white */
--surface-dim: #d7dadc;
--surface-bright: #f7fafc;
--surface-variant: #e0e3e5;

/* Text Colors */
--on-surface: #181c1e;           /* Primary text */
--on-surface-variant: #41493a;   /* Secondary text */
--on-background: #181c1e;        /* Text on background */

/* Borders & Outlines */
--outline: #717a68;              /* Default borders */
--outline-variant: #c1cab5;      /* Light borders */
--surface-tint: #306c00;         /* Tint color */
```

### Inverse Colors
```css
/* Dark Mode / Inverse */
--inverse-surface: #2d3133;
--inverse-on-surface: #eef1f3;
--inverse-primary: #90d960;
```

### Error Colors
```css
/* Error States */
--error: #ba1a1a;
--on-error: #ffffff;
--error-container: #ffdad6;
--on-error-container: #93000a;
```

### Usage Rules
- **Spring Green (#6db33f)**: Primary buttons, active states, success indicators
- **Warm Orange (#ff8928)**: CTAs, "Add to Cart", time-sensitive elements
- **Slate Blue (#98a2b7)**: Supporting UI elements, secondary actions
- **#f7fafc**: Page background (clean, airy feel)
- **#181c1e**: Primary text (softer than pure black)
- **#41493a**: Secondary text, descriptions

---

## 📝 Typography

### Font Family
```css
/* Plus Jakarta Sans (from Google Fonts) */
font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 
             'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
```

### Font Sizes & Styles
```css
/* Display (Hero Titles) */
--display-lg-size: 48px;
--display-lg-weight: 700;
--display-lg-line-height: 1.1;
--display-lg-letter-spacing: -0.02em;

/* Headlines */
--headline-lg-size: 32px;
--headline-lg-weight: 700;
--headline-lg-line-height: 1.2;
--headline-lg-letter-spacing: -0.01em;

--headline-md-size: 24px;
--headline-md-weight: 600;
--headline-md-line-height: 1.3;

/* Body Text */
--body-lg-size: 18px;
--body-lg-weight: 400;
--body-lg-line-height: 1.6;

--body-md-size: 16px;
--body-md-weight: 400;
--body-md-line-height: 1.5;

/* Labels */
--label-md-size: 14px;
--label-md-weight: 600;
--label-md-line-height: 1.2;
--label-md-letter-spacing: 0.05em;
```

### Font Weights
```css
--font-bold: 700;      /* Display, headlines */
--font-semibold: 600;  /* Subheadings, emphasis */
--font-medium: 500;    /* Buttons, labels */
--font-normal: 400;    /* Body text */
```

### Typography Rules
- **Hero titles**: 48px, bold (700), tight tracking (-0.02em)
- **Section headings**: 32px, bold (700), tight tracking (-0.01em)
- **Card titles**: 24px, semibold (600)
- **Body text**: 16px, normal (400), line-height 1.5
- **Labels**: 14px, semibold (600), uppercase, wide tracking (0.05em)

---

## 📏 Spacing

### Spacing Scale (8px Grid System)
```css
--space-unit: 8px;           /* Base unit */
--space-xs: 4px;             /* 0.5 unit */
--space-sm: 8px;             /* 1 unit */
--space-md: 16px;            /* 2 units */
--space-lg: 24px;            /* 3 units */
--space-xl: 40px;            /* 5 units */
--space-2xl: 48px;           /* 6 units */
--space-3xl: 80px;           /* 10 units - Section gaps */
```

### Common Patterns
```css
/* Component Padding */
--padding-card: 32px;              /* Large cards */
--padding-card-small: 24px;        /* Small cards */
--padding-section: 48px 16px;      /* Mobile sections */
--padding-section-desktop: 48px;   /* Desktop sections */

/* Component Gaps */
--gap-items: 16px;                 /* Grid items */
--gap-nav: 24px;                   /* Navigation items */
--gap-section: 80px;               /* Between sections */

/* Container Max Width */
--container-max: 1280px;           /* Max content width */
--gutter: 24px;                    /* Side gutters */
--margin-mobile: 16px;             /* Mobile margins */
--margin-desktop: 48px;            /* Desktop margins */
```

### Spacing Rules
- **Section gaps**: 80px vertical spacing between major sections
- **Card padding**: 32px for large cards, 24px for small cards
- **Grid gaps**: 16px between items
- **Nav items**: 24px horizontal spacing
- **Mobile margins**: 16px, Desktop margins: 48px
- **All spacing must be multiples of 8px** (strict 8px grid)

---

## 🔲 Border Radius

### Radius Scale (Soft, Organic Shapes)
```css
--radius-sm: 4px;      /* 0.25rem - Subtle elements */
--radius-md: 8px;      /* 0.5rem - Default (ROUND_EIGHT) */
--radius-lg: 12px;     /* 0.75rem - Standard buttons/inputs */
--radius-xl: 16px;     /* 1rem - Cards */
--radius-2xl: 24px;    /* 1.5rem - Large cards, banners */
--radius-full: 9999px; /* Circular - Pills, badges */
```

### Usage (Based on Stitch Design System)
- **Standard Buttons & Inputs**: `12px` (0.75rem) - soft touchpoint
- **Product Cards**: `24px` (1.5rem) - modern, high-end feel
- **Small Cards**: `16px` (1rem)
- **Category Chips**: `9999px` (fully rounded pills)
- **Images**: Inherit parent container radius
- **Badges**: `9999px` (circular)

### Component-Specific Rules
```css
/* Cards */
.card-large { border-radius: 24px; }
.card-standard { border-radius: 16px; }

/* Buttons */
.btn-primary { border-radius: 12px; }
.btn-pill { border-radius: 9999px; }

/* Inputs */
.input-field { border-radius: 12px; }

/* Chips/Tags */
.chip { border-radius: 9999px; }
```

---

## 🌑 Shadows (Ambient, Natural Light)

### Shadow Scale (Soft, Diffused)
```css
/* Level 1 - Base (Subtle borders) */
--shadow-base: 0 0 0 1px rgba(0, 0, 0, 0.05);

/* Level 2 - Cards/Chips (Lifted) */
--shadow-card: 0 4px 20px rgba(0, 0, 0, 0.06);

/* Level 3 - Modals/Overlays (Focal) */
--shadow-modal: 0 12px 40px rgba(0, 0, 0, 0.10);

/* Hover States */
--shadow-hover: 0 8px 30px rgba(0, 0, 0, 0.08);
```

### Usage (Apple-Inspired Ambient Shadows)
- **Cards (default)**: `shadow-card` (4px blur, 6% opacity)
- **Cards (hover)**: `shadow-hover` (8px blur, 8% opacity)
- **Dropdowns**: `shadow-modal` (12px blur, 10% opacity)
- **Buttons**: No shadow or `shadow-base`
- **Floating elements**: `shadow-modal`

### Shadow Philosophy
- **Highly diffused**: Mimic natural sunlight
- **Low opacity**: Avoid harsh edges (max 10%)
- **Vertical offset**: Y-axis only (no X-axis)
- **No harsh borders**: Use shadows for depth instead

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

#### Primary Button (Spring Green)
```html
<button class="bg-[#6db33f] text-white px-6 py-3 rounded-xl 
               font-semibold hover:bg-[#90d960] 
               transition-all duration-300 shadow-sm">
  Button Text
</button>
```

#### Secondary Button (Warm Orange - CTA)
```html
<button class="bg-[#ff8928] text-white px-6 py-3 rounded-xl 
               font-semibold hover:bg-[#ffb786] 
               transition-all duration-300 shadow-sm">
  Add to Cart
</button>
```

#### Pill Button (Category Chips)
```html
<button class="px-4 py-2 rounded-full border-2 border-[#c1cab5]
               text-[#181c1e] hover:bg-[#6db33f] hover:text-white
               hover:border-[#6db33f] transition-all duration-300">
  Category
</button>
```

### Cards

#### Product Card (High-End Feel)
```html
<div class="bg-white rounded-3xl overflow-hidden 
            hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] 
            transition-all duration-500 hover:scale-[1.02]">
  <!-- Product Image (60% height) -->
  <div class="relative aspect-square">
    <img src="..." class="w-full h-full object-cover">
  </div>
  
  <!-- Product Info -->
  <div class="p-6">
    <h3 class="text-xl font-semibold text-[#181c1e]">Product Name</h3>
    <p class="text-lg font-bold text-[#6db33f] mt-2">$19.99</p>
    
    <!-- Add to Cart Button -->
    <button class="absolute bottom-4 right-4 w-10 h-10 
                   bg-[#6db33f] rounded-full flex items-center 
                   justify-center text-white hover:bg-[#90d960]">
      <svg class="w-5 h-5">+</svg>
    </button>
  </div>
</div>
```

#### Standard Card
```html
<div class="bg-white rounded-2xl p-8 
            hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] 
            transition-all duration-300">
  <!-- Content -->
</div>
```

### Inputs

#### Search Input (Minimalist)
```html
<input class="w-full px-6 py-3 bg-[#f1f4f6] rounded-xl 
              border-2 border-transparent text-[#181c1e]
              focus:border-[#6db33f] focus:outline-none 
              transition-all duration-300" 
       placeholder="Search products...">
```

#### Input with Label
```html
<div class="space-y-2">
  <label class="text-sm font-semibold text-[#41493a] 
                uppercase tracking-wider">
    Label
  </label>
  <input class="w-full px-4 py-3 bg-[#f1f4f6] rounded-xl 
                border-2 border-transparent
                focus:border-[#6db33f] focus:outline-none">
</div>
```

### Category Chips (Horizontal Scroll)
```html
<div class="flex gap-4 overflow-x-auto">
  <!-- Active Chip -->
  <button class="flex items-center gap-2 px-4 py-2 
                 bg-[#6db33f] text-white rounded-full 
                 whitespace-nowrap">
    <svg class="w-6 h-6">...</svg>
    <span class="font-medium">Category</span>
  </button>
  
  <!-- Inactive Chip -->
  <button class="flex items-center gap-2 px-4 py-2 
                 border-2 border-[#c1cab5] text-[#181c1e] 
                 rounded-full whitespace-nowrap
                 hover:border-[#6db33f] transition-colors">
    <svg class="w-6 h-6">...</svg>
    <span class="font-medium">Category</span>
  </button>
</div>
```

### Promotional Banner (with Countdown)
```html
<div class="relative rounded-3xl overflow-hidden h-64">
  <!-- Background Image with Overlay -->
  <img src="..." class="absolute inset-0 w-full h-full object-cover">
  <div class="absolute inset-0 bg-black/40"></div>
  
  <!-- Content -->
  <div class="relative z-10 p-8 text-white">
    <h2 class="text-4xl font-bold mb-4">Flash Sale</h2>
    
    <!-- Countdown Timer (Glassmorphic) -->
    <div class="inline-flex gap-2 px-4 py-2 rounded-xl 
                bg-white/20 backdrop-blur-md">
      <span class="text-2xl font-bold text-[#ff8928]">12:34:56</span>
    </div>
  </div>
</div>
```

### Delivery Address Selector
```html
<div class="flex items-center gap-2 px-4 py-2 
            bg-[#f1f4f6] rounded-full">
  <svg class="w-5 h-5 text-[#6db33f]">📍</svg>
  <div>
    <p class="text-xs font-semibold text-[#41493a] 
              uppercase tracking-wider">
      DELIVERING TO
    </p>
    <p class="text-sm font-medium text-[#181c1e]">
      123 Main St, City
    </p>
  </div>
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

### 1. Organic Precision (Apple-Inspired Minimalism)
- **Clean, spacious layouts** with generous whitespace
- **Soft, organic shapes** (24px radius for cards)
- **Ambient shadows** that mimic natural light
- **Focus on content**, not decoration
- **High-quality imagery** as primary visual driver

### 2. Fresh & Healthy Brand Personality
- **Spring Green (#6db33f)**: Growth, health, freshness
- **Warm Orange (#ff8928)**: Appetite appeal, urgency
- **Light backgrounds (#f7fafc)**: Clean, airy, premium
- **Soft typography**: Plus Jakarta Sans for friendly feel

### 3. Smooth, Intentional Interactions
- All transitions: `300ms cubic-bezier(0.4, 0, 0.2, 1)`
- Hover states: Subtle lift (scale 1.02x) + shadow increase
- Animations are purposeful, not decorative
- Interactive depth through shadows, not borders

### 4. Strict 8px Grid System
- All spacing in multiples of 8px
- Maintains mathematical harmony
- Section gaps: 80px
- Card padding: 32px (large), 24px (small)
- Grid gaps: 16px

### 5. Typography Hierarchy
- **Display (48px, bold)**: Hero titles with tight tracking
- **Headline (32px, bold)**: Section headings
- **Body (16px, normal)**: Readable, generous line-height (1.5)
- **Labels (14px, semibold)**: Uppercase, wide tracking (0.05em)

### 6. Color Usage Strategy
- **Primary Green**: Interactive elements, success states
- **Warm Orange**: CTAs, "Add to Cart", time-sensitive
- **Slate Blue**: Supporting UI, secondary actions
- **Neutral grays**: Backgrounds and text
- **Avoid pure black**: Use #181c1e for softer feel

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

Khi tạo component mới từ Stitch design, đảm bảo:

- [ ] **Colors**: Dùng Spring Green (#6db33f) cho primary, Warm Orange (#ff8928) cho CTAs
- [ ] **Typography**: Plus Jakarta Sans, đúng font size và weight theo hierarchy
- [ ] **Spacing**: Tuân thủ 8px grid (16px, 24px, 32px, 48px, 80px)
- [ ] **Border Radius**: 
  - Cards: `24px` (large) hoặc `16px` (standard)
  - Buttons/Inputs: `12px`
  - Chips: `9999px` (fully rounded)
- [ ] **Shadows**: Ambient shadows (4px blur, 6% opacity) cho cards
- [ ] **Hover States**: 
  - Scale: `1.02x`
  - Shadow increase
  - Transition: `300ms ease`
- [ ] **Responsive**: Mobile-first, breakpoints tại 768px, 1024px
- [ ] **Z-index**: Phù hợp với layer (dropdown: 40, modal: 100)
- [ ] **Icons**: 16px (nav/buttons) hoặc 24px (features)
- [ ] **Container**: Max-width `1280px`, gutter `24px`
- [ ] **Accessibility**: 
  - Contrast ratio đạt WCAG AA
  - Focus states rõ ràng (2px Spring Green border)
  - Keyboard navigation
- [ ] **Images**: Inherit parent radius, object-fit: cover
- [ ] **Background**: `#f7fafc` cho page, `#ffffff` cho cards

---

## 📚 References

- **Stitch Design System**: SpringFood Design System (assets/f01d94a512c0498786d73c6d913ee054)
- **Font**: Plus Jakarta Sans (Google Fonts)
- **Color System**: Material Design 3 (Fidelity variant)
- **Grid**: 8px base unit, strict mathematical spacing
- **Philosophy**: Organic Precision - Apple-inspired minimalism for food e-commerce

---

**Source**: Google Stitch E-commerce Homepage Project  
**Last Updated**: 2026-05-01  
**Version**: 2.0.0 (SpringFood Design System)

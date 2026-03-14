# 📦 Component Catalog - Springfood Frontend

**Project:** Springfood (Angular 19)  
**Date:** 2024  
**Status:** Landing Page with 7 Components

---

## 🎯 Component Hierarchy

```
AppComponent (Root)
├── app-color-ribbon          (Decorative)
├── app-hero                  (Marketing)
├── app-product-category-carousel  (Interactive)
├── app-trending-categories   (Static Grid)
├── app-featured-products     (Container)
│   └── app-product-card      (Child - Reusable)
├── app-header               (Navigation)
└── <router-outlet />
```

---

## 📋 Components Overview

### 1. **HeaderComponent** 🎨
**Path:** `src/app/components/header/`

#### Purpose
Navigation header with dropdown menus, language selector, search functionality, and logo.

#### Key Features
- **Mega Menu System** - Dropdown navigation with multi-column layout
- **Language Selector** - Support for 4 languages (EN, VI, FR, DE)
- **Search Dropdown** - Quick links search with suggestions
- **Logo** - Company branding
- **Sign In Button** - User authentication entry

#### Signals (State)
```typescript
navItems[]              // Nav menu items with submenus
languages[]           // Available language options
quickLinks[]          // Search suggestions
selectedLanguage      // Currently selected language
isLangDropdownOpen    // Language dropdown toggle
isSearchOpen          // Search box toggle
logoUrl              // Header logo URL
activeMenu           // Current active mega menu
```

#### Key Methods
- `toggleLangDropdown()` - Toggle language selector
- `toggleSearch()` - Toggle search input
- `selectLanguage()` - Change language
- `showMenu()` - Display mega menu
- `hideMenu()` - Close mega menu
- `onDocumentClick()` - Outside click handler
- `onEscapeKey()` - Close all menus on ESC

#### Change Detection
`OnPush` - Optimized for performance

#### Dependencies
- Angular Core (signals, viewChild, ElementRef)

---

### 2. **ColorRibbonComponent** 🌈
**Path:** `src/app/components/color-ribbon/`

#### Purpose
Decorative animated gradient ribbon at the top of the page.

#### Key Features
- Animated gradient colors
- CSS-based animations
- Pure visual element (no interactivity)

#### Signals
None - Stateless component

#### Change Detection
Default

#### Dependencies
None (standalone, no imports)

---

### 3. **HeroComponent** 🎬
**Path:** `src/app/components/hero/`

#### Purpose
Large hero section with marketing headline and call-to-action.

#### Key Features
- Headline copy
- Store name branding
- Hero imagery/background
- Marketing message

#### Signals
None - Stateless component

#### Change Detection
Default

#### Dependencies
None (standalone, no imports)

---

### 4. **ProductCategoryCarouselComponent** 🎠
**Path:** `src/app/components/product-category-carousel/`

#### Purpose
Horizontally scrollable carousel of product categories with navigation buttons.

#### Key Features
- **Horizontal Scroll** - Smooth scrolling carousel
- **Dynamic Button Visibility** - Prev/Next buttons appear based on scroll position
- **Category List** - 10 categories (iPhone, iPad, Apple Watch, etc.)
- **Image Gallery** - Category thumbnail images
- **Scroll Animation** - Smooth scroll behavior

#### Signals (State)
```typescript
categories[]        // Product categories with images
showPrev           // Show previous button flag
showNext           // Show next button flag
```

#### Key Methods
- `scroll(direction)` - Scroll carousel left/right
- `updateButtonVisibility()` - Update button display based on scroll position

#### Change Detection
`OnPush` - Optimized performance

#### Effects
- Auto-attach scroll listener when carousel mounts

#### Dependencies
- Angular Core (signal, viewChild, effect, ElementRef)

#### Data Structure
```typescript
interface ProductCategory {
  name: string;        // Category name (e.g., "iPhone")
  imageUrl: string;    // Category image URL
}
```

---

### 5. **TrendingCategoriesComponent** ⭐
**Path:** `src/app/components/trending-categories/`

#### Purpose
Display top 5 trending product categories in a ranked grid layout.

#### Key Features
- **Ranking System** - 5 ranked categories with badges (🥇🥈🥉)
- **Card Grid** - 5 category cards with images
- **Gradient Backgrounds** - Unique background pattern per category
- **Price Display** - Starting price for each category
- **Subtitle Info** - Category description (e.g., "Organic & Healthy")

#### Signals (State)
```typescript
trendingCategories[]  // 5 trending items with rank & styling
```

#### Key Methods
- `getRankBadge(rank)` - Get emoji badge for rank (🥇, 🥈, 🥉, etc.)
- `getRankColor(rank)` - Get gradient color based on rank

#### Change Detection
Default

#### Dependencies
- CommonModule (for *ngIf, *ngFor)
- Angular Core (signal)

#### Data Structure
```typescript
interface TrendingCategory {
  id: number;
  name: string;        // Category name
  subtitle: string;    // Description
  price: string;       // Starting price
  imageUrl: string;    // Category image
  rank: number;        // Ranking 1-5
  bgPattern: string;   // Tailwind gradient class
}
```

#### Tailwind Classes Used
- Gradient backgrounds: `from-yellow-100 via-orange-50 to-yellow-100`
- Rank colors: `from-yellow-400 to-yellow-600`, etc.

---

### 6. **FeaturedProductsComponent** 🎯
**Path:** `src/app/components/featured-products/`

#### Purpose
Display 3 featured products in a responsive grid using ProductCardComponent.

#### Key Features
- **Featured Products Grid** - 3 main products (iPhone, MacBook, iPad)
- **Product Data** - Title, subtitle, description, image, styling
- **Reusable Cards** - Uses ProductCardComponent for rendering
- **Dynamic Styling** - Different colors/gradients per product

#### Signals (State)
```typescript
products[]  // Array of 3 featured FeaturedProduct objects
```

#### Change Detection
`OnPush` - Optimized performance

#### Dependencies
- ProductCardComponent (child component)
- Angular Core (signal)

#### Data Structure
```typescript
interface FeaturedProduct {
  title: string;      // Product name
  subtitle: string;   // Feature highlight
  description: string; // Price/details
  imageUrl: string;   // Product image
  bgClass: string;    // Tailwind bg gradient
  textColor: string;  // Text color (text-black/white)
  titleSize: string;  // Title size (e.g., "text-5xl")
  textAlign: string;  // Text alignment
}
```

#### Products Data
1. **iPhone 17 Pro** - Yellow gradient bg, $1099+
2. **MacBook Pro 14" M5** - Dark/black bg, $1599+
3. **iPad Pro** - Blue gradient bg, $999+

---

### 7. **ProductCardComponent** 💳
**Path:** `src/app/components/product-card/`

#### Purpose
Individual product card component - reusable child component for featured products.

#### Key Features
- **Product Display** - Image, title, subtitle, description
- **Dynamic Styling** - Accepts styling props (colors, gradients)
- **Input-Driven** - Receives product data via @Input
- **Gradient Support** - Custom background and text colors

#### Inputs
```typescript
@Input() product: FeaturedProduct (required)
```

#### Change Detection
`OnPush` - Optimized performance

#### Dependencies
- Angular Core (input, ChangeDetectionStrategy)

#### Data Interface
```typescript
export interface FeaturedProduct {
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  bgClass: string;
  textColor: string;
  titleSize: string;
  textAlign: string;
}
```

---

## 🎨 Styling Architecture

### Framework
- **Tailwind CSS** - Utility-first CSS framework
- **Custom CSS** - Component-specific styles in `.css` files
- **Gradients** - Extensive use of gradient backgrounds

### Color Palette (Observed)
- **Primary:** Yellows, Oranges (Apple brand colors)
- **Secondary:** Blacks, Grays (premium products)
- **Accents:** Blues, Indigos (featured sections)

### Responsive Design
- Tailwind responsive utilities (`sm:`, `md:`, `lg:`, etc.)
- Mobile-first approach
- Flexible carousel scrolling

---

## 🔄 State Management

### Approach
- **Signals API** (Angular 19) - Reactive state primitive
- **No external state library** (Redux, NgRx) - Overkill for demo
- **Component-local state** - Each component manages its own signals

### Example
```typescript
selectedLanguage = signal<Language>(this.languages()[0]);
activeMenu = signal<NavItem | null>(null);
```

### Updates
```typescript
selectLanguage(language: Language): void {
  this.selectedLanguage.set(language);
}

// Update derived from scroll
showNext.set(scrollLeft < scrollWidth - clientWidth - 1);
```

---

## 🚀 Performance Optimizations

### Change Detection Strategy
- `OnPush` applied to: HeaderComponent, ProductCategoryCarouselComponent, FeaturedProductsComponent, ProductCardComponent
- Means: Only update when inputs change or events fire (not on every tick)

### Effects
- ProductCategoryCarouselComponent uses `effect()` for scroll listener attachment
- Automatic cleanup via Angular's effect lifecycle

### Signal Efficiency
- Tracked dependencies ensure minimal re-renders
- Signals automatically update template when value changes

---

## 📱 Component Usage

### App Root Layout
```html
<app-header></app-header>
<app-color-ribbon></app-color-ribbon>
<app-hero></app-hero>
<app-product-category-carousel></app-product-category-carousel>
<app-trending-categories></app-trending-categories>
<app-featured-products></app-featured-products>
<router-outlet></router-outlet>
```

### Standalone vs Module
All components are **Standalone** (Angular 19 pattern):
- No need for NgModule imports
- Self-contained with `imports: [...]` array
- Easier to tree-shake unused code

---

## 🔗 Data Flow

```
App Root
  │
  ├─→ Header (owns: navItems, languages, search state)
  │
  ├─→ ColorRibbon (pure presentational)
  │
  ├─→ Hero (pure presentational)
  │
  ├─→ ProductCategoryCarousel (owns: categories[], scroll state)
  │
  ├─→ TrendingCategories (owns: trendingCategories[])
  │
  └─→ FeaturedProducts (owns: products[])
        │
        └─→ ProductCard (receives product via @Input)
```

### Data Sources
- **Static/Mock Data** - All data hardcoded in components via signals
- **No API Calls** - No HttpClient usage in current implementation
- **Image URLs** - Mix of localhost:9000 and external URLs (unsplash, apple.com)

---

## ⚙️ Configuration

### Angular Config
- **Version:** 19.x
- **Build Tool:** Angular CLI + Webpack
- **Rendering:** Client-side (with SSR capability via server.ts)
- **TypeScript:** Strict mode enabled

### Key Files
- `angular.json` - Build configuration
- `tsconfig.json` - TypeScript compiler options
- `tailwind.config.js` - Tailwind CSS setup
- `src/app/app.routes.ts` - Currently empty (no routing)

---

## 🎯 Summary Table

| Component | Purpose | Standalone | OnPush | Stateful | Reusable |
|-----------|---------|-----------|--------|----------|----------|
| Header | Navigation | ✅ | ✅ | ✅ | ❌ |
| ColorRibbon | Decoration | ✅ | ❌ | ❌ | ✅ |
| Hero | Hero Section | ✅ | ❌ | ❌ | ✅ |
| ProductCategoryCarousel | Category Carousel | ✅ | ✅ | ✅ | ✅ |
| TrendingCategories | Trending Grid | ✅ | ❌ | ✅ | ✅ |
| FeaturedProducts | Product Grid | ✅ | ✅ | ✅ | ✅ |
| ProductCard | Product Card | ✅ | ✅ | ❌ | ✅ |

---

## 📝 Next Steps (Recommendations)

1. **Add Routing** - Populate `app.routes.ts` with product, order, checkout pages
2. **Add Services** - Create HttpClient services for backend API integration
3. **Form Components** - Build login, registration, checkout forms
4. **State Management** - If complexity grows, consider signals or NgRx
5. **Testing** - Add unit tests for components
6. **Accessibility** - Improve ARIA labels, keyboard navigation

---

*Generated: Component Analysis for Springfood Frontend*

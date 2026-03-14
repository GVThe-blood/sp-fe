# 📊 Component Architecture Diagram

## 1. Component Hierarchy Tree

```
┌─────────────────────────────────────────────────────────────┐
│                   AppComponent (Root)                        │
│                                                              │
│  Imports: HeaderComponent, other components                 │
│  Template: app.component.html                              │
│  Styles: app.component.css                                 │
└──────────────┬──────────────────────────────────────────────┘
               │
        ┌──────┴──────────────────┬──────────────────┬──────────────────┬──────────────────┐
        │                         │                  │                  │                  │
        ▼                         ▼                  ▼                  ▼                  ▼
┌─────────────────┐    ┌──────────────────┐ ┌─────────────┐ ┌────────────────┐ ┌──────────────┐
│  HeaderComponent│    │ColorRibbonComp.  │ │HeroComponent│ │ProductCategory │ │TrendingCat.  │
│                 │    │                  │ │             │ │CarouselComponent│ │Component    │
│ Navigation      │    │ Decorative       │ │ Marketing   │ │                │ │              │
│ Menu Dropdown   │    │ Animated Ribbon  │ │ Headlines   │ │ Horizontal     │ │ Ranked Grid  │
│ Search         │    │                  │ │             │ │ Carousel       │ │ (5 items)    │
│ Lang Selector   │    │ Pure Presenter   │ │ Hero Image  │ │ Scroll Buttons │ │              │
│                 │    │                  │ │             │ │                │ │ Badges: 🥇🥈🥉 │
└────────┬────────┘    └──────────────────┘ └─────────────┘ └────────────────┘ └──────────────┘
         │
    ┌────┴───────────────────────────────────────────────────┐
    │                                                        │
    ▼                                                        ▼
┌──────────────────────────────────────┐ ┌───────────────────────────────┐
│ FeaturedProductsComponent            │ │  <router-outlet />            │
│                                      │ │                               │
│ Container for Featured Products     │ │  (Empty - for future routes)  │
│ Owns: products[] signal             │ │                               │
│ Change Detection: OnPush            │ │  Not currently used           │
└────────────┬─────────────────────────┘ └───────────────────────────────┘
             │
    ┌────────┴────────┬────────────┐
    │                 │            │
    ▼                 ▼            ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ProductCard   │ │ProductCard   │ │ProductCard   │
│(iPhone 17Pro)│ │(MacBook Pro) │ │(iPad Pro)    │
└──────────────┘ └──────────────┘ └──────────────┘
```

---

## 2. Component Relationship Matrix

```
┌──────────────────────┬────────────┬──────────┬───────────────┬─────────────────┐
│ Component            │ Imports    │ Exports  │ Parent        │ Children        │
├──────────────────────┼────────────┼──────────┼───────────────┼─────────────────┤
│ AppComponent         │ Header,    │ exports  │ main.ts       │ Header          │
│                      │ Featured   │ routes[] │ bootstrap     │ ColorRibbon     │
│                      │ Products   │          │               │ Hero            │
│                      │            │          │               │ ProductCat...   │
│                      │            │          │               │ Trending...     │
│                      │            │          │               │ Featured...     │
├──────────────────────┼────────────┼──────────┼───────────────┼─────────────────┤
│ HeaderComponent      │ none       │ no       │ AppComponent  │ none            │
│ (Standalone)         │            │          │               │                 │
├──────────────────────┼────────────┼──────────┼───────────────┼─────────────────┤
│ ColorRibbonComponent │ none       │ no       │ AppComponent  │ none            │
│ (Standalone)         │            │          │               │                 │
├──────────────────────┼────────────┼──────────┼───────────────┼─────────────────┤
│ HeroComponent        │ none       │ no       │ AppComponent  │ none            │
│ (Standalone)         │            │          │               │                 │
├──────────────────────┼────────────┼──────────┼───────────────┼─────────────────┤
│ ProductCategory      │ none       │ no       │ AppComponent  │ none            │
│ CarouselComponent    │            │          │               │                 │
│ (Standalone)         │            │          │               │                 │
├──────────────────────┼────────────┼──────────┼───────────────┼─────────────────┤
│ TrendingCategories   │ CommonMod. │ no       │ AppComponent  │ none            │
│ Component            │ (for *ngIf)│          │               │                 │
│ (Standalone)         │            │          │               │                 │
├──────────────────────┼────────────┼──────────┼───────────────┼─────────────────┤
│ FeaturedProducts     │ ProductCard│ no       │ AppComponent  │ ProductCard     │
│ Component            │            │          │               │ (x3)            │
│ (Standalone)         │            │          │               │                 │
├──────────────────────┼────────────┼──────────┼───────────────┼─────────────────┤
│ ProductCardComponent │ none       │ yes      │ FeaturedProd. │ none            │
│ (Standalone)         │            │ exports  │ Component     │                 │
│                      │            │ interface│               │                 │
└──────────────────────┴────────────┴──────────┴───────────────┴─────────────────┘
```

---

## 3. Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              Component Data Flow                              │
└──────────────────────────────────────────────────────────────────────────────┘

AppComponent
│
├─ HeaderComponent
│  │
│  ├─ Signal: navItems → Template: *ngFor nav menu items
│  ├─ Signal: languages → Template: Language dropdown
│  ├─ Signal: selectedLanguage → Display current language
│  ├─ Signal: isSearchOpen → Show/hide search input
│  ├─ Signal: activeMenu → Display mega menu
│  │
│  └─ Event: Click/Hover
│     ├─ toggleLangDropdown() → Update isLangDropdownOpen
│     ├─ toggleSearch() → Update isSearchOpen
│     ├─ selectLanguage() → Update selectedLanguage
│     └─ showMenu() → Update activeMenu
│
├─ ColorRibbonComponent
│  │
│  └─ No state (pure visual)
│
├─ HeroComponent
│  │
│  └─ No state (pure visual)
│
├─ ProductCategoryCarouselComponent
│  │
│  ├─ Signal: categories[] → Template: *ngFor carousel items
│  ├─ Signal: showPrev → Conditional button visibility
│  ├─ Signal: showNext → Conditional button visibility
│  │
│  └─ Event: Scroll/Click
│     ├─ scroll('left') → Update carousel scroll position
│     ├─ scroll('right') → Update carousel scroll position
│     └─ updateButtonVisibility() → Update showPrev/showNext
│
├─ TrendingCategoriesComponent
│  │
│  ├─ Signal: trendingCategories[] → Template: *ngFor 5 items
│  │
│  └─ Computed:
│     ├─ getRankBadge() → Return emoji badge (🥇🥈🥉)
│     └─ getRankColor() → Return gradient class string
│
└─ FeaturedProductsComponent
   │
   ├─ Signal: products[] → Array of 3 FeaturedProduct objects
   │
   └─ Child Component (3x):
      └─ ProductCardComponent
         │
         ├─ @Input: product: FeaturedProduct (required)
         │
         └─ Template:
            ├─ {{ product.title }}
            ├─ {{ product.subtitle }}
            ├─ {{ product.description }}
            ├─ <img [src]="product.imageUrl" />
            └─ [class]="product.bgClass + ' ' + product.textColor"
```

---

## 4. Component Dependency Graph

```
                        ┌─────────────────┐
                        │  Angular Core   │
                        │  (signals, etc) │
                        └────────┬────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
  │   Header     │      │ColorRibbon   │      │    Hero      │
  │  Component   │      │  Component   │      │  Component   │
  └──────────────┘      └──────────────┘      └──────────────┘
        │
        ▼
  ┌──────────────────────────────────────────────────────────┐
  │        @angular/common (CommonModule)                    │
  │        - *ngIf, *ngFor, etc.                            │
  └──────────────────────────────────────────────────────────┘
        │
        ├─ TrendingCategoriesComponent (uses CommonModule)
        │
        ├─ FeaturedProductsComponent
        │  │
        │  └─ ProductCardComponent (child)
        │
        └─ ProductCategoryCarouselComponent
```

---

## 5. State Management Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                    Signal-Based State Management                    │
│                    (Angular 19 Reactive Primitives)                │
└────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────┐
│  HeaderComponent            │
│  (Most Complex State)       │
│                             │
│  signal(): navItems[]       │  ─→ Reactive data
│  signal(): languages[]      │  ─→ Reactive data
│  signal(): selectedLanguage │  ─→ Derives display
│  signal(): isLangDropdownOpen   ─→ UI state
│  signal(): isSearchOpen     │  ─→ UI state
│  signal(): activeMenu       │  ─→ UI state
│                             │
│  effect(): Hide menu timer  │  ─→ Side effect
│  effect(): Scroll listener  │  ─→ Side effect
│                             │
│  Template watches ALL signals
│  → Automatic re-render on change
└─────────────────────────────┘


┌─────────────────────────────────────────────────┐
│  ProductCategoryCarouselComponent               │
│                                                 │
│  signal(): categories[] = [10 categories]       │  ─→ Data
│  signal(): showPrev = false                     │  ─→ Derived UI
│  signal(): showNext = true                      │  ─→ Derived UI
│                                                 │
│  effect(): Attach scroll listener               │  ─→ Side effect
│  updateButtonVisibility(): Compute showPrev/Next │
│                                                 │
│  Template watches 3 signals
└─────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────┐
│  TrendingCategoriesComponent                    │
│                                                 │
│  signal(): trendingCategories[] = [5 items]    │  ─→ Data
│                                                 │
│  Template watches 1 signal                      │
└─────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────┐
│  FeaturedProductsComponent                       │
│                                                  │
│  signal(): products[] = [3 featured products]   │  ─→ Data
│                                                  │
│  Passes products[i] → ProductCard component     │
│  via @Input binding                             │
└──────────────────────────────────────────────────┘
```

---

## 6. Styling Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                    CSS/Tailwind Strategy                        │
└────────────────────────────────────────────────────────────────┘

Global Styles
   │
   ├─ src/styles.css
   │  ├─ @tailwind base
   │  ├─ @tailwind components
   │  ├─ @tailwind utilities
   │  └─ Custom global rules
   │
   └─ tailwind.config.js (configuration)
      ├─ theme: {}
      ├─ plugins: []
      └─ content: ['src/**/*.html', 'src/**/*.ts']


Component Styles
   │
   ├─ HeaderComponent
   │  ├─ header.component.css (custom dropdown styles)
   │  └─ Template: Tailwind utility classes
   │     - bg-white, shadow-md, p-4, etc.
   │
   ├─ ProductCategoryCarouselComponent
   │  ├─ carousel.component.css (scroll styles)
   │  └─ Template: Tailwind utilities
   │     - flex, overflow-x-auto, etc.
   │
   ├─ TrendingCategoriesComponent
   │  ├─ trending.component.css (grid styles)
   │  └─ Template: Tailwind utilities
   │     - grid, gap-4, bg-gradient-to-br, etc.
   │
   └─ FeaturedProductsComponent
      ├─ featured.component.css
      └─ Template: Dynamic [class] binding
         - [class]="product.bgClass"
         - [class]="product.textColor"
         - Gradient strings passed as props


Tailwind Pattern Examples:
   ┌────────────────────────────────────────────────┐
   │ Gradients:                                     │
   │ bg-gradient-to-br from-yellow-50 to-orange-100 │
   │ from-gray-800 to-black                        │
   │                                                │
   │ Spacing:                                       │
   │ p-4, py-8, px-6, m-0, gap-4                   │
   │                                                │
   │ Typography:                                    │
   │ text-5xl, text-center, text-white, text-black │
   │                                                │
   │ Layout:                                        │
   │ flex, grid, grid-cols-3, overflow-x-auto      │
   │                                                │
   │ Effects:                                       │
   │ shadow-md, rounded-lg, opacity-50             │
   └────────────────────────────────────────────────┘
```

---

## 7. Component Lifecycle Flow

```
┌─────────────────────────────────────────────────────────────┐
│         Component Bootstrap → Mount → Render → Update       │
└─────────────────────────────────────────────────────────────┘

App Start (main.ts)
   │
   ▼
bootstrapApplication(AppComponent, appConfig)
   │
   ├─ App providers loaded
   ├─ Router initialized
   ├─ Client hydration setup
   │
   ▼
AppComponent OnInit
   │
   ├─ Load child components:
   │  ├─ HeaderComponent
   │  │  └─ Initialize signals (navItems, languages, etc.)
   │  │
   │  ├─ ColorRibbonComponent
   │  │  └─ Render static CSS
   │  │
   │  ├─ HeroComponent
   │  │  └─ Render static content
   │  │
   │  ├─ ProductCategoryCarouselComponent
   │  │  ├─ Initialize categories[] signal
   │  │  └─ effect() → Attach scroll listener
   │  │
   │  ├─ TrendingCategoriesComponent
   │  │  └─ Initialize trendingCategories[] signal
   │  │
   │  └─ FeaturedProductsComponent
   │     ├─ Initialize products[] signal
   │     └─ Render 3 ProductCard children
   │
   ▼
User Interaction (Click, Scroll, Hover)
   │
   ├─ Header: Click lang dropdown
   │  └─ toggleLangDropdown() → signal.set() → Template re-render
   │
   ├─ Carousel: Click prev/next
   │  └─ scroll() → Update scroll position → updateButtonVisibility() → signal.set()
   │
   └─ Search: Type in search
      └─ toggleSearch() → signal.set() → Template re-render

Signal Update Flow:
   signal.set(newValue)
      │
      ▼
   Signal marked as dirty
      │
      ▼
   Component marked for re-render
      │
      ▼
   Template watches signal binding {{ signal() }}
      │
      ▼
   Template re-renders (ONLY if using OnPush with signal changes)
```

---

## 8. Routing Structure (Current & Future)

```
┌─────────────────────────────────────────────────────────────┐
│                      Routing Tree                            │
└─────────────────────────────────────────────────────────────┘

Current State:
   /                   (AppComponent - Landing Page)
   │
   └─ <router-outlet />  (EMPTY - no child routes)


Future Recommended Routes:
   /                   (Home/Landing)
      ├─ /products     (Product listing)
      │  └─ /products/:id (Product detail)
      ├─ /categories   (Category browse)
      ├─ /login        (User login)
      ├─ /register     (User registration)
      ├─ /profile      (User profile)
      ├─ /cart         (Shopping cart)
      ├─ /checkout     (Checkout flow)
      └─ /orders       (Order management)


Branches with Partial Implementation:
   ├─ feat/order-page-ui        → /orders (to be integrated)
   ├─ feature-store-detail-page → /products/:id (to be integrated)
   ├─ feat-login-page           → /login (to be integrated)
   └─ feature-registration-page → /register (to be integrated)
```

---

## 9. Summary: Component Statistics

```
┌──────────────────────────────────────┬───────┐
│ Total Components                     │   7   │
├──────────────────────────────────────┼───────┤
│ Standalone Components                │   7   │ (100%)
│ Components with OnPush Detection     │   4   │ (57%)
│ Stateful Components                  │   5   │ (71%)
│ Reusable Components                  │   6   │ (86%)
├──────────────────────────────────────┼───────┤
│ Total Lines of TypeScript Code       │  ~400 │
│ Total Signals Used                   │  ~20  │
│ Child Component Relationships         │   1   │ (ProductCard in Featured)
│ External Imports                     │   1   │ (CommonModule)
└──────────────────────────────────────┴───────┘
```

---

## 10. Visual Layout (UI Order)

```
┌───────────────────────────────────────────────────────┐
│                  <app-header>                         │
│         (Navigation, Logo, Search, Lang)              │
├───────────────────────────────────────────────────────┤
│              <app-color-ribbon>                       │
│           (Animated Gradient Ribbon)                  │
├───────────────────────────────────────────────────────┤
│                 <app-hero>                            │
│        (Hero Section, Headlines, Imagery)             │
├───────────────────────────────────────────────────────┤
│      <app-product-category-carousel>                  │
│    (Horizontal Carousel of 10 Categories)             │
├───────────────────────────────────────────────────────┤
│       <app-trending-categories>                       │
│     (Grid of 5 Top-Ranked Categories)                 │
├───────────────────────────────────────────────────────┤
│       <app-featured-products>                         │
│  (Grid of 3 Featured Products with Cards)             │
│    ├─ <app-product-card> (iPhone)                     │
│    ├─ <app-product-card> (MacBook)                    │
│    └─ <app-product-card> (iPad)                       │
├───────────────────────────────────────────────────────┤
│           <router-outlet />                           │
│      (Currently empty, for future routes)             │
└───────────────────────────────────────────────────────┘
```

---

*Generated Component Architecture Diagram - Springfood Frontend*

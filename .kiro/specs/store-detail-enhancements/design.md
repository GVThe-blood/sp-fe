# Design Document

## Overview

This design document outlines the technical approach for enhancing the store detail page in the SpringFood Angular application. The enhancements focus on improving user experience through visual improvements, interactive elements, and better state management. The implementation will follow Angular best practices using standalone components, signals for reactive state management, and Tailwind CSS for styling.

## Architecture

### Component Structure

```
src/app/
├── pages/
│   └── store-detail/
│       ├── store-detail.component.ts (enhanced)
│       ├── store-detail.component.html (enhanced)
│       └── store-detail.component.css (enhanced)
├── components/
│   ├── star-rating/
│   │   ├── star-rating.component.ts
│   │   ├── star-rating.component.html
│   │   └── star-rating.component.css
│   └── product-detail-modal/
│       ├── product-detail-modal.component.ts
│       ├── product-detail-modal.component.html
│       └── product-detail-modal.component.css
└── models/
    └── store.models.ts (enhanced)
```

### State Management Strategy

- Use Angular signals for reactive state management
- Component-level state for UI interactions (favorites, modal visibility, active category)
- Computed signals for derived state (cart totals, grouped products, active category based on scroll)
- Event emitters for parent-child component communication

### Styling Approach

- Tailwind CSS utility classes for consistent styling
- CSS transitions for smooth animations
- Custom CSS classes for complex animations (favorite heart, add-to-cart success)
- Responsive design using Tailwind breakpoints

## Components and Interfaces

### 1. StarRatingComponent

**Purpose**: Reusable component to display star ratings with partial fill support

**Inputs**:
- `rating: number` - The rating value (0-5)
- `showNumber: boolean = true` - Whether to display the numeric rating
- `size: 'sm' | 'md' | 'lg' = 'md'` - Size variant

**Template Structure**:
```html
<div class="flex items-center gap-1">
  <div class="flex">
    <!-- 5 star icons with dynamic fill -->
  </div>
  <span *ngIf="showNumber">{{ rating }}</span>
</div>
```

**Implementation Details**:
- Calculate fill percentage for each star based on rating
- Use CSS clip-path or SVG masks for partial star fills
- Support three size variants: sm (12px), md (16px), lg (20px)

### 2. ProductDetailModalComponent

**Purpose**: Modal dialog for displaying product details and customization options

**Inputs**:
- `product: Product | null` - The product to display
- `isOpen: boolean` - Modal visibility state

**Outputs**:
- `addToCart: EventEmitter<CartItem>` - Emits when user confirms add to cart
- `close: EventEmitter<void>` - Emits when modal should close

**State**:
- `selectedOptions: Signal<Map<string, string>>` - Selected customization options
- `quantity: Signal<number>` - Selected quantity
- `customerNote: Signal<string>` - Customer note text
- `totalPrice: Computed<number>` - Calculated total price with options

**Template Structure**:
```html
<div class="modal-overlay" *ngIf="isOpen" (click)="onOverlayClick()">
  <div class="modal-content" (click)="$event.stopPropagation()">
    <!-- Product image -->
    <!-- Product name, rating, sold count -->
    <!-- Customer note textarea -->
    <!-- Customization option groups (radio buttons) -->
    <!-- Quantity controls -->
    <!-- Add to cart button with total price -->
  </div>
</div>
```

### 3. Enhanced StoreDetailComponent

**New State Properties**:
- `storeBannerUrl: Signal<string>` - Store banner image URL
- `favoriteProducts: Signal<Set<number>>` - Set of favorited product IDs
- `isStoreFavorite: Signal<boolean>` - Store favorite state
- `activeCategory: Signal<number | null>` - Currently active category based on scroll
- `selectedProduct: Signal<Product | null>` - Product selected for modal
- `isModalOpen: Signal<boolean>` - Modal visibility state
- `addedToCartProductId: Signal<number | null>` - Product ID showing success animation

**New Methods**:
- `toggleStoreFavorite(): void` - Toggle store favorite state
- `toggleProductFavorite(productId: number): void` - Toggle product favorite state
- `openProductModal(product: Product): void` - Open product detail modal
- `closeProductModal(): void` - Close product detail modal
- `handleAddToCart(cartItem: CartItem): void` - Handle add to cart from modal
- `onScroll(): void` - Handle scroll event for category highlighting
- `showAddSuccess(productId: number): void` - Show add-to-cart success animation

## Data Models

### Enhanced Product Interface

```typescript
interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  sold: number;
  likes: number;
  rating: number;
  isSoldOut: boolean;
  categoryId: number;
  description?: string;
  customizationGroups?: CustomizationGroup[];
}
```

### New Interfaces

```typescript
interface CustomizationGroup {
  id: string;
  name: string;
  required: boolean;
  maxSelection: number; // 1 for radio, >1 for checkbox
  options: CustomizationOption[];
}

interface CustomizationOption {
  id: string;
  name: string;
  priceModifier: number; // Additional cost (can be 0)
}

interface CartItem {
  product: Product;
  quantity: number;
  note?: string;
  selectedOptions?: Map<string, string>; // groupId -> optionId
}

interface StoreInfo {
  name: string;
  address: string;
  rating: number;
  reviewCount: string;
  openTime: string;
  distance: string;
  image: string;
  bannerImage: string; // New property
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Star rating completeness and proportionality
*For any* rating value between 0 and 5, the StarRatingComponent should render exactly 5 star icons where the total filled area (in yellow) corresponds proportionally to the rating value, with unfilled areas in gray, and the numeric rating displayed beside the stars
**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**

### Property 2: Favorite state toggle consistency
*For any* product or store, when the favorite button is clicked an odd number of times, the favorite state should be true and the heart icon should be filled with red color; when clicked an even number of times, the state should be false and the heart icon should be outline in gray color
**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.6**

### Property 3: Category navigation and highlighting
*For any* category tag that is clicked, the page should scroll to show the corresponding category section, and that tag should become highlighted with active styling
**Validates: Requirements 4.1, 4.4, 6.4**

### Property 4: Scroll-based active category tracking
*For any* scroll position, the active category tag should correspond to the topmost visible product category section in the viewport, with the tag highlighting updating as the user scrolls
**Validates: Requirements 4.3, 4.5, 6.3**

### Property 5: Modal product data integrity
*For any* product that is clicked (either on the card or add button), the ProductDetailModal should open and display all product information (image, name, price, rating, sold count, and all customization options) matching the clicked product
**Validates: Requirements 5.1, 5.2, 5.3, 5.5, 6.5**

### Property 6: Customization price calculation
*For any* combination of product base price, selected customization options with price modifiers, and quantity, the displayed total price should equal: (base price + sum of selected option price modifiers) × quantity
**Validates: Requirements 5.6, 5.7**

### Property 7: Cart item addition and synchronization
*For any* product configuration added to cart from the modal, the cart display should immediately update to show the new item with correct product reference, quantity, selected options, and calculated price
**Validates: Requirements 5.9, 6.1**

### Property 8: Cart total calculation
*For any* cart state, the displayed cart total should equal the sum of (item price × item quantity) for all items in the cart
**Validates: Requirements 6.2**

### Property 9: Add-to-cart success feedback
*For any* successful add-to-cart action, the add button icon should transform from plus to checkmark, remain as checkmark for at least 800 milliseconds, then transform back to plus
**Validates: Requirements 7.2, 7.3**

## Error Handling

### Image Loading Failures
- Provide fallback images for store banner and product images
- Use placeholder images with appropriate aspect ratios
- Log errors to console for debugging

### Modal Interaction Errors
- Prevent modal from closing when clicking inside modal content
- Validate customization selections before allowing add to cart
- Handle rapid clicks on add-to-cart button (debounce)

### Scroll Event Performance
- Throttle scroll event handlers to prevent performance issues
- Use Intersection Observer API for efficient category visibility detection
- Debounce category tag updates to avoid flickering

### State Management Errors
- Validate product IDs before adding to favorites set
- Ensure cart items have valid product references
- Handle null/undefined product data gracefully in modal

## Testing Strategy

### Unit Testing

**StarRatingComponent Tests**:
- Test rendering with integer ratings (0, 1, 2, 3, 4, 5)
- Test rendering with decimal ratings (2.5, 3.7, 4.2)
- Test size variants (sm, md, lg)
- Test with/without numeric display

**ProductDetailModalComponent Tests**:
- Test modal open/close behavior
- Test customization option selection
- Test quantity increment/decrement
- Test price calculation with options
- Test add-to-cart event emission

**StoreDetailComponent Tests**:
- Test favorite toggle for store and products
- Test category scroll navigation
- Test modal opening with correct product
- Test cart updates after adding items

### Property-Based Testing

We will use **fast-check** library for property-based testing in TypeScript/Angular.

**Property Test 1: Star Rating Visual Consistency**
- Generate random rating values between 0 and 5
- Verify total filled star area matches rating proportion
- Check that exactly 5 stars are always rendered

**Property Test 2: Favorite State Toggle**
- Generate random sequences of favorite button clicks
- Verify state matches click count parity (odd=true, even=false)
- Verify icon color matches state (red=true, gray=false)

**Property Test 3: Price Calculation**
- Generate random products with base prices
- Generate random customization options with price modifiers
- Generate random quantities
- Verify calculated total matches formula: (base + sum(modifiers)) × quantity

**Property Test 4: Cart Synchronization**
- Generate random product additions to cart
- Verify cart count increases correctly
- Verify cart total price is sum of all item totals
- Verify cart items contain correct product references

**Property Test 5: Category Scroll Mapping**
- Generate random category IDs
- Simulate clicking category tags
- Verify correct category section is scrolled into view
- Verify correct tag becomes active

### Integration Testing

- Test complete user flow: browse products → open modal → customize → add to cart
- Test scroll behavior with multiple categories visible
- Test favorite persistence across component lifecycle
- Test modal interaction with cart updates

### Animation Testing

- Verify CSS transitions are applied correctly
- Test animation timing matches specifications
- Verify animations don't block user interactions
- Test animation performance on slower devices

## Implementation Notes

### Banner Image Implementation
- Add banner image URL to storeInfo object
- Create full-width container with fixed height (200-250px)
- Use `object-fit: cover` for proper image scaling
- Position banner above store information section

### Star Rating Implementation
- Create array of 5 star elements
- Calculate fill percentage for each star: `Math.max(0, Math.min(1, rating - index))`
- Use linear gradient or clip-path for partial fills
- Apply yellow color (#FBBF24) for filled portions, gray (#D1D5DB) for empty

### Favorite Animation Implementation
- Use CSS transitions for color and scale changes
- Apply `transform: scale(1.2)` on click, then return to scale(1)
- Transition duration: 300ms with ease-out timing
- Use filled heart SVG when favorited, outline heart when not

### Category Scroll Tracking Implementation
- Use Intersection Observer API to detect visible category sections
- Set threshold to 0.5 (50% visibility) for triggering active state
- Update active category signal when intersection changes
- Apply active styling to corresponding tag

### Modal Implementation
- Use fixed positioning with backdrop overlay
- Implement fade-in animation (opacity 0 → 1, scale 0.95 → 1)
- Add click-outside-to-close functionality
- Prevent body scroll when modal is open
- Use z-index layering for proper stacking

### Add-to-Cart Success Animation
- Store product ID in signal when add-to-cart succeeds
- Replace plus icon with checkmark icon
- Apply green color and scale animation
- Use setTimeout to revert after 1000ms
- Clear product ID from signal after animation

### Performance Optimizations
- Use `trackBy` functions in `*ngFor` loops
- Implement virtual scrolling for long product lists if needed
- Lazy load product images with loading="lazy" attribute
- Debounce scroll event handlers (100ms)
- Use OnPush change detection strategy where applicable

### Responsive Design Considerations
- Banner height: 200px on mobile, 250px on desktop
- Modal: full-screen on mobile, centered dialog on desktop
- Category tags: horizontal scroll on mobile, wrap on desktop
- Star rating: smaller size on mobile product cards
- Cart sidebar: bottom sheet on mobile, sticky sidebar on desktop

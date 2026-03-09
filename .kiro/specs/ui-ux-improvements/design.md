# Design Document

## Overview

This design document outlines the technical implementation for comprehensive UI/UX improvements to the SpringFood application. The improvements focus on creating a centralized theme system, redesigning the product modal for better usability, fixing data persistence bugs, enhancing cart functionality with bulk operations, and ensuring accurate price calculations throughout the application.

## Architecture

### Theme System Architecture

```
src/
├── styles/
│   ├── theme.css (centralized theme variables)
│   └── utilities.css (theme-based utility classes)
├── styles.css (imports theme)
└── app/
    └── components/ (consume theme variables)
```

**Design Principles:**
- Single source of truth for all design tokens
- CSS custom properties for runtime flexibility
- Semantic naming for maintainability
- Organized by category (colors, spacing, shadows, etc.)

### Component Updates

**Modified Components:**
- `ProductDetailModalComponent` - Layout redesign, validation, data reset
- `StoreDetailComponent` - Cart enhancements, edit mode, price calculations
- Product cards - Original price display

**New Features:**
- Bulk delete mode in cart
- Click-to-edit cart items
- Always-enabled buttons with validation feedback
- Section dividers in modal

## Components and Interfaces

### 1. Theme System (theme.css)

**CSS Custom Properties Structure:**

```css
:root {
  /* Primary Colors - Orange Theme */
  --color-primary: #ff6b35;
  --color-primary-hover: #ff5722;
  --color-primary-light: #ffebe6;
  
  /* Secondary Colors */
  --color-secondary: #4a5568;
  --color-secondary-hover: #2d3748;
  
  /* Semantic Colors */
  --color-success: #10b981;
  --color-error: #ef4444;
  --color-warning: #f59e0b;
  
  /* Neutral Grays */
  --color-gray-50 through --color-gray-900
  
  /* Spacing System */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  
  /* Transitions */
  --transition-fast: 150ms ease-in-out;
  --transition-base: 200ms ease-in-out;
  --transition-slow: 300ms ease-in-out;
}
```

**Utility Classes:**
- `.btn-primary`, `.btn-secondary`, `.btn-outline`
- `.text-primary`, `.text-secondary`, `.text-muted`
- `.divider` - 8px gray section separator

### 2. Enhanced ProductDetailModalComponent

**New State Properties:**

```typescript
interface ValidationErrors {
  [groupId: string]: string;
}

// New signals
validationErrors = signal<ValidationErrors>({});
isEditMode = signal<boolean>(false);
editingCartItemIndex = signal<number | null>(null);
```

**Updated Methods:**

```typescript
// Reset all fields when product changes
private resetModalData(): void {
  this.quantity.set(1);
  this.customerNote.set('');
  this.selectedOptions.set(new Map());
  this.validationErrors.set({});
}

// Validate and show errors
private validateSelections(): boolean {
  const errors: ValidationErrors = {};
  
  if (this.product?.customizationGroups) {
    this.product.customizationGroups.forEach(group => {
      if (group.required && !this.selectedOptions().get(group.id)) {
        errors[group.id] = 'Vui lòng chọn một tùy chọn';
      }
    });
  }
  
  this.validationErrors.set(errors);
  return Object.keys(errors).length === 0;
}

// Handle add to cart with validation
onAddToCart(): void {
  if (!this.validateSelections()) {
    return; // Show errors, don't proceed
  }
  
  // Proceed with add/update
  if (this.isEditMode()) {
    this.updateCart.emit({...});
  } else {
    this.addToCart.emit({...});
  }
}

// Open for editing existing cart item
openForEdit(cartItem: CartItem, index: number): void {
  this.isEditMode.set(true);
  this.editingCartItemIndex.set(index);
  this.quantity.set(cartItem.quantity);
  this.customerNote.set(cartItem.note || '');
  this.selectedOptions.set(new Map(cartItem.selectedOptions));
}
```

**New Output Events:**

```typescript
@Output() updateCart = new EventEmitter<{
  index: number;
  cartItem: CartItem;
}>();
```

**Template Layout Changes:**

```html
<!-- Floating close button -->
<button class="absolute -top-3 -right-3 z-10 bg-white rounded-full shadow-lg">
  <svg><!-- X icon --></svg>
</button>

<!-- Product info section -->
<div class="product-info">...</div>

<!-- Divider -->
<div class="divider"></div>

<!-- Customization options in grid -->
<div class="grid grid-cols-2 gap-4">
  <div *ngFor="let group of smallGroups">
    <h4>{{ group.name }}</h4>
    <!-- Show error if validation failed -->
    <p *ngIf="validationErrors()[group.id]" class="text-error">
      {{ validationErrors()[group.id] }}
    </p>
    <!-- Options -->
  </div>
</div>

<!-- Divider -->
<div class="divider"></div>

<!-- Full-width groups -->
<div *ngFor="let group of largeGroups">...</div>

<!-- Divider -->
<div class="divider"></div>

<!-- Customer note -->
<textarea>...</textarea>

<!-- Bottom action bar -->
<div class="flex items-center gap-4">
  <!-- Quantity controls (left side) -->
  <div class="flex items-center gap-2">
    <button class="btn-primary">-</button>
    <span>{{ quantity() }}</span>
    <button class="btn-primary">+</button>
  </div>
  
  <!-- Add to cart button (always enabled) -->
  <button class="btn-primary flex-1">
    {{ isEditMode() ? 'Cập nhật' : 'Thêm vào giỏ' }} - {{ formatPrice(totalPrice()) }}đ
  </button>
</div>
```

### 3. Enhanced StoreDetailComponent

**New State Properties:**

```typescript
// Cart edit mode
isCartEditMode = signal<boolean>(false);
selectedCartItems = signal<Set<number>>(new Set());

// Track which cart item is being edited
editingCartItem = signal<{item: CartItem, index: number} | null>(null);
```

**Updated Cart Item Interface:**

```typescript
interface CartItem {
  product: Product;
  quantity: number;
  note?: string;
  selectedOptions?: Map<string, string>;
  // Computed display properties
  displayOptions?: string; // Formatted options string
  itemTotal?: number; // Pre-calculated total with modifiers
}
```

**New Methods:**

```typescript
// Toggle cart edit mode
toggleCartEditMode(): void {
  this.isCartEditMode.update(v => !v);
  if (!this.isCartEditMode()) {
    this.selectedCartItems.set(new Set());
  }
}

// Toggle cart item selection
toggleCartItemSelection(index: number): void {
  this.selectedCartItems.update(selected => {
    const newSet = new Set(selected);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    return newSet;
  });
}

// Select all cart items
selectAllCartItems(): void {
  const allIndices = this.cart().map((_, i) => i);
  this.selectedCartItems.set(new Set(allIndices));
}

// Delete selected cart items
deleteSelectedCartItems(): void {
  const selected = this.selectedCartItems();
  this.cart.update(currentCart => 
    currentCart.filter((_, index) => !selected.has(index))
  );
  this.selectedCartItems.set(new Set());
  this.isCartEditMode.set(false);
}

// Open cart item for editing
editCartItem(item: CartItem, index: number): void {
  this.selectedProduct.set(item.product);
  this.editingCartItem.set({item, index});
  this.isModalOpen.set(true);
  // Modal will open in edit mode
}

// Handle cart item update from modal
handleUpdateCartItem(data: {index: number, cartItem: CartItem}): void {
  this.cart.update(currentCart => {
    const newCart = [...currentCart];
    newCart[data.index] = data.cartItem;
    return newCart;
  });
  this.editingCartItem.set(null);
}

// Calculate item total with modifiers
calculateItemTotal(item: CartItem): number {
  let total = item.product.price;
  
  if (item.selectedOptions && item.product.customizationGroups) {
    item.selectedOptions.forEach((optionId, groupId) => {
      const group = item.product.customizationGroups!.find(g => g.id === groupId);
      if (group) {
        const option = group.options.find(o => o.id === optionId);
        if (option) {
          total += option.priceModifier;
        }
      }
    });
  }
  
  return total * item.quantity;
}

// Format options for display
formatCartItemOptions(item: CartItem): string {
  if (!item.selectedOptions || !item.product.customizationGroups) {
    return '';
  }
  
  const options: string[] = [];
  item.selectedOptions.forEach((optionId, groupId) => {
    const group = item.product.customizationGroups!.find(g => g.id === groupId);
    if (group) {
      const option = group.options.find(o => o.id === optionId);
      if (option) {
        let optionText = option.name;
        if (option.priceModifier > 0) {
          optionText += ` (+${this.formatPrice(option.priceModifier)}đ)`;
        }
        options.push(optionText);
      }
    }
  });
  
  return options.join(', ');
}
```

**Updated cartTotal Computed:**

```typescript
cartTotal = computed(() => {
  return this.cart().reduce((acc, item) => {
    return acc + this.calculateItemTotal(item);
  }, 0);
});
```

### 4. Product Interface Enhancement

**Updated Product Interface:**

```typescript
interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number; // NEW: For strikethrough display
  image: string;
  sold: number;
  likes: number;
  rating?: number;
  isSoldOut: boolean;
  categoryId: number;
  description?: string;
  customizationGroups?: CustomizationGroup[];
}
```

## Data Models

### ValidationErrors Model

```typescript
interface ValidationErrors {
  [groupId: string]: string; // groupId -> error message
}
```

### CartEditState Model

```typescript
interface CartEditState {
  isEditMode: boolean;
  selectedItems: Set<number>; // indices of selected items
}
```

### ModalEditContext Model

```typescript
interface ModalEditContext {
  isEditMode: boolean;
  cartItemIndex: number | null;
  originalCartItem: CartItem | null;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Theme variable consistency
*For any* component that uses theme colors, the rendered color should match the CSS variable value defined in theme.css, ensuring visual consistency across the application
**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Modal data reset on product change
*For any* sequence of opening different products in the modal, each product should start with quantity=1, empty note, and default option selections, with no data persisting from previous products
**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

### Property 3: Validation error display
*For any* required customization group without a selection, when the add-to-cart button is clicked, an error message should appear next to that group and the cart should not be updated
**Validates: Requirements 3.2, 3.3, 3.4**

### Property 4: Cart item option display
*For any* cart item with selected customization options, the displayed options string should include all selected option names and their price modifiers (if non-zero)
**Validates: Requirements 5.1, 5.2, 5.3**

### Property 5: Bulk delete consistency
*For any* set of selected cart items, when the delete button is clicked, exactly those items should be removed from the cart and the cart total should update accordingly
**Validates: Requirements 6.5, 6.6**

### Property 6: Price calculation accuracy
*For any* cart item, the displayed item total should equal (base price + sum of selected option price modifiers) × quantity
**Validates: Requirements 9.3, 9.4, 9.6**

### Property 7: Cart total accuracy
*For any* cart state, the displayed cart total should equal the sum of all individual item totals (each calculated with their option modifiers)
**Validates: Requirements 9.4, 9.6**

### Property 8: Edit mode cart item pre-fill
*For any* cart item clicked for editing, the modal should open with quantity, note, and options pre-filled to match the cart item's current values
**Validates: Requirements 8.2, 8.3, 8.4**

### Property 9: Select all functionality
*For any* cart state in edit mode, clicking "Select All" should check all cart item checkboxes, and the selected set should contain all cart item indices
**Validates: Requirements 6.3**

### Property 10: Original price display
*For any* product with an originalPrice property where originalPrice > price, both prices should be displayed with the original price having strikethrough styling
**Validates: Requirements 7.1, 7.2, 7.5**

## Error Handling

### Validation Errors
- Display inline error messages next to invalid fields
- Use theme error colors (red) for visibility
- Clear errors immediately when field is corrected
- Prevent cart updates when validation fails

### Cart Operations
- Handle empty cart gracefully
- Validate cart item indices before operations
- Prevent delete when no items selected
- Handle concurrent cart modifications

### Modal State Management
- Ensure clean state on open/close
- Handle rapid open/close cycles
- Prevent memory leaks from unclosed subscriptions
- Reset edit mode when modal closes

### Price Calculation Edge Cases
- Handle missing option modifiers (default to 0)
- Handle undefined customization groups
- Validate numeric calculations
- Format prices consistently with locale

## Testing Strategy

### Unit Testing

**Theme System Tests:**
- Verify CSS variables are defined
- Test utility class generation
- Validate color contrast ratios

**Modal Component Tests:**
- Test data reset on product change
- Test validation error display
- Test edit mode pre-fill
- Test always-enabled button behavior

**Cart Component Tests:**
- Test bulk delete functionality
- Test select all/deselect all
- Test cart item click-to-edit
- Test price calculations with modifiers

### Property-Based Testing

We will use **fast-check** library for property-based testing.

**Property Test 1: Modal Data Reset**
- Generate random product sequences
- Open each product in modal
- Verify quantity=1, note='', options=defaults for each

**Property Test 2: Price Calculation**
- Generate random products with options
- Generate random option selections and quantities
- Verify total = (base + sum(modifiers)) × quantity

**Property Test 3: Cart Total Accuracy**
- Generate random cart states with various items
- Calculate expected total manually
- Verify displayed total matches calculation

**Property Test 4: Bulk Delete**
- Generate random cart with N items
- Generate random selection of K items
- Delete selected items
- Verify cart has exactly N-K items remaining

**Property Test 5: Validation Errors**
- Generate products with required groups
- Generate incomplete selections
- Verify error messages appear for missing required fields

### Integration Testing

- Test complete flow: select options → add to cart → edit → update
- Test bulk delete with various selection patterns
- Test theme changes propagate to all components
- Test responsive behavior on different screen sizes

### Visual Regression Testing

- Capture screenshots of modal layouts
- Verify section dividers appear correctly
- Verify floating close button positioning
- Verify quantity controls alignment

## Implementation Notes

### Theme System Implementation
- Create `src/styles/theme.css` with all CSS variables
- Import in `src/styles.css`
- Replace hardcoded colors in components with `var(--color-*)`
- Use Tailwind's `theme()` function where needed

### Modal Layout Implementation
- Use CSS Grid for two-column option layout
- Position close button with `absolute` and negative margins
- Use flexbox for bottom action bar
- Add `.divider` class between sections

### Validation Implementation
- Validate on button click, not on field change
- Store errors in signal for reactivity
- Clear individual errors when field is corrected
- Use `*ngIf` to conditionally show error messages

### Cart Edit Mode Implementation
- Toggle between normal and edit mode
- Show/hide checkboxes based on mode
- Swap edit icon with delete button
- Disable delete button when no selection

### Price Calculation Implementation
- Create helper method `calculateItemTotal(item)`
- Use in cart display and cart total computation
- Ensure option modifiers are included
- Format with thousand separators

### Click-to-Edit Implementation
- Add click handler to cart items
- Pass cart item and index to edit method
- Set modal to edit mode
- Pre-fill all fields from cart item
- Emit update event instead of add event

### Responsive Considerations
- Modal: full-screen on mobile, centered on desktop
- Options grid: 1 column on mobile, 2 columns on desktop
- Cart: bottom sheet on mobile, sidebar on desktop
- Touch targets: minimum 44px on mobile

### Performance Optimizations
- Use `trackBy` for cart item lists
- Memoize price calculations where possible
- Debounce validation checks if needed
- Use OnPush change detection

### Accessibility
- Ensure error messages are announced by screen readers
- Maintain focus management in modal
- Provide keyboard navigation for cart edit mode
- Use semantic HTML for checkboxes and buttons


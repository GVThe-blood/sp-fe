# Design Document

## Overview

Tài liệu thiết kế này mô tả chi tiết kỹ thuật để triển khai các cải tiến UI/UX cho ứng dụng SpringFood. Các cải tiến bao gồm: chuẩn hóa nút close modal, cải thiện quantity controls, FoodCare insurance dropdown, modal chi tiết mã giảm giá, và các điều chỉnh layout.

## Architecture

### Component Updates

**Modified Components:**
- `ProductDetailModalComponent` - Nút close mới, quantity controls nhỏ hơn với màu sắc, checkbox vuông
- `PromoCodeModalComponent` - Thêm modal chi tiết, disabled state, giới hạn selection
- `OrderComponent` - FoodCare dropdown, layout order items, font size
- `StoreDetailComponent` - Nút yêu thích nhỏ hơn, thêm footer
- `AddressModalComponent` - Nút close thống nhất

### New Components
- `PromoDetailModalComponent` - Modal hiển thị chi tiết mã giảm giá

## Components and Interfaces

### 1. Unified Close Button Style

```css
/* Shared close button style for all modals */
.modal-close-btn {
  position: absolute;
  top: -12px;
  right: -12px;
  width: 40px;
  height: 40px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s ease;
  z-index: 10;
}

.modal-close-btn:hover {
  transform: scale(1.05);
}

.modal-close-btn svg {
  width: 20px;
  height: 20px;
  color: #4a5568;
  stroke-width: 2.5;
}
```

### 2. Product Modal Quantity Controls

```html
<!-- Smaller quantity controls with color coding -->
<div class="flex items-center gap-2">
  <!-- Decrease button - Orange -->
  <button class="quantity-btn quantity-btn-decrease">
    <svg><!-- minus icon --></svg>
  </button>
  
  <span class="quantity-value">{{ quantity() }}</span>
  
  <!-- Increase button - Green -->
  <button class="quantity-btn quantity-btn-increase">
    <svg><!-- plus icon --></svg>
  </button>
</div>
```

```css
.quantity-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.quantity-btn-decrease {
  background-color: var(--color-primary); /* Orange */
  color: white;
}

.quantity-btn-increase {
  background-color: var(--color-success); /* Green */
  color: white;
}
```

### 3. Rounded Square Option Selectors

```html
<!-- Option selector with rounded square checkbox -->
<label class="option-selector">
  <div class="option-checkbox" [class.checked]="isSelected">
    <svg *ngIf="isSelected" class="check-icon"><!-- check icon --></svg>
  </div>
  <span class="option-label">{{ option.name }}</span>
</label>
```

```css
.option-checkbox {
  width: 20px;
  height: 20px;
  border: 1.5px solid var(--border-default);
  border-radius: 4px; /* Rounded square */
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.option-checkbox.checked {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}
```

### 4. FoodCare Insurance Dropdown

```typescript
interface FoodCareState {
  isExpanded: boolean;
  isConfirmed: boolean;
}

// Component signals
foodCareExpanded = signal<boolean>(false);
foodCareConfirmed = signal<boolean>(false);
```

```html
<!-- FoodCare Insurance Dropdown -->
<div class="foodcare-section" [class.confirmed]="foodCareConfirmed()">
  <!-- Header - Clickable to expand -->
  <div class="foodcare-header" (click)="toggleFoodCare()">
    <div class="flex items-center gap-2">
      <span class="material-symbols-outlined">verified_user</span>
      <span>Đơn hàng có Bảo hiểm Food Care</span>
    </div>
    <svg class="expand-icon" [class.rotated]="foodCareExpanded()">
      <!-- chevron icon -->
    </svg>
  </div>
  
  <!-- Expandable Content -->
  <div *ngIf="foodCareExpanded()" class="foodcare-content">
    <div class="foodcare-info">
      <div class="flex items-start gap-3">
        <div class="confirm-checkbox" 
             [class.checked]="foodCareConfirmed()"
             (click)="toggleFoodCareConfirm()">
          <svg *ngIf="foodCareConfirmed()"><!-- check --></svg>
        </div>
        <div>
          <h4>Bảo hiểm Food Care</h4>
          <p>Bằng việc giữ chọn ô "BH Food Care"...</p>
          <p class="price">1.000đ/đơn hàng</p>
        </div>
      </div>
    </div>
    <button class="detail-link">Chi tiết ></button>
  </div>
</div>
```

### 5. Promo Code Modal Enhancements

```typescript
interface PromoCode {
  id: string;
  title: string;
  description: string;
  expiryDate: Date;
  type: 'food' | 'delivery';
  isDisabled: boolean;
  disabledReason?: string;
  image?: string;
  conditions: string[];
  minOrderValue?: number;
  maxDiscount?: number;
}

// New signals
showDetailModal = signal<boolean>(false);
selectedPromoForDetail = signal<PromoCode | null>(null);

// Methods
getDisplayedPromos(type: 'food' | 'delivery'): PromoCode[] {
  const promos = this.promoCodes().filter(p => p.type === type);
  // Sort: available first, then disabled
  const sorted = promos.sort((a, b) => {
    if (a.isDisabled === b.isDisabled) return 0;
    return a.isDisabled ? 1 : -1;
  });
  // Limit to 10
  return sorted.slice(0, 10);
}

canSelectPromo(promo: PromoCode): boolean {
  if (promo.isDisabled) return false;
  
  const selected = this.selectedPromoCodes();
  const sameTypeSelected = selected.find(p => p.type === promo.type);
  
  // Already have one of this type
  if (sameTypeSelected && sameTypeSelected.id !== promo.id) {
    return false;
  }
  
  return true;
}
```

```html
<!-- Promo Card with separate click zones -->
<div class="promo-card" [class.disabled]="promo.isDisabled">
  <!-- Left: Badge -->
  <div class="promo-badge">...</div>
  
  <!-- Middle: Info (click opens detail) -->
  <div class="promo-info" (click)="openPromoDetail(promo)">
    <h4>{{ promo.title }}</h4>
    <p>{{ promo.description }}</p>
    <p>HSD: {{ formatDate(promo.expiryDate) }}</p>
  </div>
  
  <!-- Right: Checkbox (click toggles selection) -->
  <div class="promo-checkbox-area" (click)="togglePromoSelection(promo); $event.stopPropagation()">
    <div class="promo-checkbox" [class.checked]="isSelected(promo.id)" [class.disabled]="!canSelectPromo(promo)">
      <svg *ngIf="isSelected(promo.id)"><!-- check --></svg>
    </div>
  </div>
</div>

<!-- Promo Detail Modal -->
<div *ngIf="showDetailModal()" class="promo-detail-modal">
  <div class="modal-header">
    <button (click)="closeDetailModal()" class="back-btn">
      <svg><!-- arrow left --></svg>
    </button>
    <h2>Chi tiết khuyến mại</h2>
    <button (click)="closeAllModals()" class="modal-close-btn">
      <svg><!-- X --></svg>
    </button>
  </div>
  
  <div class="modal-content">
    <img [src]="selectedPromoForDetail()?.image" />
    <h3>{{ selectedPromoForDetail()?.title }}</h3>
    <p>HSD: {{ formatDate(selectedPromoForDetail()?.expiryDate) }}</p>
    
    <div class="conditions">
      <h4>Chi tiết</h4>
      <ul>
        <li *ngFor="let condition of selectedPromoForDetail()?.conditions">
          {{ condition }}
        </li>
      </ul>
    </div>
  </div>
  
  <div class="modal-footer">
    <button (click)="applyPromoFromDetail()" class="apply-btn">
      Dùng sau
    </button>
  </div>
</div>
```

### 6. Order Item Layout

```html
<!-- Order item with separated quantity -->
<div class="order-item">
  <img [src]="item.imageUrl" class="item-image" />
  
  <div class="item-info">
    <p class="item-name">{{ item.name }}</p>
    <p class="item-options">{{ item.options }}</p>
    <button class="edit-btn">Chỉnh sửa món</button>
  </div>
  
  <!-- Quantity - vertically centered -->
  <div class="item-quantity">
    <span>{{ item.quantity }}X</span>
  </div>
  
  <!-- Price -->
  <div class="item-price">
    <p *ngIf="item.originalPrice" class="original-price">
      {{ formatPrice(item.originalPrice * item.quantity) }}
    </p>
    <p class="current-price">{{ formatPrice(item.price * item.quantity) }}</p>
  </div>
  
  <!-- Delete button - vertically centered -->
  <button class="delete-btn">
    <span class="material-symbols-outlined">delete</span>
  </button>
</div>
```

```css
.order-item {
  display: flex;
  align-items: center; /* Vertically center all items */
  gap: 1rem;
  padding: 0.75rem;
}

.item-quantity {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: var(--text-primary);
}

.delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  color: var(--text-muted);
  transition: color 0.2s;
}

.delete-btn:hover {
  color: var(--color-error);
}
```

### 7. Payment Section Font Size

```css
.payment-section .payment-option {
  font-size: 0.875rem; /* 14px - smaller */
}

.payment-section .section-title {
  font-size: 1.125rem; /* 18px - keep current */
  font-weight: 600;
}
```

## Data Models

### PromoCode Extended Model

```typescript
interface PromoCode {
  id: string;
  title: string;
  description: string;
  expiryDate: Date;
  type: 'food' | 'delivery';
  isDisabled: boolean;
  disabledReason?: string;
  image?: string;
  conditions: string[];
  minOrderValue?: number;
  maxDiscount?: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
}
```

### FoodCare State Model

```typescript
interface FoodCareState {
  isExpanded: boolean;
  isConfirmed: boolean;
  price: number;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Modal close button consistency
*For any* modal component that is open, the close button element should exist with the unified styling class (modal-close-btn)
**Validates: Requirements 1.1**

### Property 2: FoodCare dropdown expansion
*For any* click on the FoodCare header, the expanded state should toggle and display the insurance information with confirmation checkbox
**Validates: Requirements 4.2**

### Property 3: FoodCare confirmation state change
*For any* confirmation action on FoodCare insurance, the section should change to confirmed state (green styling)
**Validates: Requirements 4.3**

### Property 4: Disabled promo codes not selectable
*For any* promo code with isDisabled=true, clicking on it should not change the selection state
**Validates: Requirements 5.1**

### Property 5: Promo checkbox area toggles selection
*For any* enabled promo code, clicking on the checkbox area should toggle its selection state
**Validates: Requirements 5.2**

### Property 6: Promo info area opens detail modal
*For any* promo code, clicking on the information area should open the detail modal with that promo's data
**Validates: Requirements 5.3**

### Property 7: Maximum 10 promos per category
*For any* category of promo codes, the displayed list should contain at most 10 items
**Validates: Requirements 5.5**

### Property 8: Available promos sorted before disabled
*For any* list of displayed promo codes, all available (non-disabled) codes should appear before any disabled codes
**Validates: Requirements 5.6**

### Property 9: Maximum 2 promo codes selection
*For any* selection state, the user should not be able to select more than 2 promo codes (1 delivery + 1 product)
**Validates: Requirements 5.7**

## Error Handling

### Promo Code Selection
- Prevent selection of disabled promo codes
- Show toast/message when trying to select more than allowed
- Handle edge case when promo becomes disabled after selection

### FoodCare Insurance
- Default to collapsed and unconfirmed state
- Persist confirmation state during session
- Handle toggle during form submission

## Testing Strategy

### Unit Testing

**Modal Components:**
- Test close button renders with correct class
- Test close button click triggers close event

**Promo Code Modal:**
- Test disabled promos are not selectable
- Test click zones work independently
- Test detail modal opens with correct data
- Test maximum selection limit

**Order Component:**
- Test FoodCare dropdown toggle
- Test FoodCare confirmation state change
- Test quantity display separation

### Property-Based Testing

We will use **fast-check** library for property-based testing.

**Property Test 1: Promo sorting**
- Generate random list of promos with mixed disabled states
- Verify all available promos appear before disabled ones

**Property Test 2: Promo selection limit**
- Generate random selection attempts
- Verify never more than 2 promos selected (1 per type)

**Property Test 3: FoodCare state toggle**
- Generate random toggle sequences
- Verify state always matches expected after toggles

### Integration Testing

- Test complete promo selection flow
- Test FoodCare confirmation affects total calculation
- Test modal navigation (main → detail → back)

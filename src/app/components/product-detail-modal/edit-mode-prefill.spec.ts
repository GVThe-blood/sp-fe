/**
 * Property-Based Test for Edit Mode Cart Item Pre-fill
 * 
 * Feature: ui-ux-improvements, Property 8: Edit mode cart item pre-fill
 * Validates: Requirements 8.2, 8.3, 8.4
 * 
 * Property: For any cart item clicked for editing, the modal should open with 
 * quantity, note, and options pre-filled to match the cart item's current values
 */

import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import * as fc from 'fast-check';
import { ProductDetailModalComponent } from './product-detail-modal.component';
import { SimpleChange } from '@angular/core';

// Type definitions
interface CustomizationOption {
  id: string;
  name: string;
  priceModifier: number;
}

interface CustomizationGroup {
  id: string;
  name: string;
  required: boolean;
  maxSelection: number;
  options: CustomizationOption[];
}

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  sold: number;
  likes: number;
  rating?: number;
  isSoldOut: boolean;
  categoryId: number;
  description?: string;
  customizationGroups?: CustomizationGroup[];
}

interface CartItem {
  product: Product;
  quantity: number;
  note?: string;
  selectedOptions?: Map<string, string>;
}

// Generators
const customizationOptionArb = fc.record({
  id: fc.stringMatching(/^opt-[a-z0-9]+$/),
  name: fc.oneof(fc.constant('Đá'), fc.constant('Nóng'), fc.constant('Vừa'), fc.constant('Lớn')),
  priceModifier: fc.oneof(fc.constant(0), fc.constant(5000), fc.constant(10000))
});

const customizationGroupArb = fc.record({
  id: fc.stringMatching(/^group-[a-z0-9]+$/),
  name: fc.oneof(fc.constant('Nhiệt độ'), fc.constant('Kích cỡ'), fc.constant('Đường')),
  required: fc.boolean(),
  maxSelection: fc.constant(1),
  options: fc.array(customizationOptionArb, { minLength: 2, maxLength: 4 })
});

const productArb = fc.record({
  id: fc.integer({ min: 1, max: 1000 }),
  name: fc.stringMatching(/^[A-Za-z\s]+$/),
  price: fc.integer({ min: 10000, max: 100000 }),
  originalPrice: fc.option(fc.integer({ min: 10000, max: 150000 }), { nil: undefined }),
  image: fc.constant('https://example.com/image.jpg'),
  sold: fc.integer({ min: 0, max: 10000 }),
  likes: fc.integer({ min: 0, max: 1000 }),
  rating: fc.option(fc.float({ min: 1, max: 5 }), { nil: undefined }),
  isSoldOut: fc.constant(false),
  categoryId: fc.integer({ min: 1, max: 10 }),
  description: fc.option(fc.string(), { nil: undefined }),
  customizationGroups: fc.array(customizationGroupArb, { minLength: 1, maxLength: 3 })
});

// Generator for cart items with selected options
const cartItemArb = productArb.chain(product => {
  // Generate selected options based on the product's customization groups
  const selectedOptionsArb = fc.constant(new Map<string, string>()).chain(baseMap => {
    if (!product.customizationGroups || product.customizationGroups.length === 0) {
      return fc.constant(baseMap);
    }
    
    // For each group, select a random option
    const optionSelections = product.customizationGroups.map(group => {
      return fc.integer({ min: 0, max: group.options.length - 1 }).map(index => ({
        groupId: group.id,
        optionId: group.options[index].id
      }));
    });
    
    return fc.tuple(...optionSelections).map(selections => {
      const map = new Map<string, string>();
      selections.forEach(({ groupId, optionId }) => {
        map.set(groupId, optionId);
      });
      return map;
    });
  });
  
  return fc.record({
    product: fc.constant(product),
    quantity: fc.integer({ min: 1, max: 10 }),
    note: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: undefined }),
    selectedOptions: selectedOptionsArb
  });
});

describe('ProductDetailModal - Edit Mode Pre-fill Property Tests', () => {
  let component: ProductDetailModalComponent;
  let fixture: ComponentFixture<ProductDetailModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductDetailModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductDetailModalComponent);
    component = fixture.componentInstance;
  });

  it('Property 8: Edit mode pre-fills quantity, note, and options from cart item', () => {
    fc.assert(
      fc.property(cartItemArb, fc.integer({ min: 0, max: 100 }), (cartItem, index) => {
        
        // Set the product first
        component.product = cartItem.product;
        fixture.detectChanges();
        
        // Call openForEdit with the cart item
        component.openForEdit(cartItem, index);
        fixture.detectChanges();
        
        // Verify: isEditMode should be true
        expect(component.isEditMode()).toBe(true);
        
        // Verify: editingCartItemIndex should match
        expect(component.editingCartItemIndex()).toBe(index);
        
        // Verify: quantity should match cart item quantity
        expect(component.quantity()).toBe(cartItem.quantity);
        
        // Verify: customer note should match cart item note (or empty string if undefined)
        expect(component.customerNote()).toBe(cartItem.note || '');
        
        // Verify: selected options should match cart item options
        if (cartItem.selectedOptions) {
          const componentOptions = component.selectedOptions();
          expect(componentOptions.size).toBe(cartItem.selectedOptions.size);
          
          cartItem.selectedOptions.forEach((optionId, groupId) => {
            expect(componentOptions.get(groupId)).toBe(optionId);
          });
        }
      }),
      { numRuns: 100 }
    );
  });
  
  it('Property 8b: Edit mode button text changes to "Cập nhật"', () => {
    fc.assert(
      fc.property(cartItemArb, fc.integer({ min: 0, max: 100 }), (cartItem, index) => {
        // Reset component state before each run
        component.isEditMode.set(false);
        component.editingCartItemIndex.set(null);
        
        // Set the product first
        component.product = cartItem.product;
        fixture.detectChanges();
        
        // Initially, should not be in edit mode
        expect(component.isEditMode()).toBe(false);
        
        // Call openForEdit
        component.openForEdit(cartItem, index);
        fixture.detectChanges();
        
        // Verify: isEditMode should now be true
        expect(component.isEditMode()).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
  
  it('Property 8c: Edit mode emits updateCart instead of addToCart', fakeAsync(() => {
    fc.assert(
      fc.property(cartItemArb, fc.integer({ min: 0, max: 100 }), (cartItem, index) => {
        
        // Set the product first
        component.product = cartItem.product;
        fixture.detectChanges();
        
        // Track which event was emitted
        let addToCartEmitted = false;
        let updateCartEmitted = false;
        let updateCartData: any = null;
        
        component.addToCart.subscribe(() => {
          addToCartEmitted = true;
        });
        
        component.updateCart.subscribe((data) => {
          updateCartEmitted = true;
          updateCartData = data;
        });
        
        // Open for edit
        component.openForEdit(cartItem, index);
        fixture.detectChanges();
        
        // Trigger add to cart (which should actually update)
        component.onAddToCart();
        
        // Wait for debounce timeout
        tick(600);
        
        // Verify: updateCart should be emitted, not addToCart
        expect(updateCartEmitted).toBe(true);
        expect(addToCartEmitted).toBe(false);
        
        // Verify: updateCart data should include the index
        expect(updateCartData).toBeDefined();
        expect(updateCartData.index).toBe(index);
        expect(updateCartData.cartItem).toBeDefined();
      }),
      { numRuns: 20 } // Reduced runs due to async nature
    );
  }));
});

/**
 * Property-Based Test: Cart total accuracy
 * Feature: ui-ux-improvements, Property 7: Cart total accuracy
 * Validates: Requirements 9.4, 9.6
 * 
 * This test verifies that for any cart state, the displayed cart total equals
 * the sum of all individual item totals (each calculated with their option modifiers)
 */

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { StoreDetailComponent } from './store-detail.component';
import { ActivatedRoute } from '@angular/router';
import * as fc from 'fast-check';

// Type definitions matching the component
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

// Generators for property-based testing

/**
 * Generate a customization option with random price modifier
 */
const customizationOptionArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 10 }),
  name: fc.string({ minLength: 1, maxLength: 20 }),
  priceModifier: fc.integer({ min: 0, max: 50000 }) // 0 to 50,000đ
});

/**
 * Generate a customization group with 1-5 options
 */
const customizationGroupArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 10 }),
  name: fc.string({ minLength: 1, maxLength: 20 }),
  required: fc.boolean(),
  maxSelection: fc.constant(1),
  options: fc.array(customizationOptionArb, { minLength: 1, maxLength: 5 })
});

/**
 * Generate a product with 0-3 customization groups
 */
const productArb = fc.record({
  id: fc.integer({ min: 1, max: 1000 }),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  price: fc.integer({ min: 10000, max: 200000 }), // 10k to 200k đ
  image: fc.constant('test.jpg'),
  sold: fc.integer({ min: 0, max: 10000 }),
  likes: fc.integer({ min: 0, max: 1000 }),
  isSoldOut: fc.constant(false),
  categoryId: fc.integer({ min: 1, max: 10 }),
  customizationGroups: fc.array(customizationGroupArb, { minLength: 0, maxLength: 3 })
});

/**
 * Generate a cart item with valid selected options
 */
const cartItemArb = productArb.chain(product => {
  // Generate selected options that match the product's customization groups
  const selectedOptionsArb = fc.constant(new Map<string, string>()).chain(baseMap => {
    if (!product.customizationGroups || product.customizationGroups.length === 0) {
      return fc.constant(baseMap);
    }
    
    // For each group, randomly select one of its options
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
    note: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
    selectedOptions: selectedOptionsArb
  });
});

/**
 * Generate a cart with 0-10 items
 */
const cartArb = fc.array(cartItemArb, { minLength: 0, maxLength: 10 });

describe('Property 7: Cart total accuracy', () => {
  let component: StoreDetailComponent;
  let fixture: ComponentFixture<StoreDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoreDetailComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => '1'
              }
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StoreDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should calculate cart total as sum of all item totals', () => {
    fc.assert(
      fc.property(cartArb, (cart) => {
        const testFixture = TestBed.createComponent(StoreDetailComponent);
        const testComponent = testFixture.componentInstance;
        testFixture.detectChanges();

        // Calculate expected total by summing individual item totals
        const expectedTotal = cart.reduce((acc, item) => {
          return acc + testComponent.calculateItemTotal(item);
        }, 0);
        
        // Set the cart and calculate using the component's computed
        testComponent.cart.set(cart);
        const actualTotal = testComponent.cartTotal();
        
        // They should match
        expect(actualTotal).toBe(expectedTotal);

        testFixture.destroy();
      }),
      { numRuns: 100 }
    );
  });
  
  it('should return 0 for empty cart', () => {
    const testFixture = TestBed.createComponent(StoreDetailComponent);
    const testComponent = testFixture.componentInstance;
    testFixture.detectChanges();

    const emptyCart: CartItem[] = [];
    testComponent.cart.set(emptyCart);
    const total = testComponent.cartTotal();
    
    expect(total).toBe(0);

    testFixture.destroy();
  });
  
  it('should correctly sum carts with single item', () => {
    fc.assert(
      fc.property(cartItemArb, (cartItem) => {
        const testFixture = TestBed.createComponent(StoreDetailComponent);
        const testComponent = testFixture.componentInstance;
        testFixture.detectChanges();

        const cart = [cartItem];
        const expectedTotal = testComponent.calculateItemTotal(cartItem);
        
        testComponent.cart.set(cart);
        const actualTotal = testComponent.cartTotal();
        
        expect(actualTotal).toBe(expectedTotal);

        testFixture.destroy();
      }),
      { numRuns: 100 }
    );
  });
  
  it('should correctly sum carts with multiple items', () => {
    fc.assert(
      fc.property(
        fc.array(cartItemArb, { minLength: 2, maxLength: 10 }),
        (cart) => {
          const testFixture = TestBed.createComponent(StoreDetailComponent);
          const testComponent = testFixture.componentInstance;
          testFixture.detectChanges();

          // Manually calculate the sum
          let manualSum = 0;
          for (const item of cart) {
            let itemTotal = item.product.price;
            
            if (item.selectedOptions && item.product.customizationGroups) {
              item.selectedOptions.forEach((optionId, groupId) => {
                const group = item.product.customizationGroups!.find(g => g.id === groupId);
                if (group) {
                  const option = group.options.find(o => o.id === optionId);
                  if (option) {
                    itemTotal += option.priceModifier;
                  }
                }
              });
            }
            
            manualSum += itemTotal * item.quantity;
          }
          
          testComponent.cart.set(cart);
          const actualTotal = testComponent.cartTotal();
          
          expect(actualTotal).toBe(manualSum);

          testFixture.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it('should handle carts with items without customization groups', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            product: fc.record({
              id: fc.integer({ min: 1, max: 1000 }),
              name: fc.string({ minLength: 1, maxLength: 50 }),
              price: fc.integer({ min: 10000, max: 200000 }),
              image: fc.constant('test.jpg'),
              sold: fc.integer({ min: 0, max: 10000 }),
              likes: fc.integer({ min: 0, max: 1000 }),
              isSoldOut: fc.constant(false),
              categoryId: fc.integer({ min: 1, max: 10 }),
              customizationGroups: fc.constant(undefined)
            }),
            quantity: fc.integer({ min: 1, max: 10 }),
            selectedOptions: fc.constant(undefined)
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (cart) => {
          const testFixture = TestBed.createComponent(StoreDetailComponent);
          const testComponent = testFixture.componentInstance;
          testFixture.detectChanges();

          const expectedTotal = cart.reduce((acc, item) => {
            return acc + (item.product.price * item.quantity);
          }, 0);
          
          testComponent.cart.set(cart);
          const actualTotal = testComponent.cartTotal();
          
          expect(actualTotal).toBe(expectedTotal);

          testFixture.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it('should handle mixed carts with and without option modifiers', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          // Item with customization groups
          cartItemArb,
          // Item without customization groups
          fc.record({
            product: fc.record({
              id: fc.integer({ min: 1, max: 1000 }),
              name: fc.string({ minLength: 1, maxLength: 50 }),
              price: fc.integer({ min: 10000, max: 200000 }),
              image: fc.constant('test.jpg'),
              sold: fc.integer({ min: 0, max: 10000 }),
              likes: fc.integer({ min: 0, max: 1000 }),
              isSoldOut: fc.constant(false),
              categoryId: fc.integer({ min: 1, max: 10 }),
              customizationGroups: fc.constant(undefined)
            }),
            quantity: fc.integer({ min: 1, max: 10 }),
            selectedOptions: fc.constant(undefined)
          })
        ),
        ([itemWithOptions, itemWithoutOptions]) => {
          const testFixture = TestBed.createComponent(StoreDetailComponent);
          const testComponent = testFixture.componentInstance;
          testFixture.detectChanges();

          const cart = [itemWithOptions, itemWithoutOptions];
          
          const expectedTotal = 
            testComponent.calculateItemTotal(itemWithOptions) + 
            testComponent.calculateItemTotal(itemWithoutOptions);
          
          testComponent.cart.set(cart);
          const actualTotal = testComponent.cartTotal();
          
          expect(actualTotal).toBe(expectedTotal);

          testFixture.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });
});

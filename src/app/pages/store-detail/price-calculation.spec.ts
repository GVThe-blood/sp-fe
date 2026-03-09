/**
 * Property-Based Test: Price calculation accuracy
 * Feature: ui-ux-improvements, Property 6: Price calculation accuracy
 * Validates: Requirements 9.3, 9.4, 9.6
 * 
 * This test verifies that for any cart item, the displayed item total equals
 * (base price + sum of selected option price modifiers) × quantity
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

describe('Property 6: Price calculation accuracy', () => {
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

  it('should calculate item total as (base price + sum of modifiers) × quantity', () => {
    fc.assert(
      fc.property(cartItemArb, (cartItem) => {
        const testFixture = TestBed.createComponent(StoreDetailComponent);
        const testComponent = testFixture.componentInstance;
        testFixture.detectChanges();

        // Calculate expected total manually
        let expectedTotal = cartItem.product.price;
        
        if (cartItem.selectedOptions && cartItem.product.customizationGroups) {
          cartItem.selectedOptions.forEach((optionId, groupId) => {
            const group = cartItem.product.customizationGroups!.find(g => g.id === groupId);
            if (group) {
              const option = group.options.find(o => o.id === optionId);
              if (option) {
                expectedTotal += option.priceModifier;
              }
            }
          });
        }
        
        expectedTotal *= cartItem.quantity;
        
        // Calculate using the component's method
        const actualTotal = testComponent.calculateItemTotal(cartItem);
        
        // They should match
        expect(actualTotal).toBe(expectedTotal);

        testFixture.destroy();
      }),
      { numRuns: 100 }
    );
  });
  
  it('should handle items with no customization groups', () => {
    fc.assert(
      fc.property(
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
        (cartItem) => {
          const testFixture = TestBed.createComponent(StoreDetailComponent);
          const testComponent = testFixture.componentInstance;
          testFixture.detectChanges();

          const expectedTotal = cartItem.product.price * cartItem.quantity;
          const actualTotal = testComponent.calculateItemTotal(cartItem);
          
          expect(actualTotal).toBe(expectedTotal);

          testFixture.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it('should handle items with no selected options', () => {
    fc.assert(
      fc.property(
        productArb.chain(product => 
          fc.record({
            product: fc.constant(product),
            quantity: fc.integer({ min: 1, max: 10 }),
            selectedOptions: fc.constant(new Map<string, string>())
          })
        ),
        (cartItem) => {
          const testFixture = TestBed.createComponent(StoreDetailComponent);
          const testComponent = testFixture.componentInstance;
          testFixture.detectChanges();

          const expectedTotal = cartItem.product.price * cartItem.quantity;
          const actualTotal = testComponent.calculateItemTotal(cartItem);
          
          expect(actualTotal).toBe(expectedTotal);

          testFixture.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it('should correctly sum multiple option modifiers', () => {
    fc.assert(
      fc.property(cartItemArb, (cartItem) => {
        const testFixture = TestBed.createComponent(StoreDetailComponent);
        const testComponent = testFixture.componentInstance;
        testFixture.detectChanges();

        // Manually calculate the sum of all modifiers
        let modifiersSum = 0;
        
        if (cartItem.selectedOptions && cartItem.product.customizationGroups) {
          cartItem.selectedOptions.forEach((optionId, groupId) => {
            const group = cartItem.product.customizationGroups!.find(g => g.id === groupId);
            if (group) {
              const option = group.options.find(o => o.id === optionId);
              if (option) {
                modifiersSum += option.priceModifier;
              }
            }
          });
        }
        
        const expectedTotal = (cartItem.product.price + modifiersSum) * cartItem.quantity;
        const actualTotal = testComponent.calculateItemTotal(cartItem);
        
        expect(actualTotal).toBe(expectedTotal);

        testFixture.destroy();
      }),
      { numRuns: 100 }
    );
  });
});

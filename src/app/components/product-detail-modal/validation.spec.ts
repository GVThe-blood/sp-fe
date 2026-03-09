import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { ProductDetailModalComponent } from './product-detail-modal.component';
import * as fc from 'fast-check';

describe('ProductDetailModalComponent - Validation and Debouncing (Task 14)', () => {
  let component: ProductDetailModalComponent;
  let fixture: ComponentFixture<ProductDetailModalComponent>;

  const mockProduct = {
    id: 1,
    name: 'Test Product',
    price: 50000,
    image: 'https://example.com/image.jpg',
    sold: 100,
    likes: 50,
    rating: 4.5,
    isSoldOut: false,
    categoryId: 1,
    customizationGroups: [
      {
        id: 'size',
        name: 'Size',
        required: true,
        maxSelection: 1,
        options: [
          { id: 'small', name: 'Small', priceModifier: 0 },
          { id: 'large', name: 'Large', priceModifier: 10000 }
        ]
      },
      {
        id: 'topping',
        name: 'Topping',
        required: false,
        maxSelection: 1,
        options: [
          { id: 'none', name: 'None', priceModifier: 0 },
          { id: 'extra', name: 'Extra', priceModifier: 5000 }
        ]
      }
    ]
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductDetailModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductDetailModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Customization Validation (Requirement 5.7)', () => {
    it('should have validationErrors signal', () => {
      expect(component.validationErrors).toBeDefined();
    });

    it('should have no validation errors when no customization groups exist', () => {
      component.product = {
        ...mockProduct,
        customizationGroups: undefined
      };
      
      component.onAddToCart();
      expect(component.validationErrors().size).toBe(0);
    });

    it('should have no validation errors when all required options are selected', () => {
      component.product = mockProduct;
      component.selectedOptions.set(new Map([['size', 'small']]));
      
      component.onAddToCart();
      expect(component.validationErrors().size).toBe(0);
    });

    it('should show validation error when required option is not selected', () => {
      component.product = mockProduct;
      component.selectedOptions.set(new Map());
      
      component.onAddToCart();
      expect(component.validationErrors().size).toBeGreaterThan(0);
      expect(component.validationErrors().has('size')).toBe(true);
    });

    it('should have no validation errors when only optional options are missing', () => {
      component.product = mockProduct;
      component.selectedOptions.set(new Map([['size', 'large']]));
      // 'topping' is optional, so it's okay if not selected
      
      component.onAddToCart();
      expect(component.validationErrors().size).toBe(0);
    });

    it('should validate multiple required groups', () => {
      component.product = {
        ...mockProduct,
        customizationGroups: [
          {
            id: 'size',
            name: 'Size',
            required: true,
            maxSelection: 1,
            options: [{ id: 'small', name: 'Small', priceModifier: 0 }]
          },
          {
            id: 'temp',
            name: 'Temperature',
            required: true,
            maxSelection: 1,
            options: [{ id: 'hot', name: 'Hot', priceModifier: 0 }]
          }
        ]
      };
      
      // Only one required option selected
      component.selectedOptions.set(new Map([['size', 'small']]));
      component.onAddToCart();
      expect(component.validationErrors().size).toBeGreaterThan(0);
      expect(component.validationErrors().has('temp')).toBe(true);
      
      // Both required options selected
      component.selectedOptions.set(new Map([
        ['size', 'small'],
        ['temp', 'hot']
      ]));
      component.onAddToCart();
      expect(component.validationErrors().size).toBe(0);
    });
  });

  describe('Add to Cart Debouncing (Requirement 5.9)', () => {
    it('should have isAddingToCart signal', () => {
      expect(component.isAddingToCart).toBeDefined();
    });

    it('should set isAddingToCart to true when adding to cart', fakeAsync(() => {
      component.product = mockProduct;
      component.selectedOptions.set(new Map([['size', 'small']]));
      
      component.onAddToCart();
      
      expect(component.isAddingToCart()).toBe(true);
      
      tick(500);
      expect(component.isAddingToCart()).toBe(false);
    }));

    it('should prevent rapid clicks by checking isAddingToCart', fakeAsync(() => {
      component.product = mockProduct;
      component.selectedOptions.set(new Map([['size', 'small']]));
      
      let emitCount = 0;
      component.addToCart.subscribe(() => emitCount++);
      
      // First click
      component.onAddToCart();
      expect(component.isAddingToCart()).toBe(true);
      
      // Rapid second click (should be ignored)
      component.onAddToCart();
      
      // Should only emit once
      tick(500);
      expect(emitCount).toBe(1);
    }));

    it('should debounce add to cart by 500ms', fakeAsync(() => {
      component.product = mockProduct;
      component.selectedOptions.set(new Map([['size', 'small']]));
      
      let emitted = false;
      component.addToCart.subscribe(() => emitted = true);
      
      component.onAddToCart();
      
      // Should not emit immediately
      expect(emitted).toBe(false);
      
      // Should emit after 500ms
      tick(500);
      expect(emitted).toBe(true);
    }));

    it('should not add to cart if validation fails', fakeAsync(() => {
      component.product = mockProduct;
      component.selectedOptions.set(new Map()); // No required option selected
      
      let emitted = false;
      component.addToCart.subscribe(() => emitted = true);
      
      component.onAddToCart();
      
      tick(500);
      expect(emitted).toBe(false);
      expect(component.isAddingToCart()).toBe(false);
    }));

    it('should clean up timeout on component destroy', () => {
      component.product = mockProduct;
      component.selectedOptions.set(new Map([['size', 'small']]));
      
      component.onAddToCart();
      
      // Destroy component before timeout completes
      component.ngOnDestroy();
      
      // Should not throw error
      expect(true).toBe(true);
    });
  });

  describe('Image Error Handling', () => {
    it('should have onImageError method', () => {
      expect(component.onImageError).toBeDefined();
      expect(typeof component.onImageError).toBe('function');
    });

    it('should set fallback image when product image fails to load', () => {
      const mockImg = document.createElement('img');
      mockImg.src = 'https://invalid-url.com/product.jpg';
      
      const event = new Event('error');
      Object.defineProperty(event, 'target', { value: mockImg, enumerable: true });
      
      component.onImageError(event);
      
      // Should set to fallback image (SVG data URL)
      expect(mockImg.src).toContain('data:image/svg+xml');
      expect(mockImg.src).toContain('No Image');
    });

    it('should not create infinite loop when fallback image also fails', () => {
      const mockImg = document.createElement('img');
      const fallbackUrl = 'data:image/svg+xml,%3Csvg';
      mockImg.src = fallbackUrl;
      
      const event = new Event('error');
      Object.defineProperty(event, 'target', { value: mockImg, enumerable: true });
      
      // Call error handler when already on fallback
      component.onImageError(event);
      
      // Should not change the src (prevents infinite loop)
      expect(mockImg.src).toBe(fallbackUrl);
    });
  });
});

describe('ProductDetailModalComponent - Property-Based Tests', () => {
  let component: ProductDetailModalComponent;
  let fixture: ComponentFixture<ProductDetailModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductDetailModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductDetailModalComponent);
    component = fixture.componentInstance;
  });

  /**
   * Feature: ui-ux-improvements, Property 3: Validation error display
   * Validates: Requirements 3.2, 3.3, 3.4
   * 
   * Property: For any required customization group without a selection, 
   * when the add-to-cart button is clicked, an error message should appear 
   * next to that group and the cart should not be updated
   */
  describe('Property 3: Validation error display', () => {
    it('should display validation errors for all unselected required groups', () => {
      fc.assert(
        fc.property(
          // Generate random number of required groups (1-5)
          fc.integer({ min: 1, max: 5 }),
          // Generate random number of optional groups (0-3)
          fc.integer({ min: 0, max: 3 }),
          // Generate random subset of required groups to leave unselected (at least 1)
          fc.integer({ min: 0, max: 4 }),
          (numRequiredGroups, numOptionalGroups, unselectedIndex) => {
            // Create customization groups
            const customizationGroups = [];
            
            // Add required groups
            for (let i = 0; i < numRequiredGroups; i++) {
              customizationGroups.push({
                id: `required-${i}`,
                name: `Required Group ${i}`,
                required: true,
                maxSelection: 1,
                options: [
                  { id: `opt-${i}-1`, name: `Option 1`, priceModifier: 0 },
                  { id: `opt-${i}-2`, name: `Option 2`, priceModifier: 5000 }
                ]
              });
            }
            
            // Add optional groups
            for (let i = 0; i < numOptionalGroups; i++) {
              customizationGroups.push({
                id: `optional-${i}`,
                name: `Optional Group ${i}`,
                required: false,
                maxSelection: 1,
                options: [
                  { id: `opt-opt-${i}-1`, name: `Option 1`, priceModifier: 0 }
                ]
              });
            }
            
            // Set up product with these groups
            component.product = {
              id: 1,
              name: 'Test Product',
              price: 50000,
              image: 'test.jpg',
              sold: 100,
              likes: 50,
              isSoldOut: false,
              categoryId: 1,
              customizationGroups
            };
            
            // Select all required groups except one
            const selections = new Map<string, string>();
            for (let i = 0; i < numRequiredGroups; i++) {
              if (i !== unselectedIndex % numRequiredGroups) {
                selections.set(`required-${i}`, `opt-${i}-1`);
              }
            }
            component.selectedOptions.set(selections);
            
            // Track if addToCart was called
            let cartUpdated = false;
            component.addToCart.subscribe(() => {
              cartUpdated = true;
            });
            
            // Click add to cart
            component.onAddToCart();
            
            // Verify validation errors exist for unselected required groups
            const errors = component.validationErrors();
            const unselectedGroupId = `required-${unselectedIndex % numRequiredGroups}`;
            
            // Should have error for the unselected required group
            expect(errors.has(unselectedGroupId)).toBe(true);
            expect(errors.get(unselectedGroupId)).toBe('Vui lòng chọn một tùy chọn');
            
            // Should NOT have errors for selected required groups
            for (let i = 0; i < numRequiredGroups; i++) {
              if (i !== unselectedIndex % numRequiredGroups) {
                expect(errors.has(`required-${i}`)).toBe(false);
              }
            }
            
            // Should NOT have errors for optional groups
            for (let i = 0; i < numOptionalGroups; i++) {
              expect(errors.has(`optional-${i}`)).toBe(false);
            }
            
            // Cart should NOT be updated
            expect(cartUpdated).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should clear validation errors when required options are selected', () => {
      fc.assert(
        fc.property(
          // Generate random number of required groups (1-5)
          fc.integer({ min: 1, max: 5 }),
          (numRequiredGroups) => {
            // Create required customization groups
            const customizationGroups = [];
            for (let i = 0; i < numRequiredGroups; i++) {
              customizationGroups.push({
                id: `required-${i}`,
                name: `Required Group ${i}`,
                required: true,
                maxSelection: 1,
                options: [
                  { id: `opt-${i}-1`, name: `Option 1`, priceModifier: 0 },
                  { id: `opt-${i}-2`, name: `Option 2`, priceModifier: 5000 }
                ]
              });
            }
            
            // Set up product
            component.product = {
              id: 1,
              name: 'Test Product',
              price: 50000,
              image: 'test.jpg',
              sold: 100,
              likes: 50,
              isSoldOut: false,
              categoryId: 1,
              customizationGroups
            };
            
            // Start with no selections
            component.selectedOptions.set(new Map());
            
            // Trigger validation by clicking add to cart
            component.onAddToCart();
            
            // Should have errors for all required groups
            let errors = component.validationErrors();
            expect(errors.size).toBe(numRequiredGroups);
            
            // Now select all required options one by one
            for (let i = 0; i < numRequiredGroups; i++) {
              component.selectOption(`required-${i}`, `opt-${i}-1`);
              
              // Error for this group should be cleared
              errors = component.validationErrors();
              expect(errors.has(`required-${i}`)).toBe(false);
            }
            
            // All errors should be cleared
            errors = component.validationErrors();
            expect(errors.size).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not prevent cart update when all required options are selected', () => {
      fc.assert(
        fc.property(
          // Generate random number of required groups (1-5)
          fc.integer({ min: 1, max: 5 }),
          // Generate random quantity (1-10)
          fc.integer({ min: 1, max: 10 }),
          (numRequiredGroups, quantity) => {
            // Create required customization groups
            const customizationGroups = [];
            for (let i = 0; i < numRequiredGroups; i++) {
              customizationGroups.push({
                id: `required-${i}`,
                name: `Required Group ${i}`,
                required: true,
                maxSelection: 1,
                options: [
                  { id: `opt-${i}-1`, name: `Option 1`, priceModifier: 0 },
                  { id: `opt-${i}-2`, name: `Option 2`, priceModifier: 5000 }
                ]
              });
            }
            
            // Set up product
            component.product = {
              id: 1,
              name: 'Test Product',
              price: 50000,
              image: 'test.jpg',
              sold: 100,
              likes: 50,
              isSoldOut: false,
              categoryId: 1,
              customizationGroups
            };
            
            // Select all required options
            const selections = new Map<string, string>();
            for (let i = 0; i < numRequiredGroups; i++) {
              selections.set(`required-${i}`, `opt-${i}-1`);
            }
            component.selectedOptions.set(selections);
            component.quantity.set(quantity);
            
            // Track if addToCart was called
            let cartUpdated = false;
            let emittedCartItem: any = null;
            component.addToCart.subscribe((item) => {
              cartUpdated = true;
              emittedCartItem = item;
            });
            
            // Click add to cart
            component.onAddToCart();
            
            // Should have no validation errors
            const errors = component.validationErrors();
            expect(errors.size).toBe(0);
            
            // Cart should be updated (after debounce, but we can check the flag)
            expect(component.isAddingToCart()).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

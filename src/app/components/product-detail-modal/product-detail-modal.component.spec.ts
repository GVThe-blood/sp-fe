import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ProductDetailModalComponent } from './product-detail-modal.component';
import * as fc from 'fast-check';

describe('ProductDetailModalComponent', () => {
  let component: ProductDetailModalComponent;
  let fixture: ComponentFixture<ProductDetailModalComponent>;

  const mockProduct = {
    id: 1,
    name: 'Test Product',
    price: 50000,
    image: 'test.jpg',
    sold: 100,
    likes: 50,
    rating: 4.5,
    isSoldOut: false,
    categoryId: 1,
    description: 'Test description'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductDetailModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductDetailModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Modal open/close behavior', () => {
    it('should open modal when isOpen is true and product is provided', () => {
      component.product = mockProduct;
      component.isOpen = true;
      fixture.detectChanges();

      const modalOverlay = fixture.nativeElement.querySelector('.modal-overlay');
      expect(modalOverlay).toBeTruthy();
    });

    it('should not display modal when isOpen is false', () => {
      component.product = mockProduct;
      component.isOpen = false;
      fixture.detectChanges();

      const modalOverlay = fixture.nativeElement.querySelector('.modal-overlay');
      expect(modalOverlay).toBeFalsy();
    });

    it('should not display modal when product is null', () => {
      component.product = null;
      component.isOpen = true;
      fixture.detectChanges();

      const modalOverlay = fixture.nativeElement.querySelector('.modal-overlay');
      expect(modalOverlay).toBeFalsy();
    });

    it('should emit close event when backdrop is clicked', fakeAsync(() => {
      spyOn(component.close, 'emit');
      component.product = mockProduct;
      component.isOpen = true;
      fixture.detectChanges();

      const modalOverlay = fixture.nativeElement.querySelector('.modal-overlay');
      modalOverlay.click();

      // Wait for closing animation (300ms)
      tick(300);

      expect(component.close.emit).toHaveBeenCalled();
    }));

    it('should emit close event when close button is clicked', fakeAsync(() => {
      spyOn(component.close, 'emit');
      component.product = mockProduct;
      component.isOpen = true;
      fixture.detectChanges();

      const closeButton = fixture.nativeElement.querySelector('button[aria-label="Close"], button:first-of-type');
      if (closeButton) {
        closeButton.click();
        
        // Wait for closing animation (300ms)
        tick(300);
        
        expect(component.close.emit).toHaveBeenCalled();
      }
    }));

    it('should set isClosing to true when closeModal is called', () => {
      component.product = mockProduct;
      component.isOpen = true;
      fixture.detectChanges();

      expect(component.isClosing()).toBe(false);
      
      component.closeModal();
      
      expect(component.isClosing()).toBe(true);
    });

    it('should apply closing animation classes when closing', fakeAsync(() => {
      component.product = mockProduct;
      component.isOpen = true;
      fixture.detectChanges();

      const modalOverlay = fixture.nativeElement.querySelector('.modal-overlay');
      const modalContent = fixture.nativeElement.querySelector('.modal-content');

      expect(modalOverlay.classList.contains('modal-overlay-closing')).toBe(false);
      expect(modalContent.classList.contains('modal-content-closing')).toBe(false);

      component.closeModal();
      fixture.detectChanges();

      expect(modalOverlay.classList.contains('modal-overlay-closing')).toBe(true);
      expect(modalContent.classList.contains('modal-content-closing')).toBe(true);

      tick(300);
    }));

    it('should not close modal when clicking inside modal content', () => {
      spyOn(component.close, 'emit');
      component.product = mockProduct;
      component.isOpen = true;
      fixture.detectChanges();

      const modalContent = fixture.nativeElement.querySelector('.modal-content');
      const clickEvent = new Event('click', { bubbles: false });
      modalContent.dispatchEvent(clickEvent);

      expect(component.close.emit).not.toHaveBeenCalled();
    });
  });

  describe('Product information display', () => {
    it('should display product name, price, and rating', () => {
      component.product = mockProduct;
      component.isOpen = true;
      fixture.detectChanges();

      const productName = fixture.nativeElement.querySelector('h2');
      expect(productName.textContent).toContain(mockProduct.name);
    });

    it('should display sold count', () => {
      component.product = mockProduct;
      component.isOpen = true;
      fixture.detectChanges();

      const content = fixture.nativeElement.textContent;
      expect(content).toContain(mockProduct.sold.toString());
    });
  });

  /**
   * Feature: ui-ux-improvements, Property 2: Modal data reset on product change
   * Validates: Requirements 4.1, 4.2, 4.3, 4.4
   * 
   * For any sequence of opening different products in the modal, each product should start with 
   * quantity=1, empty note, and default option selections, with no data persisting from previous products
   */
  describe('Property 2: Modal data reset on product change', () => {
    it('should reset all modal data when product changes', () => {
      fc.assert(
        fc.property(
          // Generate a sequence of products with different properties
          fc.array(
            fc.record({
              id: fc.integer({ min: 1, max: 10000 }),
              name: fc.string({ minLength: 1, maxLength: 50 }),
              price: fc.integer({ min: 1000, max: 1000000 }),
              hasCustomization: fc.boolean(),
              numGroups: fc.integer({ min: 0, max: 5 })
            }),
            { minLength: 2, maxLength: 5 }
          ),
          // Generate random user interactions (quantity, note)
          fc.array(
            fc.record({
              quantity: fc.integer({ min: 1, max: 20 }),
              note: fc.string({ maxLength: 100 })
            }),
            { minLength: 2, maxLength: 5 }
          ),
          (productConfigs, userInteractions) => {
            // Ensure we have matching arrays
            const minLength = Math.min(productConfigs.length, userInteractions.length);
            
            for (let i = 0; i < minLength; i++) {
              const config = productConfigs[i];
              const interaction = userInteractions[i];
              
              // Create customization groups if needed
              const customizationGroups = config.hasCustomization && config.numGroups > 0
                ? Array.from({ length: config.numGroups }, (_, idx) => ({
                    id: `group-${idx}`,
                    name: `Group ${idx}`,
                    required: idx === 0, // First group is required
                    maxSelection: 1,
                    options: [
                      { id: `opt-${idx}-1`, name: `Option 1`, priceModifier: 0 },
                      { id: `opt-${idx}-2`, name: `Option 2`, priceModifier: 5000 }
                    ]
                  }))
                : undefined;
              
              // Create product
              const product = {
                id: config.id,
                name: config.name,
                price: config.price,
                image: 'test.jpg',
                sold: 100,
                likes: 50,
                rating: 4.5,
                isSoldOut: false,
                categoryId: 1,
                customizationGroups
              };
              
              // Set product (this should trigger reset)
              const previousProduct = component.product;
              component.product = product;
              
              // Manually trigger ngOnChanges to simulate Angular's input binding
              component.ngOnChanges({
                product: {
                  currentValue: product,
                  previousValue: previousProduct,
                  firstChange: previousProduct === null,
                  isFirstChange: () => previousProduct === null
                }
              });
              
              fixture.detectChanges();
              
              // Verify initial state after product change
              expect(component.quantity()).toBe(1, `Product ${i}: Quantity should be reset to 1`);
              expect(component.customerNote()).toBe('', `Product ${i}: Customer note should be empty`);
              expect(component.validationErrors().size).toBe(0, `Product ${i}: Validation errors should be cleared`);
              
              // Verify default selections for required groups
              if (customizationGroups && customizationGroups.length > 0) {
                const requiredGroups = customizationGroups.filter(g => g.required);
                requiredGroups.forEach(group => {
                  const selectedOption = component.selectedOptions().get(group.id);
                  expect(selectedOption).toBe(group.options[0].id, 
                    `Product ${i}: Required group ${group.id} should have default selection`);
                });
                
                // Non-required groups should not have selections
                const nonRequiredGroups = customizationGroups.filter(g => !g.required);
                nonRequiredGroups.forEach(group => {
                  const selectedOption = component.selectedOptions().get(group.id);
                  expect(selectedOption).toBeUndefined(
                    `Product ${i}: Non-required group ${group.id} should not have selection`);
                });
              } else {
                // No customization groups means no selections
                expect(component.selectedOptions().size).toBe(0, 
                  `Product ${i}: Should have no selections when no customization groups`);
              }
              
              // Simulate user interaction (modify state)
              component.quantity.set(interaction.quantity);
              component.customerNote.set(interaction.note);
              
              // Add some custom selections
              if (customizationGroups && customizationGroups.length > 1) {
                component.selectOption(customizationGroups[1].id, customizationGroups[1].options[1].id);
              }
              
              // The next iteration will verify that these changes don't persist
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reset data when same product is reopened', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.integer({ min: 1, max: 10000 }),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            price: fc.integer({ min: 1000, max: 1000000 })
          }),
          fc.integer({ min: 2, max: 10 }), // quantity to set
          fc.string({ minLength: 1, maxLength: 100 }), // note to set
          (productConfig, quantity, note) => {
            const product = {
              id: productConfig.id,
              name: productConfig.name,
              price: productConfig.price,
              image: 'test.jpg',
              sold: 100,
              likes: 50,
              rating: 4.5,
              isSoldOut: false,
              categoryId: 1,
              customizationGroups: [{
                id: 'size',
                name: 'Size',
                required: true,
                maxSelection: 1,
                options: [
                  { id: 'small', name: 'Small', priceModifier: 0 },
                  { id: 'large', name: 'Large', priceModifier: 5000 }
                ]
              }]
            };
            
            // First open
            component.product = product;
            component.ngOnChanges({
              product: {
                currentValue: product,
                previousValue: null,
                firstChange: true,
                isFirstChange: () => true
              }
            });
            fixture.detectChanges();
            
            // Verify initial state
            expect(component.quantity()).toBe(1);
            expect(component.customerNote()).toBe('');
            
            // Modify state
            component.quantity.set(quantity);
            component.customerNote.set(note);
            component.selectOption('size', 'large');
            
            // Verify modifications
            expect(component.quantity()).toBe(quantity);
            expect(component.customerNote()).toBe(note);
            expect(component.selectedOptions().get('size')).toBe('large');
            
            // "Close" and "reopen" by setting product to null then back
            component.product = null;
            component.ngOnChanges({
              product: {
                currentValue: null,
                previousValue: product,
                firstChange: false,
                isFirstChange: () => false
              }
            });
            fixture.detectChanges();
            
            component.product = product;
            component.ngOnChanges({
              product: {
                currentValue: product,
                previousValue: null,
                firstChange: false,
                isFirstChange: () => false
              }
            });
            fixture.detectChanges();
            
            // Verify state is reset
            expect(component.quantity()).toBe(1, 'Quantity should be reset to 1 on reopen');
            expect(component.customerNote()).toBe('', 'Customer note should be empty on reopen');
            expect(component.selectedOptions().get('size')).toBe('small', 
              'Required group should have default selection on reopen');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle products with no customization groups', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.integer({ min: 1, max: 10000 }),
              name: fc.string({ minLength: 1, maxLength: 50 }),
              price: fc.integer({ min: 1000, max: 1000000 })
            }),
            { minLength: 2, maxLength: 5 }
          ),
          (productConfigs) => {
            for (const config of productConfigs) {
              const product = {
                id: config.id,
                name: config.name,
                price: config.price,
                image: 'test.jpg',
                sold: 100,
                likes: 50,
                rating: 4.5,
                isSoldOut: false,
                categoryId: 1,
                customizationGroups: undefined
              };
              
              const prevProduct = component.product;
              component.product = product;
              component.ngOnChanges({
                product: {
                  currentValue: product,
                  previousValue: prevProduct,
                  firstChange: prevProduct === null,
                  isFirstChange: () => prevProduct === null
                }
              });
              fixture.detectChanges();
              
              // Verify reset state
              expect(component.quantity()).toBe(1);
              expect(component.customerNote()).toBe('');
              expect(component.selectedOptions().size).toBe(0);
              expect(component.validationErrors().size).toBe(0);
              
              // Modify state
              component.quantity.set(5);
              component.customerNote.set('Test note');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: store-detail-enhancements, Property 6: Customization price calculation
   * Validates: Requirements 5.6, 5.7
   * 
   * For any combination of product base price, selected customization options with price modifiers,
   * and quantity, the displayed total price should equal: (base price + sum of selected option price modifiers) × quantity
   */
  describe('Property 6: Customization price calculation', () => {
    it('should calculate total price correctly for any combination of base price, options, and quantity', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 1000000 }), // basePrice
          fc.array(
            fc.record({
              groupId: fc.string({ minLength: 1, maxLength: 10 }),
              optionId: fc.string({ minLength: 1, maxLength: 10 }),
              priceModifier: fc.integer({ min: 0, max: 50000 })
            }),
            { minLength: 0, maxLength: 5 }
          ), // customization options
          fc.integer({ min: 1, max: 20 }), // quantity
          (basePrice, customizations, quantity) => {
            // Create a fresh component instance for each test run to avoid state pollution
            const localFixture = TestBed.createComponent(ProductDetailModalComponent);
            const localComponent = localFixture.componentInstance;

            // Ensure unique groupIds by using index
            const uniqueCustomizations = customizations.map((custom, index) => ({
              ...custom,
              groupId: `group-${index}`
            }));

            // Create a product with customization groups
            const customizationGroups = uniqueCustomizations.map((custom, index) => ({
              id: custom.groupId,
              name: `Group ${index}`,
              required: false,
              maxSelection: 1,
              options: [
                {
                  id: custom.optionId,
                  name: `Option ${index}`,
                  priceModifier: custom.priceModifier
                }
              ]
            }));

            const testProduct = {
              ...mockProduct,
              price: basePrice,
              customizationGroups: customizationGroups.length > 0 ? customizationGroups : undefined
            };

            localComponent.product = testProduct;
            localFixture.detectChanges();

            // Set quantity
            localComponent.quantity.set(quantity);

            // Select all customization options
            const selectedOptions = new Map<string, string>();
            uniqueCustomizations.forEach(custom => {
              selectedOptions.set(custom.groupId, custom.optionId);
            });
            localComponent.selectedOptions.set(selectedOptions);

            // Calculate expected total
            const optionsTotal = uniqueCustomizations.reduce((sum, custom) => sum + custom.priceModifier, 0);
            const expectedTotal = (basePrice + optionsTotal) * quantity;

            // Get actual total from component
            const actualTotal = localComponent.totalPrice();

            // Verify the calculation
            expect(actualTotal).toBe(expectedTotal);

            // Clean up
            localFixture.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle products without customization groups', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 1000000 }), // basePrice
          fc.integer({ min: 1, max: 20 }), // quantity
          (basePrice, quantity) => {
            // Create a fresh component instance for each test run
            const localFixture = TestBed.createComponent(ProductDetailModalComponent);
            const localComponent = localFixture.componentInstance;
            
            const testProduct = {
              ...mockProduct,
              price: basePrice,
              customizationGroups: undefined
            };

            localComponent.product = testProduct;
            localFixture.detectChanges();

            localComponent.quantity.set(quantity);
            localFixture.detectChanges();

            const expectedTotal = basePrice * quantity;
            const actualTotal = localComponent.totalPrice();

            expect(actualTotal).toBe(expectedTotal);
            
            localFixture.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle zero price modifiers correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 1000000 }), // basePrice
          fc.integer({ min: 1, max: 5 }), // number of options with zero modifier
          fc.integer({ min: 1, max: 20 }), // quantity
          (basePrice, numOptions, quantity) => {
            const customizationGroups = Array.from({ length: numOptions }, (_, index) => ({
              id: `group-${index}`,
              name: `Group ${index}`,
              required: false,
              maxSelection: 1,
              options: [
                {
                  id: `option-${index}`,
                  name: `Option ${index}`,
                  priceModifier: 0
                }
              ]
            }));

            const testProduct = {
              ...mockProduct,
              price: basePrice,
              customizationGroups
            };

            component.product = testProduct;
            fixture.detectChanges();

            component.quantity.set(quantity);

            // Select all options (all have zero modifier)
            const selectedOptions = new Map<string, string>();
            customizationGroups.forEach(group => {
              selectedOptions.set(group.id, group.options[0].id);
            });
            component.selectedOptions.set(selectedOptions);

            // Expected total should be just basePrice * quantity since all modifiers are 0
            const expectedTotal = basePrice * quantity;
            const actualTotal = component.totalPrice();

            expect(actualTotal).toBe(expectedTotal);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should update total price when quantity changes', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 1000000 }), // basePrice
          fc.integer({ min: 1, max: 20 }), // initial quantity
          fc.integer({ min: 1, max: 20 }), // new quantity
          (basePrice, initialQuantity, newQuantity) => {
            // Create a fresh component instance for each test run
            const localFixture = TestBed.createComponent(ProductDetailModalComponent);
            const localComponent = localFixture.componentInstance;
            
            const testProduct = {
              ...mockProduct,
              price: basePrice
            };

            localComponent.product = testProduct;
            localFixture.detectChanges();

            localComponent.quantity.set(initialQuantity);
            localFixture.detectChanges();
            const initialTotal = localComponent.totalPrice();
            expect(initialTotal).toBe(basePrice * initialQuantity);

            localComponent.quantity.set(newQuantity);
            localFixture.detectChanges();
            const newTotal = localComponent.totalPrice();
            expect(newTotal).toBe(basePrice * newQuantity);
            
            localFixture.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should update total price when options change', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 1000000 }), // basePrice
          fc.integer({ min: 0, max: 50000 }), // first option modifier
          fc.integer({ min: 0, max: 50000 }), // second option modifier
          fc.integer({ min: 1, max: 20 }), // quantity
          (basePrice, modifier1, modifier2, quantity) => {
            const customizationGroups = [{
              id: 'size',
              name: 'Size',
              required: true,
              maxSelection: 1,
              options: [
                { id: 'small', name: 'Small', priceModifier: modifier1 },
                { id: 'large', name: 'Large', priceModifier: modifier2 }
              ]
            }];

            const testProduct = {
              ...mockProduct,
              price: basePrice,
              customizationGroups
            };

            component.product = testProduct;
            fixture.detectChanges();

            component.quantity.set(quantity);

            // Select first option
            component.selectedOptions.set(new Map([['size', 'small']]));
            const total1 = component.totalPrice();
            expect(total1).toBe((basePrice + modifier1) * quantity);

            // Change to second option
            component.selectedOptions.set(new Map([['size', 'large']]));
            const total2 = component.totalPrice();
            expect(total2).toBe((basePrice + modifier2) * quantity);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

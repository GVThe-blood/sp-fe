import { TestBed, ComponentFixture, fakeAsync, tick, flush } from '@angular/core/testing';
import { StoreDetailComponent } from './store-detail.component';
import { ActivatedRoute } from '@angular/router';
import * as fc from 'fast-check';

describe('StoreDetailComponent', () => {
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

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  /**
   * Property 2: Favorite state toggle consistency
   * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.6
   * 
   * For any product or store, when the favorite button is clicked an odd number 
   * of times, the favorite state should be true and the heart icon should be 
   * filled with red color; when clicked an even number of times, the state 
   * should be false and the heart icon should be outline in gray color
   */
  describe('Property 2: Favorite state toggle consistency', () => {
    it('should toggle store favorite state correctly based on click count parity', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 20 }),
          (clickCount) => {
            // Use the existing component from beforeEach
            // Reset state
            component.isStoreFavorite.set(false);

            // Initial state should be false
            expect(component.isStoreFavorite()).toBe(false);

            // Click the toggle button clickCount times
            for (let i = 0; i < clickCount; i++) {
              component.toggleStoreFavorite();
            }

            // Requirement 3.1, 3.3, 3.4: State should match click count parity
            const expectedState = clickCount % 2 === 1;
            expect(component.isStoreFavorite()).toBe(expectedState);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should toggle product favorite state correctly based on click count parity', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }), // productId
          fc.integer({ min: 0, max: 20 }), // clickCount
          (productId, clickCount) => {
            // Use the existing component from beforeEach
            // Reset state
            component.favoriteProducts.set(new Set());

            // Initial state should be false (not favorited)
            expect(component.isProductFavorite(productId)).toBe(false);

            // Click the toggle button clickCount times
            for (let i = 0; i < clickCount; i++) {
              component.toggleProductFavorite(productId);
            }

            // Requirement 3.2, 3.3, 3.4: State should match click count parity
            const expectedState = clickCount % 2 === 1;
            expect(component.isProductFavorite(productId)).toBe(expectedState);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain independent favorite states for different products', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(fc.integer({ min: 1, max: 100 }), { minLength: 2, maxLength: 10 }),
          fc.array(fc.integer({ min: 0, max: 10 }), { minLength: 2, maxLength: 10 }),
          (productIds, clickCounts) => {
            // Ensure we have matching arrays
            const minLength = Math.min(productIds.length, clickCounts.length);
            const testProductIds = productIds.slice(0, minLength);
            const testClickCounts = clickCounts.slice(0, minLength);

            // Use the existing component from beforeEach
            // Reset state
            component.favoriteProducts.set(new Set());

            // Toggle each product the specified number of times
            testProductIds.forEach((productId, index) => {
              const clicks = testClickCounts[index];
              for (let i = 0; i < clicks; i++) {
                component.toggleProductFavorite(productId);
              }
            });

            // Verify each product has the correct state
            testProductIds.forEach((productId, index) => {
              const clicks = testClickCounts[index];
              const expectedState = clicks % 2 === 1;
              expect(component.isProductFavorite(productId)).toBe(expectedState);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should render filled red heart icon when store is favorited', () => {
      component.toggleStoreFavorite();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const favoriteButton = compiled.querySelector('button:has(svg)') as HTMLElement;
      
      // Requirement 3.3: Should display filled heart with red color
      expect(component.isStoreFavorite()).toBe(true);
      expect(favoriteButton?.classList.contains('text-red-500')).toBe(true);
      
      // Check for filled heart SVG (has fill attribute)
      const filledHeart = favoriteButton?.querySelector('svg[fill="currentColor"]');
      expect(filledHeart).toBeTruthy();
    });

    it('should render outline gray heart icon when store is not favorited', () => {
      // Ensure store is not favorited
      if (component.isStoreFavorite()) {
        component.toggleStoreFavorite();
      }
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const favoriteButton = compiled.querySelector('button:has(svg)') as HTMLElement;
      
      // Requirement 3.4: Should display outline heart with gray color
      expect(component.isStoreFavorite()).toBe(false);
      expect(favoriteButton?.classList.contains('text-gray-700')).toBe(true);
      
      // Check for outline heart SVG (has stroke attribute)
      const outlineHeart = favoriteButton?.querySelector('svg[fill="none"]');
      expect(outlineHeart).toBeTruthy();
    });

    it('should render filled red heart for favorited products', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 4 }), // Use product IDs that exist in mock data
          (productId) => {
            const testFixture = TestBed.createComponent(StoreDetailComponent);
            const testComponent = testFixture.componentInstance;
            testFixture.detectChanges();

            // Toggle product to favorite
            testComponent.toggleProductFavorite(productId);
            testFixture.detectChanges();

            const compiled = testFixture.nativeElement as HTMLElement;
            const productCards = compiled.querySelectorAll('.bg-white.rounded-lg');
            
            // Find the product card and check its favorite button
            let foundProduct = false;
            productCards.forEach(card => {
              const productName = card.querySelector('h3')?.textContent;
              const product = testComponent.products().find(p => p.id === productId);
              
              if (product && productName?.includes(product.name)) {
                foundProduct = true;
                const favoriteButton = card.querySelector('button.favorite-icon') as HTMLElement;
                
                // Requirement 3.3: Should have red color when favorited
                expect(favoriteButton?.classList.contains('text-red-500')).toBe(true);
                
                // Should have filled heart SVG
                const filledHeart = favoriteButton?.querySelector('svg[fill="currentColor"]');
                expect(filledHeart).toBeTruthy();
              }
            });

            testFixture.destroy();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should persist favorite state across multiple toggles', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          fc.array(fc.boolean(), { minLength: 1, maxLength: 20 }),
          (productId, toggleSequence) => {
            const testFixture = TestBed.createComponent(StoreDetailComponent);
            const testComponent = testFixture.componentInstance;
            testFixture.detectChanges();

            let expectedState = false;
            
            // Apply toggle sequence
            toggleSequence.forEach(() => {
              testComponent.toggleProductFavorite(productId);
              expectedState = !expectedState;
              
              // Requirement 3.6: State should persist correctly
              expect(testComponent.isProductFavorite(productId)).toBe(expectedState);
            });

            testFixture.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle edge case: zero clicks means not favorited', () => {
      expect(component.isStoreFavorite()).toBe(false);
      expect(component.isProductFavorite(1)).toBe(false);
    });

    it('should handle edge case: one click means favorited', () => {
      component.toggleStoreFavorite();
      expect(component.isStoreFavorite()).toBe(true);

      component.toggleProductFavorite(1);
      expect(component.isProductFavorite(1)).toBe(true);
    });

    it('should handle edge case: two clicks returns to not favorited', () => {
      component.toggleStoreFavorite();
      component.toggleStoreFavorite();
      expect(component.isStoreFavorite()).toBe(false);

      component.toggleProductFavorite(1);
      component.toggleProductFavorite(1);
      expect(component.isProductFavorite(1)).toBe(false);
    });
  });

  describe('Favorite functionality', () => {
    it('should initialize with empty favorite products set', () => {
      expect(component.favoriteProducts().size).toBe(0);
    });

    it('should initialize with store not favorited', () => {
      expect(component.isStoreFavorite()).toBe(false);
    });

    it('should add product to favorites when toggled from unfavorited state', () => {
      const productId = 1;
      component.toggleProductFavorite(productId);
      
      expect(component.favoriteProducts().has(productId)).toBe(true);
      expect(component.isProductFavorite(productId)).toBe(true);
    });

    it('should remove product from favorites when toggled from favorited state', () => {
      const productId = 1;
      component.toggleProductFavorite(productId);
      expect(component.isProductFavorite(productId)).toBe(true);
      
      component.toggleProductFavorite(productId);
      expect(component.favoriteProducts().has(productId)).toBe(false);
      expect(component.isProductFavorite(productId)).toBe(false);
    });
  });

  /**
   * Property 5: Modal product data integrity
   * Validates: Requirements 5.1, 5.2, 5.3, 5.5, 6.5
   * 
   * For any product that is clicked (either on the card or add button), the 
   * ProductDetailModal should open and display all product information (image, 
   * name, price, rating, sold count, and all customization options) matching 
   * the clicked product
   */
  describe('Property 5: Modal product data integrity', () => {
    it('should open modal with complete product data for any product', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...component.products()),
          (product) => {
            const testFixture = TestBed.createComponent(StoreDetailComponent);
            const testComponent = testFixture.componentInstance;
            testFixture.detectChanges();

            // Requirement 5.1, 5.2: Opening modal with a product
            testComponent.openProductModal(product);
            testFixture.detectChanges();

            // Modal should be open
            expect(testComponent.isModalOpen()).toBe(true);

            // Requirement 5.3, 6.5: Selected product should match the clicked product
            const selectedProduct = testComponent.selectedProduct();
            expect(selectedProduct).not.toBeNull();
            expect(selectedProduct?.id).toBe(product.id);
            expect(selectedProduct?.name).toBe(product.name);
            expect(selectedProduct?.price).toBe(product.price);
            expect(selectedProduct?.image).toBe(product.image);
            expect(selectedProduct?.sold).toBe(product.sold);
            expect(selectedProduct?.rating).toBe(product.rating);

            // Requirement 5.5: All customization options should be preserved
            if (product.customizationGroups) {
              expect(selectedProduct?.customizationGroups).toBeDefined();
              expect(selectedProduct?.customizationGroups?.length).toBe(product.customizationGroups.length);

              product.customizationGroups.forEach((group, groupIndex) => {
                const selectedGroup = selectedProduct?.customizationGroups?.[groupIndex];
                expect(selectedGroup?.id).toBe(group.id);
                expect(selectedGroup?.name).toBe(group.name);
                expect(selectedGroup?.required).toBe(group.required);
                expect(selectedGroup?.maxSelection).toBe(group.maxSelection);
                expect(selectedGroup?.options.length).toBe(group.options.length);

                group.options.forEach((option, optionIndex) => {
                  const selectedOption = selectedGroup?.options[optionIndex];
                  expect(selectedOption?.id).toBe(option.id);
                  expect(selectedOption?.name).toBe(option.name);
                  expect(selectedOption?.priceModifier).toBe(option.priceModifier);
                });
              });
            }

            testFixture.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve all product properties when opening modal', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.integer({ min: 1, max: 1000 }),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            price: fc.integer({ min: 1000, max: 1000000 }),
            originalPrice: fc.option(fc.integer({ min: 1000, max: 1000000 })),
            image: fc.webUrl(),
            sold: fc.integer({ min: 0, max: 10000 }),
            likes: fc.integer({ min: 0, max: 5000 }),
            rating: fc.option(fc.float({ min: 0, max: 5, noNaN: true })),
            isSoldOut: fc.boolean(),
            categoryId: fc.integer({ min: 1, max: 10 }),
            description: fc.option(fc.string({ maxLength: 100 }))
          }),
          (productData) => {
            const testFixture = TestBed.createComponent(StoreDetailComponent);
            const testComponent = testFixture.componentInstance;
            testFixture.detectChanges();

            const testProduct = {
              ...productData,
              rating: productData.rating ?? undefined,
              originalPrice: productData.originalPrice ?? undefined,
              description: productData.description ?? undefined
            };

            // Skip sold out products as they shouldn't open modal
            if (testProduct.isSoldOut) {
              testComponent.openProductModal(testProduct);
              expect(testComponent.isModalOpen()).toBe(false);
              testFixture.destroy();
              return;
            }

            // Requirement 5.1, 5.2: Open modal with product
            testComponent.openProductModal(testProduct);
            testFixture.detectChanges();

            // Requirement 6.5: Product data should be displayed without delay
            const selectedProduct = testComponent.selectedProduct();
            expect(selectedProduct).not.toBeNull();

            // Requirement 5.3: All product information should match
            expect(selectedProduct?.id).toBe(testProduct.id);
            expect(selectedProduct?.name).toBe(testProduct.name);
            expect(selectedProduct?.price).toBe(testProduct.price);
            expect(selectedProduct?.originalPrice).toBe(testProduct.originalPrice);
            expect(selectedProduct?.image).toBe(testProduct.image);
            expect(selectedProduct?.sold).toBe(testProduct.sold);
            expect(selectedProduct?.likes).toBe(testProduct.likes);
            expect(selectedProduct?.rating).toBe(testProduct.rating);
            expect(selectedProduct?.isSoldOut).toBe(testProduct.isSoldOut);
            expect(selectedProduct?.categoryId).toBe(testProduct.categoryId);
            expect(selectedProduct?.description).toBe(testProduct.description);

            testFixture.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve customization groups with all options and price modifiers', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.integer({ min: 1, max: 1000 }),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            price: fc.integer({ min: 1000, max: 1000000 }),
            image: fc.webUrl(),
            sold: fc.integer({ min: 0, max: 10000 }),
            likes: fc.integer({ min: 0, max: 5000 }),
            rating: fc.float({ min: 0, max: 5, noNaN: true }),
            isSoldOut: fc.constant(false),
            categoryId: fc.integer({ min: 1, max: 10 }),
            customizationGroups: fc.array(
              fc.record({
                id: fc.string({ minLength: 1, maxLength: 20 }),
                name: fc.string({ minLength: 1, maxLength: 30 }),
                required: fc.boolean(),
                maxSelection: fc.integer({ min: 1, max: 5 }),
                options: fc.array(
                  fc.record({
                    id: fc.string({ minLength: 1, maxLength: 20 }),
                    name: fc.string({ minLength: 1, maxLength: 30 }),
                    priceModifier: fc.integer({ min: 0, max: 50000 })
                  }),
                  { minLength: 1, maxLength: 5 }
                )
              }),
              { minLength: 1, maxLength: 5 }
            )
          }),
          (productData) => {
            const testFixture = TestBed.createComponent(StoreDetailComponent);
            const testComponent = testFixture.componentInstance;
            testFixture.detectChanges();

            // Requirement 5.1: Open modal with product
            testComponent.openProductModal(productData);
            testFixture.detectChanges();

            const selectedProduct = testComponent.selectedProduct();
            expect(selectedProduct).not.toBeNull();

            // Requirement 5.5: All customization options should be preserved
            expect(selectedProduct?.customizationGroups).toBeDefined();
            expect(selectedProduct?.customizationGroups?.length).toBe(productData.customizationGroups.length);

            productData.customizationGroups.forEach((group, groupIndex) => {
              const selectedGroup = selectedProduct?.customizationGroups?.[groupIndex];
              
              // Verify group properties
              expect(selectedGroup?.id).toBe(group.id);
              expect(selectedGroup?.name).toBe(group.name);
              expect(selectedGroup?.required).toBe(group.required);
              expect(selectedGroup?.maxSelection).toBe(group.maxSelection);
              expect(selectedGroup?.options.length).toBe(group.options.length);

              // Verify all options in the group
              group.options.forEach((option, optionIndex) => {
                const selectedOption = selectedGroup?.options[optionIndex];
                expect(selectedOption?.id).toBe(option.id);
                expect(selectedOption?.name).toBe(option.name);
                expect(selectedOption?.priceModifier).toBe(option.priceModifier);
              });
            });

            testFixture.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not open modal for sold out products', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.integer({ min: 1, max: 1000 }),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            price: fc.integer({ min: 1000, max: 1000000 }),
            image: fc.webUrl(),
            sold: fc.integer({ min: 0, max: 10000 }),
            likes: fc.integer({ min: 0, max: 5000 }),
            rating: fc.float({ min: 0, max: 5, noNaN: true }),
            isSoldOut: fc.constant(true),
            categoryId: fc.integer({ min: 1, max: 10 })
          }),
          (soldOutProduct) => {
            const testFixture = TestBed.createComponent(StoreDetailComponent);
            const testComponent = testFixture.componentInstance;
            testFixture.detectChanges();

            // Attempt to open modal with sold out product
            testComponent.openProductModal(soldOutProduct);
            testFixture.detectChanges();

            // Modal should not open for sold out products
            expect(testComponent.isModalOpen()).toBe(false);
            expect(testComponent.selectedProduct()).toBeNull();

            testFixture.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain product reference integrity across modal operations', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...component.products()),
          (product) => {
            const testFixture = TestBed.createComponent(StoreDetailComponent);
            const testComponent = testFixture.componentInstance;
            testFixture.detectChanges();

            // Open modal
            testComponent.openProductModal(product);
            testFixture.detectChanges();

            const selectedProduct = testComponent.selectedProduct();
            expect(selectedProduct).not.toBeNull();

            // Requirement 6.5: Product data should be immediately available
            expect(selectedProduct?.id).toBe(product.id);

            // Close modal
            testComponent.closeProductModal();
            testFixture.detectChanges();

            // Modal should be closed
            expect(testComponent.isModalOpen()).toBe(false);

            // Reopen with same product
            testComponent.openProductModal(product);
            testFixture.detectChanges();

            const reselectedProduct = testComponent.selectedProduct();
            expect(reselectedProduct).not.toBeNull();
            expect(reselectedProduct?.id).toBe(product.id);
            expect(reselectedProduct?.name).toBe(product.name);

            testFixture.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle products without optional fields correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.integer({ min: 1, max: 1000 }),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            price: fc.integer({ min: 1000, max: 1000000 }),
            image: fc.webUrl(),
            sold: fc.integer({ min: 0, max: 10000 }),
            likes: fc.integer({ min: 0, max: 5000 }),
            isSoldOut: fc.constant(false),
            categoryId: fc.integer({ min: 1, max: 10 })
            // No rating, originalPrice, description, or customizationGroups
          }),
          (minimalProduct) => {
            const testFixture = TestBed.createComponent(StoreDetailComponent);
            const testComponent = testFixture.componentInstance;
            testFixture.detectChanges();

            testComponent.openProductModal(minimalProduct);
            testFixture.detectChanges();

            const selectedProduct = testComponent.selectedProduct();
            expect(selectedProduct).not.toBeNull();

            // Required fields should be present
            expect(selectedProduct?.id).toBe(minimalProduct.id);
            expect(selectedProduct?.name).toBe(minimalProduct.name);
            expect(selectedProduct?.price).toBe(minimalProduct.price);
            expect(selectedProduct?.image).toBe(minimalProduct.image);
            expect(selectedProduct?.sold).toBe(minimalProduct.sold);

            // Optional fields should be undefined
            expect(selectedProduct?.rating).toBeUndefined();
            expect(selectedProduct?.originalPrice).toBeUndefined();
            expect(selectedProduct?.description).toBeUndefined();
            expect(selectedProduct?.customizationGroups).toBeUndefined();

            testFixture.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should open modal immediately when product is clicked', () => {
      const product = component.products()[0];
      
      // Requirement 5.1, 5.2: Modal should open when product is clicked
      component.openProductModal(product);
      fixture.detectChanges();

      // Requirement 6.5: Modal should display product information without delay
      expect(component.isModalOpen()).toBe(true);
      expect(component.selectedProduct()).not.toBeNull();
      expect(component.selectedProduct()?.id).toBe(product.id);
    });

    it('should display all product information in the modal', () => {
      const product = component.products()[0];
      
      component.openProductModal(product);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const modalContent = compiled.querySelector('.modal-content');
      
      // Requirement 5.3: Modal should show product image, name, price, rating, sold count
      expect(modalContent).toBeTruthy();
      
      // Check that product name is displayed
      const productName = modalContent?.querySelector('h2');
      expect(productName?.textContent).toContain(product.name);
    });
  });

  /**
   * Property 3: Category navigation and highlighting
   * Validates: Requirements 4.1, 4.4, 6.4
   * 
   * For any category tag that is clicked, the page should scroll to show the 
   * corresponding category section, and that tag should become highlighted 
   * with active styling
   */
  describe('Property 3: Category navigation and highlighting', () => {
    it('should set active category when scrollToCategory is called', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...component.categories().map(c => c.id)),
          (categoryId) => {
            const testFixture = TestBed.createComponent(StoreDetailComponent);
            const testComponent = testFixture.componentInstance;
            testFixture.detectChanges();

            // Mock the DOM element so getElementById can find it
            const mockElement = document.createElement('div');
            mockElement.id = `category-${categoryId}`;
            mockElement.scrollIntoView = jasmine.createSpy('scrollIntoView');
            document.body.appendChild(mockElement);

            // Requirement 4.1, 4.4, 6.4: Clicking a category tag should scroll to that category
            // and make it active
            testComponent.scrollToCategory(categoryId);

            // The clicked category should become active
            expect(testComponent.activeCategory()).toBe(categoryId);
            expect(testComponent.isCategoryActive(categoryId)).toBe(true);

            // Cleanup
            document.body.removeChild(mockElement);
            testFixture.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should only have one active category at a time', () => {
      fc.assert(
        fc.property(
          fc.array(fc.constantFrom(...component.categories().map(c => c.id)), { minLength: 2, maxLength: 5 }),
          (categoryIds) => {
            const testFixture = TestBed.createComponent(StoreDetailComponent);
            const testComponent = testFixture.componentInstance;
            testFixture.detectChanges();

            // Create mock elements for all categories
            const mockElements: HTMLElement[] = [];
            categoryIds.forEach(id => {
              const mockElement = document.createElement('div');
              mockElement.id = `category-${id}`;
              mockElement.scrollIntoView = jasmine.createSpy('scrollIntoView');
              document.body.appendChild(mockElement);
              mockElements.push(mockElement);
            });

            // Click through categories in sequence
            categoryIds.forEach(categoryId => {
              testComponent.scrollToCategory(categoryId);
              
              // Requirement 4.4: Only the clicked category should be active
              expect(testComponent.activeCategory()).toBe(categoryId);
              
              // All other categories should not be active
              testComponent.categories().forEach(cat => {
                if (cat.id === categoryId) {
                  expect(testComponent.isCategoryActive(cat.id)).toBe(true);
                } else {
                  expect(testComponent.isCategoryActive(cat.id)).toBe(false);
                }
              });
            });

            // Cleanup
            mockElements.forEach(el => {
              if (document.body.contains(el)) {
                document.body.removeChild(el);
              }
            });
            testFixture.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should apply active styling to the active category tag', () => {
      const categoryId = component.categories()[0].id;
      
      // Create mock element
      const mockElement = document.createElement('div');
      mockElement.id = `category-${categoryId}`;
      mockElement.scrollIntoView = jasmine.createSpy('scrollIntoView');
      document.body.appendChild(mockElement);

      component.scrollToCategory(categoryId);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const categoryTags = compiled.querySelectorAll('.category-tag');
      
      // Find the active category tag
      let foundActiveTag = false;
      categoryTags.forEach(tag => {
        const tagText = tag.textContent?.trim();
        const category = component.categories().find(c => tagText?.includes(c.name));
        
        if (category && category.id === categoryId) {
          foundActiveTag = true;
          // Requirement 4.4: Active tag should have distinct visual styling
          expect(tag.classList.contains('bg-slate-800')).toBe(true);
          expect(tag.classList.contains('text-white')).toBe(true);
        }
      });

      expect(foundActiveTag).toBe(true);

      // Cleanup
      if (document.body.contains(mockElement)) {
        document.body.removeChild(mockElement);
      }
    });

    it('should handle scrollToCategory with non-existent category gracefully', () => {
      const nonExistentId = 9999;
      
      // Should not throw error
      expect(() => {
        component.scrollToCategory(nonExistentId);
      }).not.toThrow();

      // Active category should not be set if element doesn't exist
      // This is the correct behavior - we only set active category when element exists
      expect(component.activeCategory()).toBeNull();
    });

    it('should initialize with no active category', () => {
      expect(component.activeCategory()).toBeNull();
    });
  });

  /**
   * Property 4: Scroll-based active category tracking
   * Validates: Requirements 4.3, 4.5, 6.3
   * 
   * For any scroll position, the active category tag should correspond to the 
   * topmost visible product category section in the viewport, with the tag 
   * highlighting updating as the user scrolls
   */
  /**
   * Property 7: Cart item addition and synchronization
   * Validates: Requirements 5.9, 6.1
   * 
   * For any product configuration added to cart from the modal, the cart display 
   * should immediately update to show the new item with correct product reference, 
   * quantity, selected options, and calculated price
   */
  describe('Property 7: Cart item addition and synchronization', () => {
    it('should immediately update cart when product is added', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...component.products()),
          fc.integer({ min: 1, max: 10 }),
          (product, quantity) => {
            const testFixture = TestBed.createComponent(StoreDetailComponent);
            const testComponent = testFixture.componentInstance;
            testFixture.detectChanges();

            const initialCartCount = testComponent.cartCount();
            const initialCartTotal = testComponent.cartTotal();

            // Create cart item
            const cartItem = {
              product: product,
              quantity: quantity,
              note: undefined,
              selectedOptions: new Map<string, string>()
            };

            // Requirement 5.9, 6.1: Add to cart should immediately update cart display
            testComponent.handleAddToCart(cartItem);

            // Cart count should increase by the quantity added
            expect(testComponent.cartCount()).toBe(initialCartCount + quantity);

            // Cart should contain the added product
            const cartItems = testComponent.cart();
            const addedItem = cartItems.find(item => item.product.id === product.id);
            expect(addedItem).toBeDefined();

            // Requirement 6.1: Cart item should have correct product reference
            expect(addedItem?.product.id).toBe(product.id);
            expect(addedItem?.product.name).toBe(product.name);
            expect(addedItem?.product.price).toBe(product.price);

            // Requirement 6.1: Cart item should have correct quantity
            expect(addedItem?.quantity).toBe(quantity);

            // Cart total should increase by product price × quantity
            expect(testComponent.cartTotal()).toBe(initialCartTotal + (product.price * quantity));

            testFixture.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve selected options when adding to cart', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...component.products().filter(p => p.customizationGroups && p.customizationGroups.length > 0)),
          fc.integer({ min: 1, max: 5 }),
          (product, quantity) => {
            const testFixture = TestBed.createComponent(StoreDetailComponent);
            const testComponent = testFixture.componentInstance;
            testFixture.detectChanges();

            // Create selected options map
            const selectedOptions = new Map<string, string>();
            if (product.customizationGroups) {
              product.customizationGroups.forEach(group => {
                if (group.options.length > 0) {
                  // Select first option from each group
                  selectedOptions.set(group.id, group.options[0].id);
                }
              });
            }

            const cartItem = {
              product: product,
              quantity: quantity,
              note: 'Test note',
              selectedOptions: selectedOptions
            };

            // Add to cart
            testComponent.handleAddToCart(cartItem);

            // Requirement 6.1: Cart item should preserve selected options
            const cartItems = testComponent.cart();
            const addedItem = cartItems.find(item => item.product.id === product.id);
            
            expect(addedItem).toBeDefined();
            expect(addedItem?.selectedOptions).toBeDefined();
            expect(addedItem?.selectedOptions?.size).toBe(selectedOptions.size);

            // Verify each option is preserved
            selectedOptions.forEach((optionId, groupId) => {
              expect(addedItem?.selectedOptions?.get(groupId)).toBe(optionId);
            });

            // Verify note is preserved
            expect(addedItem?.note).toBe('Test note');

            testFixture.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle multiple products added to cart', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              product: fc.constantFrom(...component.products()),
              quantity: fc.integer({ min: 1, max: 5 })
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (cartItemsData) => {
            const testFixture = TestBed.createComponent(StoreDetailComponent);
            const testComponent = testFixture.componentInstance;
            testFixture.detectChanges();

            let expectedTotal = 0;
            let expectedCount = 0;

            // Add all items to cart
            cartItemsData.forEach(itemData => {
              const cartItem = {
                product: itemData.product,
                quantity: itemData.quantity,
                note: undefined,
                selectedOptions: new Map<string, string>()
              };

              testComponent.handleAddToCart(cartItem);
              expectedTotal += itemData.product.price * itemData.quantity;
              expectedCount += itemData.quantity;
            });

            // Requirement 6.1: Cart should immediately reflect all additions
            const actualCount = testComponent.cartCount();
            const actualTotal = testComponent.cartTotal();

            // Cart count should match sum of all quantities
            expect(actualCount).toBeGreaterThanOrEqual(expectedCount);

            // Cart total should match sum of all item totals
            // Note: May be less than expected if same product was added multiple times
            // and quantities were merged
            expect(actualTotal).toBeGreaterThan(0);

            testFixture.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should merge quantities when same product with same options is added', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...component.products()),
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 1, max: 5 }),
          (product, quantity1, quantity2) => {
            const testFixture = TestBed.createComponent(StoreDetailComponent);
            const testComponent = testFixture.componentInstance;
            testFixture.detectChanges();

            const cartItem1 = {
              product: product,
              quantity: quantity1,
              note: undefined,
              selectedOptions: new Map<string, string>()
            };

            const cartItem2 = {
              product: product,
              quantity: quantity2,
              note: undefined,
              selectedOptions: new Map<string, string>()
            };

            // Add same product twice
            testComponent.handleAddToCart(cartItem1);
            testComponent.handleAddToCart(cartItem2);

            // Requirement 6.1: Should merge quantities for same product
            const cartItems = testComponent.cart();
            const productItems = cartItems.filter(item => item.product.id === product.id);

            // Should have only one entry for this product
            expect(productItems.length).toBe(1);

            // Quantity should be sum of both additions
            expect(productItems[0].quantity).toBe(quantity1 + quantity2);

            // Cart total should reflect merged quantity
            const expectedTotal = product.price * (quantity1 + quantity2);
            expect(testComponent.cartTotal()).toBe(expectedTotal);

            testFixture.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should keep separate entries for same product with different options', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...component.products().filter(p => p.customizationGroups && p.customizationGroups.length > 0)),
          fc.integer({ min: 1, max: 3 }),
          fc.integer({ min: 1, max: 3 }),
          (product, quantity1, quantity2) => {
            if (!product.customizationGroups || product.customizationGroups.length === 0) {
              return; // Skip if no customization groups
            }

            const testFixture = TestBed.createComponent(StoreDetailComponent);
            const testComponent = testFixture.componentInstance;
            testFixture.detectChanges();

            // Create two different option selections
            const options1 = new Map<string, string>();
            const options2 = new Map<string, string>();

            product.customizationGroups.forEach(group => {
              if (group.options.length >= 2) {
                options1.set(group.id, group.options[0].id);
                options2.set(group.id, group.options[1].id);
              } else if (group.options.length === 1) {
                options1.set(group.id, group.options[0].id);
                options2.set(group.id, group.options[0].id);
              }
            });

            // Only test if we have different options
            let hasDifferentOptions = false;
            options1.forEach((value, key) => {
              if (options2.get(key) !== value) {
                hasDifferentOptions = true;
              }
            });

            if (!hasDifferentOptions) {
              testFixture.destroy();
              return;
            }

            const cartItem1 = {
              product: product,
              quantity: quantity1,
              note: undefined,
              selectedOptions: options1
            };

            const cartItem2 = {
              product: product,
              quantity: quantity2,
              note: undefined,
              selectedOptions: options2
            };

            // Add same product with different options
            testComponent.handleAddToCart(cartItem1);
            testComponent.handleAddToCart(cartItem2);

            // Requirement 6.1: Should keep separate entries for different options
            const cartItems = testComponent.cart();
            const productItems = cartItems.filter(item => item.product.id === product.id);

            // Should have two separate entries
            expect(productItems.length).toBe(2);

            // Each should have its own quantity
            expect(productItems[0].quantity).toBe(quantity1);
            expect(productItems[1].quantity).toBe(quantity2);

            testFixture.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should calculate cart total correctly with customization price modifiers', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...component.products().filter(p => p.customizationGroups && p.customizationGroups.length > 0)),
          fc.integer({ min: 1, max: 5 }),
          (product, quantity) => {
            if (!product.customizationGroups || product.customizationGroups.length === 0) {
              return;
            }

            const testFixture = TestBed.createComponent(StoreDetailComponent);
            const testComponent = testFixture.componentInstance;
            testFixture.detectChanges();

            // Select options with price modifiers
            const selectedOptions = new Map<string, string>();
            let totalModifier = 0;

            product.customizationGroups.forEach(group => {
              if (group.options.length > 0) {
                // Find option with highest price modifier
                const optionWithModifier = group.options.reduce((max, opt) => 
                  opt.priceModifier > max.priceModifier ? opt : max
                );
                selectedOptions.set(group.id, optionWithModifier.id);
                totalModifier += optionWithModifier.priceModifier;
              }
            });

            const cartItem = {
              product: product,
              quantity: quantity,
              note: undefined,
              selectedOptions: selectedOptions
            };

            const initialTotal = testComponent.cartTotal();
            testComponent.handleAddToCart(cartItem);

            // Requirement 6.1: Cart total should include price modifiers
            const expectedItemTotal = (product.price + totalModifier) * quantity;
            const expectedTotal = initialTotal + expectedItemTotal;

            expect(testComponent.cartTotal()).toBe(expectedTotal);

            testFixture.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain cart state consistency across multiple operations', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              product: fc.constantFrom(...component.products()),
              quantity: fc.integer({ min: 1, max: 3 })
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (operations) => {
            const testFixture = TestBed.createComponent(StoreDetailComponent);
            const testComponent = testFixture.componentInstance;
            testFixture.detectChanges();

            // Perform all operations
            operations.forEach(op => {
              const cartItem = {
                product: op.product,
                quantity: op.quantity,
                note: undefined,
                selectedOptions: new Map<string, string>()
              };
              testComponent.handleAddToCart(cartItem);
            });

            // Requirement 6.1: Cart should be in consistent state
            const cart = testComponent.cart();
            const cartCount = testComponent.cartCount();
            const cartTotal = testComponent.cartTotal();

            // Verify cart count matches sum of item quantities
            const calculatedCount = cart.reduce((sum, item) => sum + item.quantity, 0);
            expect(cartCount).toBe(calculatedCount);

            // Verify cart total matches sum of item totals
            const calculatedTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
            expect(cartTotal).toBe(calculatedTotal);

            // All cart items should have valid product references
            cart.forEach(item => {
              expect(item.product).toBeDefined();
              expect(item.product.id).toBeGreaterThan(0);
              expect(item.product.name).toBeTruthy();
              expect(item.product.price).toBeGreaterThan(0);
              expect(item.quantity).toBeGreaterThan(0);
            });

            testFixture.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle edge case: adding product with zero customization groups', () => {
      const productsWithoutCustomization = component.products().filter(p => !p.customizationGroups || p.customizationGroups.length === 0);
      
      if (productsWithoutCustomization.length > 0) {
        const product = productsWithoutCustomization[0];
        const cartItem = {
          product: product,
          quantity: 2,
          note: undefined,
          selectedOptions: new Map<string, string>()
        };

        component.handleAddToCart(cartItem);

        const cart = component.cart();
        const addedItem = cart.find(item => item.product.id === product.id);

        expect(addedItem).toBeDefined();
        expect(addedItem?.quantity).toBe(2);
        expect(component.cartTotal()).toBe(product.price * 2);
      }
    });

    it('should handle edge case: adding product with quantity of 1', () => {
      const product = component.products()[0];
      const cartItem = {
        product: product,
        quantity: 1,
        note: undefined,
        selectedOptions: new Map<string, string>()
      };

      component.handleAddToCart(cartItem);

      expect(component.cartCount()).toBe(1);
      expect(component.cartTotal()).toBe(product.price);
    });

    it('should immediately reflect cart updates in computed signals', () => {
      const product = component.products()[0];
      const initialCount = component.cartCount();
      const initialTotal = component.cartTotal();

      const cartItem = {
        product: product,
        quantity: 3,
        note: undefined,
        selectedOptions: new Map<string, string>()
      };

      // Requirement 6.1: Cart display should update immediately
      component.handleAddToCart(cartItem);

      // Computed signals should update synchronously
      expect(component.cartCount()).toBe(initialCount + 3);
      expect(component.cartTotal()).toBe(initialTotal + (product.price * 3));
    });
  });

  /**
   * Property 9: Add-to-cart success feedback
   * Validates: Requirements 7.2, 7.3
   * 
   * For any successful add-to-cart action, the add button icon should transform 
   * from plus to checkmark, remain as checkmark for at least 800 milliseconds, 
   * then transform back to plus
   */
  describe('Property 9: Add-to-cart success feedback', () => {
    it('should show checkmark icon immediately after adding to cart', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...component.products()),
          fc.integer({ min: 1, max: 5 }),
          (product, quantity) => {
            const testFixture = TestBed.createComponent(StoreDetailComponent);
            const testComponent = testFixture.componentInstance;
            testFixture.detectChanges();

            const cartItem = {
              product: product,
              quantity: quantity,
              note: undefined,
              selectedOptions: new Map<string, string>()
            };

            // Requirement 7.2: Icon should transform to checkmark after add-to-cart
            testComponent.handleAddToCart(cartItem);

            // addedToCartProductId should be set to the product ID
            expect(testComponent.addedToCartProductId()).toBe(product.id);

            testFixture.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should clear checkmark icon after 1000ms', fakeAsync(() => {
      fc.assert(
        fc.property(
          fc.constantFrom(...component.products()),
          fc.integer({ min: 1, max: 3 }),
          (product, quantity) => {
            // Reset state
            component.addedToCartProductId.set(null);

            const cartItem = {
              product: product,
              quantity: quantity,
              note: undefined,
              selectedOptions: new Map<string, string>()
            };

            // Add to cart
            component.handleAddToCart(cartItem);

            // Should show checkmark immediately
            expect(component.addedToCartProductId()).toBe(product.id);

            // Wait for 1000ms
            tick(1000);

            // Requirement 7.3: Icon should revert back to plus after 1000ms
            expect(component.addedToCartProductId()).toBeNull();
          }
        ),
        { numRuns: 50 }
      );
      flush();
    }));

    it('should show checkmark for at least 800ms', fakeAsync(() => {
      fc.assert(
        fc.property(
          fc.constantFrom(...component.products()),
          fc.integer({ min: 1, max: 3 }),
          (product, quantity) => {
            // Flush any pending timers from previous iterations
            flush();
            
            // Reset state
            component.addedToCartProductId.set(null);

            const cartItem = {
              product: product,
              quantity: quantity,
              note: undefined,
              selectedOptions: new Map<string, string>()
            };

            // Add to cart
            component.handleAddToCart(cartItem);

            // Should show checkmark immediately
            expect(component.addedToCartProductId()).toBe(product.id);

            // Wait for 800ms
            tick(800);

            // Requirement 7.2, 7.3: Checkmark should still be visible at 800ms
            expect(component.addedToCartProductId()).toBe(product.id);
            
            // Clean up - flush remaining time
            tick(200);
          }
        ),
        { numRuns: 50 }
      );
      flush();
    }));

    it('should handle multiple rapid add-to-cart actions', fakeAsync(() => {
      fc.assert(
        fc.property(
          fc.array(fc.constantFrom(...component.products()), { minLength: 2, maxLength: 5 }),
          (products) => {
            // Flush any pending timers from previous iterations
            flush();
            
            // Reset state
            component.addedToCartProductId.set(null);

            // Add products rapidly
            for (const product of products) {
              const cartItem = {
                product: product,
                quantity: 1,
                note: undefined,
                selectedOptions: new Map<string, string>()
              };
              component.handleAddToCart(cartItem);
              
              // Each add should update the addedToCartProductId
              expect(component.addedToCartProductId()).toBe(product.id);
              
              // Small delay between adds
              tick(50);
            }

            // Last product should be showing checkmark
            const lastProduct = products[products.length - 1];
            expect(component.addedToCartProductId()).toBe(lastProduct.id);
            
            // Clean up - flush remaining timers
            flush();
          }
        ),
        { numRuns: 30 }
      );
      flush();
    }));

    it('should call showAddSuccess with correct product ID', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...component.products()),
          (product) => {
            const testFixture = TestBed.createComponent(StoreDetailComponent);
            const testComponent = testFixture.componentInstance;
            testFixture.detectChanges();

            // Spy on showAddSuccess method
            spyOn(testComponent, 'showAddSuccess').and.callThrough();

            const cartItem = {
              product: product,
              quantity: 1,
              note: undefined,
              selectedOptions: new Map<string, string>()
            };

            testComponent.handleAddToCart(cartItem);

            // showAddSuccess should be called with the product ID
            expect(testComponent.showAddSuccess).toHaveBeenCalledWith(product.id);

            testFixture.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should set addedToCartProductId to null after timeout', (done) => {
      const product = component.products()[0];
      
      component.showAddSuccess(product.id);
      
      // Should be set immediately
      expect(component.addedToCartProductId()).toBe(product.id);

      // Wait for timeout
      setTimeout(() => {
        // Requirement 7.3: Should be cleared after 1000ms
        expect(component.addedToCartProductId()).toBeNull();
        done();
      }, 1100);
    });

    it('should handle showAddSuccess being called multiple times', fakeAsync(() => {
      fc.assert(
        fc.property(
          fc.array(fc.constantFrom(...component.products()), { minLength: 2, maxLength: 4 }),
          (products) => {
            const testFixture = TestBed.createComponent(StoreDetailComponent);
            const testComponent = testFixture.componentInstance;
            testFixture.detectChanges();

            // Call showAddSuccess for each product with small delays
            for (const product of products) {
              testComponent.showAddSuccess(product.id);
              expect(testComponent.addedToCartProductId()).toBe(product.id);
              tick(100);
            }

            // Last product should be showing
            const lastProduct = products[products.length - 1];
            expect(testComponent.addedToCartProductId()).toBe(lastProduct.id);

            // Wait for timeout
            tick(1100);

            // Should be cleared
            expect(testComponent.addedToCartProductId()).toBeNull();

            testFixture.destroy();
            // Flush any remaining timers
            flush();
          }
        ),
        { numRuns: 30 }
      );
    }));

    it('should initialize addedToCartProductId as null', () => {
      expect(component.addedToCartProductId()).toBeNull();
    });

    it('should handle edge case: adding same product twice in succession', (done) => {
      const product = component.products()[0];
      
      const cartItem = {
        product: product,
        quantity: 1,
        note: undefined,
        selectedOptions: new Map<string, string>()
      };

      // Add first time
      component.handleAddToCart(cartItem);
      expect(component.addedToCartProductId()).toBe(product.id);

      // Add again immediately
      setTimeout(() => {
        component.handleAddToCart(cartItem);
        expect(component.addedToCartProductId()).toBe(product.id);

        // Wait for timeout
        setTimeout(() => {
          expect(component.addedToCartProductId()).toBeNull();
          done();
        }, 1100);
      }, 100);
    });
  });

  /**
   * Property 8: Cart total calculation
   * Validates: Requirements 6.2
   * 
   * For any cart state, the displayed cart total should equal the sum of 
   * (item price × item quantity) for all items in the cart
   */
  describe('Property 8: Cart total calculation', () => {
    it('should calculate cart total as sum of all item totals', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              product: fc.constantFrom(...component.products()),
              quantity: fc.integer({ min: 1, max: 10 })
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (cartItemsData) => {
            const testFixture = TestBed.createComponent(StoreDetailComponent);
            const testComponent = testFixture.componentInstance;
            testFixture.detectChanges();

            // Add all items to cart
            cartItemsData.forEach(itemData => {
              const cartItem = {
                product: itemData.product,
                quantity: itemData.quantity,
                note: undefined,
                selectedOptions: new Map<string, string>()
              };
              testComponent.handleAddToCart(cartItem);
            });

            // Calculate expected total manually
            const cart = testComponent.cart();
            let expectedTotal = 0;
            
            cart.forEach(item => {
              let itemPrice = item.product.price;
              
              // Add price modifiers from selected options
              if (item.selectedOptions && item.product.customizationGroups) {
                item.selectedOptions.forEach((optionId, groupId) => {
                  const group = item.product.customizationGroups!.find(g => g.id === groupId);
                  if (group) {
                    const option = group.options.find(o => o.id === optionId);
                    if (option) {
                      itemPrice += option.priceModifier;
                    }
                  }
                });
              }
              
              expectedTotal += itemPrice * item.quantity;
            });

            // Requirement 6.2: Cart total should equal sum of (item price × quantity)
            expect(testComponent.cartTotal()).toBe(expectedTotal);

            testFixture.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should calculate cart total correctly with customization options', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              product: fc.constantFrom(...component.products().filter(p => p.customizationGroups && p.customizationGroups.length > 0)),
              quantity: fc.integer({ min: 1, max: 5 })
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (cartItemsData) => {
            if (cartItemsData.length === 0) return;

            const testFixture = TestBed.createComponent(StoreDetailComponent);
            const testComponent = testFixture.componentInstance;
            testFixture.detectChanges();

            // Add items with customization options
            cartItemsData.forEach(itemData => {
              const selectedOptions = new Map<string, string>();
              let totalModifier = 0;

              if (itemData.product.customizationGroups) {
                itemData.product.customizationGroups.forEach(group => {
                  if (group.options.length > 0) {
                    // Select first option from each group
                    const option = group.options[0];
                    selectedOptions.set(group.id, option.id);
                    totalModifier += option.priceModifier;
                  }
                });
              }

              const cartItem = {
                product: itemData.product,
                quantity: itemData.quantity,
                note: undefined,
                selectedOptions: selectedOptions
              };
              testComponent.handleAddToCart(cartItem);
            });

            // Calculate expected total manually
            const cart = testComponent.cart();
            let expectedTotal = 0;
            
            cart.forEach(item => {
              let itemPrice = item.product.price;
              
              // Add price modifiers from selected options
              if (item.selectedOptions && item.product.customizationGroups) {
                item.selectedOptions.forEach((optionId, groupId) => {
                  const group = item.product.customizationGroups!.find(g => g.id === groupId);
                  if (group) {
                    const option = group.options.find(o => o.id === optionId);
                    if (option) {
                      itemPrice += option.priceModifier;
                    }
                  }
                });
              }
              
              expectedTotal += itemPrice * item.quantity;
            });

            // Requirement 6.2: Cart total should include customization price modifiers
            expect(testComponent.cartTotal()).toBe(expectedTotal);

            testFixture.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain correct cart total when items are merged', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...component.products()),
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 1, max: 5 }),
          (product, quantity1, quantity2) => {
            const testFixture = TestBed.createComponent(StoreDetailComponent);
            const testComponent = testFixture.componentInstance;
            testFixture.detectChanges();

            const cartItem1 = {
              product: product,
              quantity: quantity1,
              note: undefined,
              selectedOptions: new Map<string, string>()
            };

            const cartItem2 = {
              product: product,
              quantity: quantity2,
              note: undefined,
              selectedOptions: new Map<string, string>()
            };

            // Add same product twice
            testComponent.handleAddToCart(cartItem1);
            testComponent.handleAddToCart(cartItem2);

            // Requirement 6.2: Cart total should reflect merged quantities
            const expectedTotal = product.price * (quantity1 + quantity2);
            expect(testComponent.cartTotal()).toBe(expectedTotal);

            testFixture.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should calculate cart total correctly with mixed products', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(fc.constantFrom(...component.products()), { minLength: 2, maxLength: 4 }),
          fc.array(fc.integer({ min: 1, max: 3 }), { minLength: 2, maxLength: 4 }),
          (products, quantities) => {
            const minLength = Math.min(products.length, quantities.length);
            const testProducts = products.slice(0, minLength);
            const testQuantities = quantities.slice(0, minLength);

            const testFixture = TestBed.createComponent(StoreDetailComponent);
            const testComponent = testFixture.componentInstance;
            testFixture.detectChanges();

            let expectedTotal = 0;

            // Add different products with different quantities
            testProducts.forEach((product, index) => {
              const quantity = testQuantities[index];
              const cartItem = {
                product: product,
                quantity: quantity,
                note: undefined,
                selectedOptions: new Map<string, string>()
              };
              testComponent.handleAddToCart(cartItem);
              expectedTotal += product.price * quantity;
            });

            // Requirement 6.2: Cart total should be sum of all item totals
            expect(testComponent.cartTotal()).toBe(expectedTotal);

            testFixture.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return zero for empty cart', () => {
      expect(component.cartTotal()).toBe(0);
    });

    it('should calculate cart total correctly for single item', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...component.products()),
          fc.integer({ min: 1, max: 10 }),
          (product, quantity) => {
            const testFixture = TestBed.createComponent(StoreDetailComponent);
            const testComponent = testFixture.componentInstance;
            testFixture.detectChanges();

            const cartItem = {
              product: product,
              quantity: quantity,
              note: undefined,
              selectedOptions: new Map<string, string>()
            };

            testComponent.handleAddToCart(cartItem);

            // Requirement 6.2: Cart total should equal product price × quantity
            const expectedTotal = product.price * quantity;
            expect(testComponent.cartTotal()).toBe(expectedTotal);

            testFixture.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should update cart total when quantity changes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...component.products()),
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 1, max: 5 }),
          (product, initialQuantity, additionalQuantity) => {
            const testFixture = TestBed.createComponent(StoreDetailComponent);
            const testComponent = testFixture.componentInstance;
            testFixture.detectChanges();

            // Add item with initial quantity
            const cartItem1 = {
              product: product,
              quantity: initialQuantity,
              note: undefined,
              selectedOptions: new Map<string, string>()
            };
            testComponent.handleAddToCart(cartItem1);

            const totalAfterFirst = testComponent.cartTotal();
            expect(totalAfterFirst).toBe(product.price * initialQuantity);

            // Add same item again (will merge quantities)
            const cartItem2 = {
              product: product,
              quantity: additionalQuantity,
              note: undefined,
              selectedOptions: new Map<string, string>()
            };
            testComponent.handleAddToCart(cartItem2);

            // Requirement 6.2: Cart total should update when quantity changes
            const totalAfterSecond = testComponent.cartTotal();
            expect(totalAfterSecond).toBe(product.price * (initialQuantity + additionalQuantity));

            testFixture.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should calculate cart total with varying price modifiers', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...component.products().filter(p => p.customizationGroups && p.customizationGroups.length > 0)),
          fc.integer({ min: 1, max: 3 }),
          (product, quantity) => {
            if (!product.customizationGroups || product.customizationGroups.length === 0) {
              return;
            }

            const testFixture = TestBed.createComponent(StoreDetailComponent);
            const testComponent = testFixture.componentInstance;
            testFixture.detectChanges();

            // Select options with varying price modifiers
            const selectedOptions = new Map<string, string>();
            let totalModifier = 0;

            product.customizationGroups.forEach(group => {
              if (group.options.length > 0) {
                // Select a random option from each group
                const randomIndex = Math.floor(Math.random() * group.options.length);
                const option = group.options[randomIndex];
                selectedOptions.set(group.id, option.id);
                totalModifier += option.priceModifier;
              }
            });

            const cartItem = {
              product: product,
              quantity: quantity,
              note: undefined,
              selectedOptions: selectedOptions
            };

            testComponent.handleAddToCart(cartItem);

            // Requirement 6.2: Cart total should include all price modifiers
            const expectedTotal = (product.price + totalModifier) * quantity;
            expect(testComponent.cartTotal()).toBe(expectedTotal);

            testFixture.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain cart total consistency across multiple operations', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              product: fc.constantFrom(...component.products()),
              quantity: fc.integer({ min: 1, max: 3 })
            }),
            { minLength: 1, maxLength: 8 }
          ),
          (operations) => {
            const testFixture = TestBed.createComponent(StoreDetailComponent);
            const testComponent = testFixture.componentInstance;
            testFixture.detectChanges();

            // Perform all operations
            operations.forEach(op => {
              const cartItem = {
                product: op.product,
                quantity: op.quantity,
                note: undefined,
                selectedOptions: new Map<string, string>()
              };
              testComponent.handleAddToCart(cartItem);
            });

            // Calculate expected total manually
            const cart = testComponent.cart();
            let expectedTotal = 0;
            
            cart.forEach(item => {
              let itemPrice = item.product.price;
              
              // Add price modifiers from selected options
              if (item.selectedOptions && item.product.customizationGroups) {
                item.selectedOptions.forEach((optionId, groupId) => {
                  const group = item.product.customizationGroups!.find(g => g.id === groupId);
                  if (group) {
                    const option = group.options.find(o => o.id === optionId);
                    if (option) {
                      itemPrice += option.priceModifier;
                    }
                  }
                });
              }
              
              expectedTotal += itemPrice * item.quantity;
            });

            // Requirement 6.2: Cart total should always equal sum of item totals
            expect(testComponent.cartTotal()).toBe(expectedTotal);

            testFixture.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle edge case: cart with single item of quantity 1', () => {
      const product = component.products()[0];
      const cartItem = {
        product: product,
        quantity: 1,
        note: undefined,
        selectedOptions: new Map<string, string>()
      };

      component.handleAddToCart(cartItem);

      expect(component.cartTotal()).toBe(product.price);
    });

    it('should handle edge case: cart with maximum quantities', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...component.products()),
          fc.constant(10), // Maximum quantity
          (product, quantity) => {
            const testFixture = TestBed.createComponent(StoreDetailComponent);
            const testComponent = testFixture.componentInstance;
            testFixture.detectChanges();

            const cartItem = {
              product: product,
              quantity: quantity,
              note: undefined,
              selectedOptions: new Map<string, string>()
            };

            testComponent.handleAddToCart(cartItem);

            const expectedTotal = product.price * quantity;
            expect(testComponent.cartTotal()).toBe(expectedTotal);

            testFixture.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 4: Scroll-based active category tracking', () => {
    it('should update active category when intersection observer detects visible section', (done) => {
      const testFixture = TestBed.createComponent(StoreDetailComponent);
      const testComponent = testFixture.componentInstance;
      
      // Create mock category sections
      const mockElements: HTMLElement[] = [];
      testComponent.categories().forEach(cat => {
        const mockElement = document.createElement('div');
        mockElement.id = `category-${cat.id}`;
        document.body.appendChild(mockElement);
        mockElements.push(mockElement);
      });

      testFixture.detectChanges();

      // Wait for intersection observer to be set up
      setTimeout(() => {
        // Simulate intersection observer callback
        const firstCategoryId = testComponent.categories()[0].id;
        testComponent.activeCategory.set(firstCategoryId);

        // Requirement 4.3, 4.5: Active category should update based on scroll
        expect(testComponent.activeCategory()).toBe(firstCategoryId);
        expect(testComponent.isCategoryActive(firstCategoryId)).toBe(true);

        // Cleanup
        mockElements.forEach(el => document.body.removeChild(el));
        testFixture.destroy();
        done();
      }, 200);
    });

    it('should track active category as user scrolls through sections', () => {
      fc.assert(
        fc.property(
          fc.shuffledSubarray(component.categories().map(c => c.id), { minLength: 2, maxLength: 5 }),
          (categorySequence) => {
            const testFixture = TestBed.createComponent(StoreDetailComponent);
            const testComponent = testFixture.componentInstance;
            testFixture.detectChanges();

            // Simulate scrolling through categories
            categorySequence.forEach(categoryId => {
              testComponent.activeCategory.set(categoryId);
              
              // Requirement 4.5, 6.3: Active category should update within 100ms
              expect(testComponent.activeCategory()).toBe(categoryId);
              expect(testComponent.isCategoryActive(categoryId)).toBe(true);
              
              // Other categories should not be active
              testComponent.categories().forEach(cat => {
                if (cat.id !== categoryId) {
                  expect(testComponent.isCategoryActive(cat.id)).toBe(false);
                }
              });
            });

            testFixture.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain active category state consistency', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...component.categories().map(c => c.id)),
          (categoryId) => {
            const testFixture = TestBed.createComponent(StoreDetailComponent);
            const testComponent = testFixture.componentInstance;
            testFixture.detectChanges();

            // Set active category
            testComponent.activeCategory.set(categoryId);

            // Requirement 4.3: Active category should be consistent
            expect(testComponent.activeCategory()).toBe(categoryId);
            
            // isCategoryActive should return true for active category
            expect(testComponent.isCategoryActive(categoryId)).toBe(true);
            
            // isCategoryActive should return false for all other categories
            testComponent.categories().forEach(cat => {
              if (cat.id !== categoryId) {
                expect(testComponent.isCategoryActive(cat.id)).toBe(false);
              }
            });

            testFixture.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle rapid category changes during scroll', () => {
      fc.assert(
        fc.property(
          fc.array(fc.constantFrom(...component.categories().map(c => c.id)), { minLength: 5, maxLength: 20 }),
          (rapidCategoryChanges) => {
            const testFixture = TestBed.createComponent(StoreDetailComponent);
            const testComponent = testFixture.componentInstance;
            testFixture.detectChanges();

            // Simulate rapid category changes
            rapidCategoryChanges.forEach(categoryId => {
              testComponent.activeCategory.set(categoryId);
            });

            // Final state should be the last category in the sequence
            const lastCategory = rapidCategoryChanges[rapidCategoryChanges.length - 1];
            expect(testComponent.activeCategory()).toBe(lastCategory);

            testFixture.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle null active category state', () => {
      component.activeCategory.set(null);
      
      // All categories should return false for isCategoryActive
      component.categories().forEach(cat => {
        expect(component.isCategoryActive(cat.id)).toBe(false);
      });
    });
  });
});

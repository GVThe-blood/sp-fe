import { TestBed, ComponentFixture } from '@angular/core/testing';
import { StoreDetailComponent } from './store-detail.component';
import { ActivatedRoute } from '@angular/router';
import * as fc from 'fast-check';

/**
 * Property 10: Original price display
 * Validates: Requirements 7.1, 7.2, 7.5
 * 
 * For any product with an originalPrice property where originalPrice > price, 
 * both prices should be displayed with the original price having strikethrough 
 * styling
 */
describe('Property 10: Original price display', () => {
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

  it('should display both original and sale prices when originalPrice > price', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10000, max: 100000 }), // sale price
        fc.integer({ min: 1, max: 50 }), // discount percentage (1-50%)
        (salePrice, discountPercent) => {
          // Calculate original price that is higher than sale price
          const originalPrice = Math.floor(salePrice * (1 + discountPercent / 100));
          
          // Ensure originalPrice is actually greater than price
          if (originalPrice <= salePrice) {
            return; // Skip this test case
          }

          const testFixture = TestBed.createComponent(StoreDetailComponent);
          const testComponent = testFixture.componentInstance;
          
          // Create a test product with both prices
          const testProduct = {
            id: 999,
            name: 'Test Product',
            price: salePrice,
            originalPrice: originalPrice,
            image: 'https://example.com/image.jpg',
            sold: 100,
            likes: 50,
            rating: 4.5,
            isSoldOut: false,
            categoryId: 1
          };

          // Add test product to the component's products
          testComponent.products.update(products => [...products, testProduct]);
          testFixture.detectChanges();

          const compiled = testFixture.nativeElement as HTMLElement;
          const productCards = compiled.querySelectorAll('.product-card');
          
          // Find the test product card
          let foundTestProduct = false;
          productCards.forEach(card => {
            const productName = card.querySelector('h3')?.textContent;
            if (productName?.includes('Test Product')) {
              foundTestProduct = true;
              
              // Requirement 7.1: Original price should be displayed
              const originalPriceElement = card.querySelector('.line-through');
              expect(originalPriceElement).toBeTruthy();
              
              // Requirement 7.2: Both prices should be visible
              const priceElements = card.querySelectorAll('.text-gray-900, .text-gray-400');
              expect(priceElements.length).toBeGreaterThanOrEqual(2);
              
              // Requirement 7.5: Original price should be higher than sale price
              const originalPriceText = originalPriceElement?.textContent || '';
              const originalPriceValue = parseInt(originalPriceText.replace(/[^\d]/g, ''));
              expect(originalPriceValue).toBe(originalPrice);
              expect(originalPriceValue).toBeGreaterThan(salePrice);
            }
          });

          testFixture.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display only sale price when originalPrice is not present', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10000, max: 100000 }),
        (price) => {
          const testFixture = TestBed.createComponent(StoreDetailComponent);
          const testComponent = testFixture.componentInstance;
          
          // Create a test product without originalPrice
          const testProduct = {
            id: 998,
            name: 'No Original Price Product',
            price: price,
            // No originalPrice property
            image: 'https://example.com/image.jpg',
            sold: 100,
            likes: 50,
            rating: 4.5,
            isSoldOut: false,
            categoryId: 1
          };

          testComponent.products.update(products => [...products, testProduct]);
          testFixture.detectChanges();

          const compiled = testFixture.nativeElement as HTMLElement;
          const productCards = compiled.querySelectorAll('.product-card');
          
          // Find the test product card
          productCards.forEach(card => {
            const productName = card.querySelector('h3')?.textContent;
            if (productName?.includes('No Original Price Product')) {
              // Should not have strikethrough price
              const originalPriceElement = card.querySelector('.line-through');
              expect(originalPriceElement).toBeFalsy();
              
              // Should only display the sale price
              const priceElement = card.querySelector('.text-gray-900');
              expect(priceElement).toBeTruthy();
            }
          });

          testFixture.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not display original price when it equals sale price', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10000, max: 100000 }),
        (price) => {
          const testFixture = TestBed.createComponent(StoreDetailComponent);
          const testComponent = testFixture.componentInstance;
          
          // Create a test product where originalPrice equals price
          const testProduct = {
            id: 997,
            name: 'Equal Price Product',
            price: price,
            originalPrice: price, // Same as price
            image: 'https://example.com/image.jpg',
            sold: 100,
            likes: 50,
            rating: 4.5,
            isSoldOut: false,
            categoryId: 1
          };

          testComponent.products.update(products => [...products, testProduct]);
          testFixture.detectChanges();

          const compiled = testFixture.nativeElement as HTMLElement;
          const productCards = compiled.querySelectorAll('.product-card');
          
          // Find the test product card
          let foundProduct = false;
          productCards.forEach(card => {
            const productName = card.querySelector('h3')?.textContent;
            if (productName?.includes('Equal Price Product')) {
              foundProduct = true;
              // Should not display strikethrough when prices are equal
              const originalPriceElement = card.querySelector('.line-through');
              
              // The *ngIf condition should prevent display when originalPrice <= price
              expect(originalPriceElement).toBeFalsy();
            }
          });

          // Ensure we found and tested the product
          expect(foundProduct).toBe(true);

          testFixture.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use strikethrough styling for original price', () => {
    // Test with actual mock data that has originalPrice
    const productsWithOriginalPrice = component.products().filter(p => p.originalPrice && p.originalPrice > p.price);
    
    expect(productsWithOriginalPrice.length).toBeGreaterThan(0);

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const productCards = compiled.querySelectorAll('.product-card');
    
    let foundProductWithOriginalPrice = false;
    
    productCards.forEach(card => {
      const productName = card.querySelector('h3')?.textContent || '';
      const matchingProduct = productsWithOriginalPrice.find(p => productName.includes(p.name));
      
      if (matchingProduct) {
        foundProductWithOriginalPrice = true;
        
        // Requirement 7.1: Should have strikethrough styling
        const originalPriceElement = card.querySelector('.line-through');
        expect(originalPriceElement).toBeTruthy();
        
        // Verify it has the correct CSS class
        expect(originalPriceElement?.classList.contains('line-through')).toBe(true);
      }
    });

    expect(foundProductWithOriginalPrice).toBe(true);
  });

  it('should position original price near sale price', () => {
    const productsWithOriginalPrice = component.products().filter(p => p.originalPrice && p.originalPrice > p.price);
    
    expect(productsWithOriginalPrice.length).toBeGreaterThan(0);

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const productCards = compiled.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
      const productName = card.querySelector('h3')?.textContent || '';
      const matchingProduct = productsWithOriginalPrice.find(p => productName.includes(p.name));
      
      if (matchingProduct) {
        // Requirement 7.2: Original price should be positioned near sale price
        const priceContainer = card.querySelector('.flex.items-end.gap-2');
        expect(priceContainer).toBeTruthy();
        
        // Both prices should be in the same container
        const salePriceElement = priceContainer?.querySelector('.text-gray-900');
        const originalPriceElement = priceContainer?.querySelector('.line-through');
        
        expect(salePriceElement).toBeTruthy();
        expect(originalPriceElement).toBeTruthy();
      }
    });
  });

  it('should use muted color for original price', () => {
    const productsWithOriginalPrice = component.products().filter(p => p.originalPrice && p.originalPrice > p.price);
    
    expect(productsWithOriginalPrice.length).toBeGreaterThan(0);

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const productCards = compiled.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
      const productName = card.querySelector('h3')?.textContent || '';
      const matchingProduct = productsWithOriginalPrice.find(p => productName.includes(p.name));
      
      if (matchingProduct) {
        // Requirement 7.4: Should use muted color (gray-400)
        const originalPriceElement = card.querySelector('.line-through');
        expect(originalPriceElement?.classList.contains('text-gray-400')).toBe(true);
      }
    });
  });

  it('should format prices consistently with thousand separators', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10000, max: 999999 }),
        fc.integer({ min: 10, max: 50 }),
        (salePrice, discountPercent) => {
          const originalPrice = Math.floor(salePrice * (1 + discountPercent / 100));
          
          if (originalPrice <= salePrice) {
            return;
          }

          const testFixture = TestBed.createComponent(StoreDetailComponent);
          const testComponent = testFixture.componentInstance;
          
          const testProduct = {
            id: 996,
            name: 'Format Test Product',
            price: salePrice,
            originalPrice: originalPrice,
            image: 'https://example.com/image.jpg',
            sold: 100,
            likes: 50,
            rating: 4.5,
            isSoldOut: false,
            categoryId: 1
          };

          testComponent.products.update(products => [...products, testProduct]);
          testFixture.detectChanges();

          const compiled = testFixture.nativeElement as HTMLElement;
          const productCards = compiled.querySelectorAll('.product-card');
          
          productCards.forEach(card => {
            const productName = card.querySelector('h3')?.textContent;
            if (productName?.includes('Format Test Product')) {
              // Requirement 7.6: Prices should be formatted with thousand separators
              const originalPriceElement = card.querySelector('.line-through');
              const salePriceElement = card.querySelector('.text-gray-900');
              
              if (originalPriceElement && salePriceElement) {
                const originalPriceText = originalPriceElement.textContent || '';
                const salePriceText = salePriceElement.textContent || '';
                
                // Check for comma separators in prices >= 10,000
                if (originalPrice >= 10000) {
                  expect(originalPriceText).toContain(',');
                }
                if (salePrice >= 10000) {
                  expect(salePriceText).toContain(',');
                }
              }
            }
          });

          testFixture.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle edge case: originalPrice is 1 VND more than price', () => {
    const testFixture = TestBed.createComponent(StoreDetailComponent);
    const testComponent = testFixture.componentInstance;
    
    const testProduct = {
      id: 995,
      name: 'Minimal Discount Product',
      price: 50000,
      originalPrice: 50001, // Just 1 VND more
      image: 'https://example.com/image.jpg',
      sold: 100,
      likes: 50,
      rating: 4.5,
      isSoldOut: false,
      categoryId: 1
    };

    testComponent.products.update(products => [...products, testProduct]);
    testFixture.detectChanges();

    const compiled = testFixture.nativeElement as HTMLElement;
    const productCards = compiled.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
      const productName = card.querySelector('h3')?.textContent;
      if (productName?.includes('Minimal Discount Product')) {
        // Should still display original price even with minimal difference
        const originalPriceElement = card.querySelector('.line-through');
        expect(originalPriceElement).toBeTruthy();
      }
    });

    testFixture.destroy();
  });

  it('should handle edge case: very large price difference', () => {
    const testFixture = TestBed.createComponent(StoreDetailComponent);
    const testComponent = testFixture.componentInstance;
    
    const testProduct = {
      id: 994,
      name: 'Large Discount Product',
      price: 10000,
      originalPrice: 100000, // 90% discount
      image: 'https://example.com/image.jpg',
      sold: 100,
      likes: 50,
      rating: 4.5,
      isSoldOut: false,
      categoryId: 1
    };

    testComponent.products.update(products => [...products, testProduct]);
    testFixture.detectChanges();

    const compiled = testFixture.nativeElement as HTMLElement;
    const productCards = compiled.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
      const productName = card.querySelector('h3')?.textContent;
      if (productName?.includes('Large Discount Product')) {
        // Should display both prices correctly even with large difference
        const originalPriceElement = card.querySelector('.line-through');
        const salePriceElement = card.querySelector('.text-gray-900');
        
        expect(originalPriceElement).toBeTruthy();
        expect(salePriceElement).toBeTruthy();
        
        const originalPriceText = originalPriceElement?.textContent || '';
        const salePriceText = salePriceElement?.textContent || '';
        
        expect(originalPriceText).toContain('100,000');
        expect(salePriceText).toContain('10,000');
      }
    });

    testFixture.destroy();
  });
});

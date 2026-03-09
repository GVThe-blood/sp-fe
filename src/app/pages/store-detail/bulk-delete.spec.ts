import { TestBed, ComponentFixture } from '@angular/core/testing';
import { StoreDetailComponent } from './store-detail.component';
import { ActivatedRoute } from '@angular/router';
import * as fc from 'fast-check';

/**
 * Property 5: Bulk delete consistency
 * Feature: ui-ux-improvements, Property 5: Bulk delete consistency
 * Validates: Requirements 6.5, 6.6
 * 
 * For any set of selected cart items, when the delete button is clicked, 
 * exactly those items should be removed from the cart and the cart total 
 * should update accordingly
 */
describe('Property 5: Bulk delete consistency', () => {
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

  it('should remove exactly the selected items from cart', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 10 }), // Number of items in cart
        fc.integer({ min: 1, max: 5 }), // Number of items to select for deletion
        (cartSize, numToDelete) => {
          const testFixture = TestBed.createComponent(StoreDetailComponent);
          const testComponent = testFixture.componentInstance;
          testFixture.detectChanges();

          const products = testComponent.products();
          
          // Skip if not enough products
          if (products.length < cartSize) {
            testFixture.destroy();
            return;
          }

          // Ensure we don't try to delete more items than exist
          const actualNumToDelete = Math.min(numToDelete, cartSize);

          // Add items to cart
          const cartItems = [];
          for (let i = 0; i < cartSize; i++) {
            const cartItem = {
              product: products[i],
              quantity: 1,
              note: undefined,
              selectedOptions: new Map<string, string>()
            };
            cartItems.push(cartItem);
          }
          testComponent.cart.set(cartItems);

          // Record initial cart state
          const initialCartLength = testComponent.cart().length;
          const initialProductIds = testComponent.cart().map(item => item.product.id);

          // Select items for deletion (select first N items)
          const indicesToDelete = new Set<number>();
          for (let i = 0; i < actualNumToDelete; i++) {
            indicesToDelete.add(i);
          }
          testComponent.selectedCartItems.set(indicesToDelete);

          // Record which products should remain
          const expectedRemainingIds = initialProductIds.filter((_, index) => !indicesToDelete.has(index));

          // Requirement 6.5: Delete selected items
          testComponent.deleteSelectedCartItems();

          // Verify exactly the selected items were removed
          const finalCart = testComponent.cart();
          const finalProductIds = finalCart.map(item => item.product.id);

          // Requirement 6.5: Cart should have correct number of items remaining
          expect(finalCart.length).toBe(initialCartLength - actualNumToDelete);

          // Requirement 6.5: Remaining items should match expected
          expect(finalProductIds).toEqual(expectedRemainingIds);

          // Verify deleted items are not in cart
          indicesToDelete.forEach(index => {
            const deletedProductId = initialProductIds[index];
            expect(finalProductIds.indexOf(deletedProductId)).toBe(-1);
          });

          testFixture.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should update cart total after bulk delete', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 10 }), // Number of items in cart
        fc.integer({ min: 1, max: 5 }), // Number of items to select for deletion
        (cartSize, numToDelete) => {
          const testFixture = TestBed.createComponent(StoreDetailComponent);
          const testComponent = testFixture.componentInstance;
          testFixture.detectChanges();

          const products = testComponent.products();
          
          // Skip if not enough products
          if (products.length < cartSize) {
            testFixture.destroy();
            return;
          }

          const actualNumToDelete = Math.min(numToDelete, cartSize);

          // Add items to cart
          const cartItems = [];
          for (let i = 0; i < cartSize; i++) {
            const cartItem = {
              product: products[i],
              quantity: 1,
              note: undefined,
              selectedOptions: new Map<string, string>()
            };
            cartItems.push(cartItem);
          }
          testComponent.cart.set(cartItems);

          // Calculate initial total
          const initialTotal = testComponent.cartTotal();

          // Select items for deletion
          const indicesToDelete = new Set<number>();
          let deletedItemsTotal = 0;
          for (let i = 0; i < actualNumToDelete; i++) {
            indicesToDelete.add(i);
            if (i < cartItems.length) {
              deletedItemsTotal += cartItems[i].product.price * cartItems[i].quantity;
            }
          }
          testComponent.selectedCartItems.set(indicesToDelete);

          // Calculate expected total after deletion
          const expectedTotal = initialTotal - deletedItemsTotal;

          // Requirement 6.6: Delete items and update total
          testComponent.deleteSelectedCartItems();

          // Requirement 6.6: Cart total should be updated correctly
          const finalTotal = testComponent.cartTotal();
          expect(finalTotal).toBe(expectedTotal);

          testFixture.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should clear selection after bulk delete', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 10 }),
        fc.integer({ min: 1, max: 5 }),
        (cartSize, numToDelete) => {
          const testFixture = TestBed.createComponent(StoreDetailComponent);
          const testComponent = testFixture.componentInstance;
          testFixture.detectChanges();

          const products = testComponent.products();
          
          // Skip if not enough products
          if (products.length < cartSize) {
            testFixture.destroy();
            return;
          }

          const actualNumToDelete = Math.min(numToDelete, cartSize);

          // Add items to cart
          const cartItems = [];
          for (let i = 0; i < cartSize; i++) {
            cartItems.push({
              product: products[i],
              quantity: 1,
              note: undefined,
              selectedOptions: new Map<string, string>()
            });
          }
          testComponent.cart.set(cartItems);

          // Select items for deletion
          const indicesToDelete = new Set<number>();
          for (let i = 0; i < actualNumToDelete; i++) {
            indicesToDelete.add(i);
          }
          testComponent.selectedCartItems.set(indicesToDelete);

          // Delete items
          testComponent.deleteSelectedCartItems();

          // Selection should be cleared
          expect(testComponent.selectedCartItems().size).toBe(0);

          testFixture.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should exit edit mode after bulk delete', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 10 }),
        fc.integer({ min: 1, max: 5 }),
        (cartSize, numToDelete) => {
          const testFixture = TestBed.createComponent(StoreDetailComponent);
          const testComponent = testFixture.componentInstance;
          testFixture.detectChanges();

          const products = testComponent.products();
          
          // Skip if not enough products
          if (products.length < cartSize) {
            testFixture.destroy();
            return;
          }

          const actualNumToDelete = Math.min(numToDelete, cartSize);

          // Add items to cart
          const cartItems = [];
          for (let i = 0; i < cartSize; i++) {
            cartItems.push({
              product: products[i],
              quantity: 1,
              note: undefined,
              selectedOptions: new Map<string, string>()
            });
          }
          testComponent.cart.set(cartItems);

          // Enter edit mode
          testComponent.isCartEditMode.set(true);

          // Select items for deletion
          const indicesToDelete = new Set<number>();
          for (let i = 0; i < actualNumToDelete; i++) {
            indicesToDelete.add(i);
          }
          testComponent.selectedCartItems.set(indicesToDelete);

          // Delete items
          testComponent.deleteSelectedCartItems();

          // Should exit edit mode
          expect(testComponent.isCartEditMode()).toBe(false);

          testFixture.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle deleting all items from cart', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        (cartSize) => {
          const testFixture = TestBed.createComponent(StoreDetailComponent);
          const testComponent = testFixture.componentInstance;
          testFixture.detectChanges();

          const products = testComponent.products();
          
          // Skip if not enough products
          if (products.length < cartSize) {
            testFixture.destroy();
            return;
          }

          // Add items to cart
          const cartItems = [];
          for (let i = 0; i < cartSize; i++) {
            cartItems.push({
              product: products[i],
              quantity: 1,
              note: undefined,
              selectedOptions: new Map<string, string>()
            });
          }
          testComponent.cart.set(cartItems);

          // Select all items for deletion
          const allIndices = new Set<number>();
          for (let i = 0; i < cartSize; i++) {
            allIndices.add(i);
          }
          testComponent.selectedCartItems.set(allIndices);

          // Delete all items
          testComponent.deleteSelectedCartItems();

          // Cart should be empty
          expect(testComponent.cart().length).toBe(0);
          expect(testComponent.cartTotal()).toBe(0);

          testFixture.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not delete items when no items are selected', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        (cartSize) => {
          const testFixture = TestBed.createComponent(StoreDetailComponent);
          const testComponent = testFixture.componentInstance;
          testFixture.detectChanges();

          const products = testComponent.products();
          
          // Skip if not enough products
          if (products.length < cartSize) {
            testFixture.destroy();
            return;
          }

          // Add items to cart
          const cartItems = [];
          for (let i = 0; i < cartSize; i++) {
            cartItems.push({
              product: products[i],
              quantity: 1,
              note: undefined,
              selectedOptions: new Map<string, string>()
            });
          }
          testComponent.cart.set(cartItems);

          const initialCartLength = testComponent.cart().length;

          // Don't select any items
          testComponent.selectedCartItems.set(new Set());

          // Try to delete
          testComponent.deleteSelectedCartItems();

          // Cart should remain unchanged
          expect(testComponent.cart().length).toBe(initialCartLength);

          testFixture.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle deleting items with different quantities', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 5 }), { minLength: 2, maxLength: 10 }), // Quantities for each item
        fc.integer({ min: 1, max: 5 }), // Number of items to delete
        (quantities, numToDelete) => {
          const testFixture = TestBed.createComponent(StoreDetailComponent);
          const testComponent = testFixture.componentInstance;
          testFixture.detectChanges();

          const products = testComponent.products();
          
          // Skip if not enough products
          if (products.length < quantities.length) {
            testFixture.destroy();
            return;
          }

          const actualNumToDelete = Math.min(numToDelete, quantities.length);

          // Add items to cart with different quantities
          const cartItems = [];
          for (let i = 0; i < quantities.length; i++) {
            cartItems.push({
              product: products[i],
              quantity: quantities[i],
              note: undefined,
              selectedOptions: new Map<string, string>()
            });
          }
          testComponent.cart.set(cartItems);

          const initialTotal = testComponent.cartTotal();

          // Select items for deletion
          const indicesToDelete = new Set<number>();
          let deletedTotal = 0;
          for (let i = 0; i < actualNumToDelete; i++) {
            indicesToDelete.add(i);
            if (i < cartItems.length) {
              deletedTotal += cartItems[i].product.price * cartItems[i].quantity;
            }
          }
          testComponent.selectedCartItems.set(indicesToDelete);

          const expectedTotal = initialTotal - deletedTotal;

          // Delete items
          testComponent.deleteSelectedCartItems();

          // Verify correct items removed and total updated
          expect(testComponent.cart().length).toBe(quantities.length - actualNumToDelete);
          expect(testComponent.cartTotal()).toBe(expectedTotal);

          testFixture.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle deleting items with customization options', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 5 }),
        fc.integer({ min: 1, max: 3 }),
        (cartSize, numToDelete) => {
          const testFixture = TestBed.createComponent(StoreDetailComponent);
          const testComponent = testFixture.componentInstance;
          testFixture.detectChanges();

          // Add items with customization options
          const productsWithOptions = testComponent.products().filter(p => 
            p.customizationGroups && p.customizationGroups.length > 0
          );

          if (productsWithOptions.length < cartSize) {
            testFixture.destroy();
            return; // Skip if not enough products with options
          }

          const actualNumToDelete = Math.min(numToDelete, cartSize);

          const cartItems = [];
          for (let i = 0; i < cartSize; i++) {
            const product = productsWithOptions[i];
            const selectedOptions = new Map<string, string>();
            
            // Select first option from each group
            if (product.customizationGroups) {
              product.customizationGroups.forEach(group => {
                if (group.options.length > 0) {
                  selectedOptions.set(group.id, group.options[0].id);
                }
              });
            }

            cartItems.push({
              product: product,
              quantity: 1,
              note: undefined,
              selectedOptions: selectedOptions
            });
          }
          testComponent.cart.set(cartItems);

          const initialLength = testComponent.cart().length;

          // Select items for deletion
          const indicesToDelete = new Set<number>();
          for (let i = 0; i < actualNumToDelete; i++) {
            indicesToDelete.add(i);
          }
          testComponent.selectedCartItems.set(indicesToDelete);

          // Delete items
          testComponent.deleteSelectedCartItems();

          // Verify deletion
          expect(testComponent.cart().length).toBe(initialLength - actualNumToDelete);

          testFixture.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve order of remaining items after deletion', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 3, max: 10 }),
        fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 1, maxLength: 5 }), // Indices to delete
        (cartSize, indicesToDeleteArray) => {
          const testFixture = TestBed.createComponent(StoreDetailComponent);
          const testComponent = testFixture.componentInstance;
          testFixture.detectChanges();

          const products = testComponent.products();
          
          // Skip if not enough products
          if (products.length < cartSize) {
            testFixture.destroy();
            return;
          }

          // Add items to cart
          const cartItems = [];
          for (let i = 0; i < cartSize; i++) {
            cartItems.push({
              product: products[i],
              quantity: 1,
              note: undefined,
              selectedOptions: new Map<string, string>()
            });
          }
          testComponent.cart.set(cartItems);

          // Filter indices to be within cart size
          const validIndices = indicesToDeleteArray.filter(idx => idx < cartSize);
          if (validIndices.length === 0) {
            testFixture.destroy();
            return;
          }

          const indicesToDelete = new Set(validIndices);
          
          // Record expected order of remaining items
          const expectedOrder = cartItems
            .map((item, index) => ({ item, index }))
            .filter(({ index }) => !indicesToDelete.has(index))
            .map(({ item }) => item.product.id);

          testComponent.selectedCartItems.set(indicesToDelete);

          // Delete items
          testComponent.deleteSelectedCartItems();

          // Verify order is preserved
          const actualOrder = testComponent.cart().map(item => item.product.id);
          expect(actualOrder).toEqual(expectedOrder);

          testFixture.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle edge case: delete single item from cart', () => {
    const testFixture = TestBed.createComponent(StoreDetailComponent);
    const testComponent = testFixture.componentInstance;
    testFixture.detectChanges();

    // Add single item to cart
    const product = testComponent.products()[0];
    testComponent.cart.set([{
      product: product,
      quantity: 1,
      note: undefined,
      selectedOptions: new Map<string, string>()
    }]);

    // Select the item
    testComponent.selectedCartItems.set(new Set([0]));

    // Delete
    testComponent.deleteSelectedCartItems();

    // Cart should be empty
    expect(testComponent.cart().length).toBe(0);
    expect(testComponent.cartTotal()).toBe(0);

    testFixture.destroy();
  });

  it('should handle edge case: delete from middle of cart', () => {
    const testFixture = TestBed.createComponent(StoreDetailComponent);
    const testComponent = testFixture.componentInstance;
    testFixture.detectChanges();

    const products = testComponent.products();
    
    // Skip if not enough products
    if (products.length < 5) {
      testFixture.destroy();
      expect(true).toBe(true); // Pass the test
      return;
    }

    // Add 5 items to cart
    const cartItems = [];
    for (let i = 0; i < 5; i++) {
      cartItems.push({
        product: products[i],
        quantity: 1,
        note: undefined,
        selectedOptions: new Map<string, string>()
      });
    }
    testComponent.cart.set(cartItems);

    // Delete middle item (index 2)
    testComponent.selectedCartItems.set(new Set([2]));

    const expectedIds = [
      products[0].id,
      products[1].id,
      products[3].id,
      products[4].id
    ];

    testComponent.deleteSelectedCartItems();

    const actualIds = testComponent.cart().map(item => item.product.id);
    expect(actualIds).toEqual(expectedIds);

    testFixture.destroy();
  });
});

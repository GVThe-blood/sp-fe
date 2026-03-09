import { TestBed, ComponentFixture } from '@angular/core/testing';
import { StoreDetailComponent } from './store-detail.component';
import { ActivatedRoute } from '@angular/router';
import * as fc from 'fast-check';

/**
 * Property 9: Select all functionality
 * Feature: ui-ux-improvements, Property 9: Select all functionality
 * Validates: Requirements 6.3
 * 
 * For any cart state in edit mode, clicking "Select All" should check all 
 * cart item checkboxes, and the selected set should contain all cart item indices
 */
describe('Property 9: Select all functionality', () => {
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

  it('should select all cart items when selectAllCartItems is called', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }), // Number of items in cart
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

          // Requirement 6.3: Select all items
          testComponent.selectAllCartItems();

          // Verify all items are selected
          const selectedItems = testComponent.selectedCartItems();
          expect(selectedItems.size).toBe(cartSize);

          // Verify each index is in the selected set
          for (let i = 0; i < cartSize; i++) {
            expect(selectedItems.has(i)).toBe(true);
          }

          testFixture.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should indicate all items are selected when areAllItemsSelected is called', () => {
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

          // Select all items
          testComponent.selectAllCartItems();

          // Requirement 6.3: areAllItemsSelected should return true
          expect(testComponent.areAllItemsSelected()).toBe(true);

          testFixture.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not indicate all items selected when only some are selected', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 10 }),
        fc.integer({ min: 1, max: 5 }),
        (cartSize, numToSelect) => {
          const testFixture = TestBed.createComponent(StoreDetailComponent);
          const testComponent = testFixture.componentInstance;
          testFixture.detectChanges();

          const products = testComponent.products();
          
          // Skip if not enough products
          if (products.length < cartSize) {
            testFixture.destroy();
            return;
          }

          const actualNumToSelect = Math.min(numToSelect, cartSize - 1); // Select less than all

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

          // Select only some items
          const selectedIndices = new Set<number>();
          for (let i = 0; i < actualNumToSelect; i++) {
            selectedIndices.add(i);
          }
          testComponent.selectedCartItems.set(selectedIndices);

          // Should not indicate all items selected
          expect(testComponent.areAllItemsSelected()).toBe(false);

          testFixture.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should toggle between select all and deselect all', () => {
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

          // Initially no items selected
          expect(testComponent.selectedCartItems().size).toBe(0);
          expect(testComponent.areAllItemsSelected()).toBe(false);

          // Toggle to select all
          testComponent.toggleSelectAll();
          expect(testComponent.selectedCartItems().size).toBe(cartSize);
          expect(testComponent.areAllItemsSelected()).toBe(true);

          // Toggle to deselect all
          testComponent.toggleSelectAll();
          expect(testComponent.selectedCartItems().size).toBe(0);
          expect(testComponent.areAllItemsSelected()).toBe(false);

          testFixture.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle edge case: select all with single item', () => {
    const testFixture = TestBed.createComponent(StoreDetailComponent);
    const testComponent = testFixture.componentInstance;
    testFixture.detectChanges();

    const products = testComponent.products();
    
    // Add single item to cart
    testComponent.cart.set([{
      product: products[0],
      quantity: 1,
      note: undefined,
      selectedOptions: new Map<string, string>()
    }]);

    // Select all
    testComponent.selectAllCartItems();

    // Should have one item selected
    expect(testComponent.selectedCartItems().size).toBe(1);
    expect(testComponent.selectedCartItems().has(0)).toBe(true);
    expect(testComponent.areAllItemsSelected()).toBe(true);

    testFixture.destroy();
  });

  it('should handle edge case: select all with empty cart', () => {
    const testFixture = TestBed.createComponent(StoreDetailComponent);
    const testComponent = testFixture.componentInstance;
    testFixture.detectChanges();

    // Empty cart
    testComponent.cart.set([]);

    // Select all
    testComponent.selectAllCartItems();

    // Should have no items selected
    expect(testComponent.selectedCartItems().size).toBe(0);
    expect(testComponent.areAllItemsSelected()).toBe(false);

    testFixture.destroy();
  });

  it('should maintain selection state across multiple select all calls', () => {
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

          // Call select all multiple times
          testComponent.selectAllCartItems();
          const firstSelection = new Set(testComponent.selectedCartItems());
          
          testComponent.selectAllCartItems();
          const secondSelection = new Set(testComponent.selectedCartItems());

          // Both selections should be identical
          expect(firstSelection.size).toBe(secondSelection.size);
          expect(firstSelection.size).toBe(cartSize);
          
          firstSelection.forEach(index => {
            expect(secondSelection.has(index)).toBe(true);
          });

          testFixture.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should select all items regardless of their current selection state', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 3, max: 10 }),
        fc.integer({ min: 1, max: 5 }),
        (cartSize, numPreSelected) => {
          const testFixture = TestBed.createComponent(StoreDetailComponent);
          const testComponent = testFixture.componentInstance;
          testFixture.detectChanges();

          const products = testComponent.products();
          
          // Skip if not enough products
          if (products.length < cartSize) {
            testFixture.destroy();
            return;
          }

          const actualNumPreSelected = Math.min(numPreSelected, cartSize);

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

          // Pre-select some items
          const preSelected = new Set<number>();
          for (let i = 0; i < actualNumPreSelected; i++) {
            preSelected.add(i);
          }
          testComponent.selectedCartItems.set(preSelected);

          // Select all
          testComponent.selectAllCartItems();

          // All items should now be selected
          expect(testComponent.selectedCartItems().size).toBe(cartSize);
          for (let i = 0; i < cartSize; i++) {
            expect(testComponent.selectedCartItems().has(i)).toBe(true);
          }

          testFixture.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should work correctly in edit mode', () => {
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

          // Enter edit mode
          testComponent.isCartEditMode.set(true);

          // Select all
          testComponent.selectAllCartItems();

          // All items should be selected
          expect(testComponent.selectedCartItems().size).toBe(cartSize);
          expect(testComponent.areAllItemsSelected()).toBe(true);

          testFixture.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });
});

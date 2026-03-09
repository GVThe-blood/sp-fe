import { ComponentFixture, TestBed } from '@angular/core/testing';
import * as fc from 'fast-check';
import { PromoCodeModalComponent, PromoCode } from './promo-code-modal.component';

/**
 * Property-Based Tests for PromoCodeModal Component
 * 
 * Tests for disabled state and click zones functionality
 */
describe('PromoCodeModal - Property Tests', () => {
  let component: PromoCodeModalComponent;
  let fixture: ComponentFixture<PromoCodeModalComponent>;

  // Arbitrary for generating valid PromoCode objects
  const promoCodeArbitrary = fc.record({
    id: fc.uuid(),
    code: fc.string({ minLength: 3, maxLength: 10 }).map(s => s.toUpperCase()),
    title: fc.string({ minLength: 5, maxLength: 50 }),
    description: fc.string({ minLength: 5, maxLength: 100 }),
    discount: fc.integer({ min: 1, max: 100 }),
    discountType: fc.constantFrom('percent', 'fixed') as fc.Arbitrary<'percent' | 'fixed'>,
    maxDiscount: fc.option(fc.integer({ min: 1000, max: 100000 }), { nil: undefined }),
    minOrderAmount: fc.integer({ min: 0, max: 500000 }),
    expiryDate: fc.date({ min: new Date(), max: new Date('2026-12-31') }),
    imageUrl: fc.option(fc.webUrl(), { nil: undefined }),
    category: fc.constantFrom('food', 'delivery', 'special') as fc.Arbitrary<'food' | 'delivery' | 'special'>,
    isDisabled: fc.boolean(),
    disabledReason: fc.option(fc.string({ minLength: 5, maxLength: 50 }), { nil: undefined }),
    conditions: fc.option(fc.array(fc.string({ minLength: 5, maxLength: 50 }), { minLength: 1, maxLength: 5 }), { nil: undefined })
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PromoCodeModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PromoCodeModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  /**
   * **Feature: ui-ux-improvements-v2, Property 4: Disabled promo codes not selectable**
   * **Validates: Requirements 5.1**
   * 
   * For any promo code with isDisabled=true, clicking on it should not change the selection state
   */
  describe('Property 4: Disabled promo codes not selectable', () => {
    it('canSelectPromo returns false for disabled promos', () => {
      fc.assert(
        fc.property(
          promoCodeArbitrary,
          (promo) => {
            // Force promo to be disabled
            const disabledPromo: PromoCode = { ...promo, isDisabled: true };
            
            // canSelectPromo should return false for disabled promos
            expect(component.canSelectPromo(disabledPromo)).toBe(false);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('togglePromo does not add disabled promo to selection', () => {
      fc.assert(
        fc.property(
          promoCodeArbitrary,
          (promo) => {
            // Force promo to be disabled
            const disabledPromo: PromoCode = { ...promo, isDisabled: true };
            
            // Clear selection
            component.selectedPromos.set(new Set());
            
            // Try to toggle the disabled promo
            component.togglePromo(disabledPromo);
            
            // Selection should remain empty
            expect(component.selectedPromos().has(disabledPromo.id)).toBe(false);
            expect(component.selectedPromos().size).toBe(0);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('disabled promo selection state never changes regardless of toggle attempts', () => {
      fc.assert(
        fc.property(
          promoCodeArbitrary,
          fc.integer({ min: 1, max: 20 }),
          (promo, toggleCount) => {
            // Force promo to be disabled
            const disabledPromo: PromoCode = { ...promo, isDisabled: true };
            
            // Clear selection
            component.selectedPromos.set(new Set());
            
            // Try to toggle multiple times
            for (let i = 0; i < toggleCount; i++) {
              component.togglePromo(disabledPromo);
            }
            
            // Selection should still be empty
            expect(component.selectedPromos().has(disabledPromo.id)).toBe(false);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('isPromoDisabled correctly identifies disabled promos', () => {
      fc.assert(
        fc.property(
          promoCodeArbitrary,
          fc.boolean(),
          (promo, isDisabled) => {
            const testPromo: PromoCode = { ...promo, isDisabled };
            
            expect(component.isPromoDisabled(testPromo)).toBe(isDisabled);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: ui-ux-improvements-v2, Property 5: Promo checkbox area toggles selection**
   * **Validates: Requirements 5.2**
   * 
   * For any enabled promo code, clicking on the checkbox area should toggle its selection state
   */
  describe('Property 5: Promo checkbox area toggles selection', () => {
    it('togglePromo adds enabled promo to selection when not selected', () => {
      fc.assert(
        fc.property(
          promoCodeArbitrary,
          (promo) => {
            // Force promo to be enabled
            const enabledPromo: PromoCode = { ...promo, isDisabled: false };
            
            // Clear selection
            component.selectedPromos.set(new Set());
            
            // Toggle the enabled promo
            component.togglePromo(enabledPromo);
            
            // Promo should now be selected
            expect(component.selectedPromos().has(enabledPromo.id)).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('togglePromo removes enabled promo from selection when already selected', () => {
      fc.assert(
        fc.property(
          promoCodeArbitrary,
          (promo) => {
            // Force promo to be enabled
            const enabledPromo: PromoCode = { ...promo, isDisabled: false };
            
            // Pre-select the promo
            component.selectedPromos.set(new Set([enabledPromo.id]));
            
            // Toggle the enabled promo
            component.togglePromo(enabledPromo);
            
            // Promo should now be deselected
            expect(component.selectedPromos().has(enabledPromo.id)).toBe(false);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('double toggle returns to original selection state', () => {
      fc.assert(
        fc.property(
          promoCodeArbitrary,
          fc.boolean(),
          (promo, initiallySelected) => {
            // Force promo to be enabled
            const enabledPromo: PromoCode = { ...promo, isDisabled: false };
            
            // Set initial selection state
            if (initiallySelected) {
              component.selectedPromos.set(new Set([enabledPromo.id]));
            } else {
              component.selectedPromos.set(new Set());
            }
            
            // Toggle twice
            component.togglePromo(enabledPromo);
            component.togglePromo(enabledPromo);
            
            // Should return to original state
            expect(component.selectedPromos().has(enabledPromo.id)).toBe(initiallySelected);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('even number of toggles returns to initial state', () => {
      fc.assert(
        fc.property(
          promoCodeArbitrary,
          fc.boolean(),
          fc.integer({ min: 1, max: 25 }),
          (promo, initiallySelected, halfToggles) => {
            // Force promo to be enabled
            const enabledPromo: PromoCode = { ...promo, isDisabled: false };
            
            // Set initial selection state
            if (initiallySelected) {
              component.selectedPromos.set(new Set([enabledPromo.id]));
            } else {
              component.selectedPromos.set(new Set());
            }
            
            // Toggle even number of times
            const totalToggles = halfToggles * 2;
            for (let i = 0; i < totalToggles; i++) {
              component.togglePromo(enabledPromo);
            }
            
            // Should return to initial state
            expect(component.selectedPromos().has(enabledPromo.id)).toBe(initiallySelected);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('odd number of toggles inverts initial state', () => {
      fc.assert(
        fc.property(
          promoCodeArbitrary,
          fc.boolean(),
          fc.integer({ min: 0, max: 24 }),
          (promo, initiallySelected, halfToggles) => {
            // Force promo to be enabled
            const enabledPromo: PromoCode = { ...promo, isDisabled: false };
            
            // Set initial selection state
            if (initiallySelected) {
              component.selectedPromos.set(new Set([enabledPromo.id]));
            } else {
              component.selectedPromos.set(new Set());
            }
            
            // Toggle odd number of times
            const totalToggles = halfToggles * 2 + 1;
            for (let i = 0; i < totalToggles; i++) {
              component.togglePromo(enabledPromo);
            }
            
            // Should be opposite of initial state
            expect(component.selectedPromos().has(enabledPromo.id)).toBe(!initiallySelected);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('isSelected correctly reflects selection state', () => {
      fc.assert(
        fc.property(
          promoCodeArbitrary,
          fc.boolean(),
          (promo, shouldBeSelected) => {
            // Set selection state
            if (shouldBeSelected) {
              component.selectedPromos.set(new Set([promo.id]));
            } else {
              component.selectedPromos.set(new Set());
            }
            
            // isSelected should match
            expect(component.isSelected(promo.id)).toBe(shouldBeSelected);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


/**
 * **Feature: ui-ux-improvements-v2, Property 6: Promo info area opens detail modal**
 * **Validates: Requirements 5.3**
 * 
 * For any promo code, clicking on the information area should open the detail modal with that promo's data
 */
describe('Property 6: Promo info area opens detail modal', () => {
  let component: PromoCodeModalComponent;
  let fixture: ComponentFixture<PromoCodeModalComponent>;

  // Arbitrary for generating valid PromoCode objects
  const promoCodeArbitrary = fc.record({
    id: fc.uuid(),
    code: fc.string({ minLength: 3, maxLength: 10 }).map(s => s.toUpperCase()),
    title: fc.string({ minLength: 5, maxLength: 50 }),
    description: fc.string({ minLength: 5, maxLength: 100 }),
    discount: fc.integer({ min: 1, max: 100 }),
    discountType: fc.constantFrom('percent', 'fixed') as fc.Arbitrary<'percent' | 'fixed'>,
    maxDiscount: fc.option(fc.integer({ min: 1000, max: 100000 }), { nil: undefined }),
    minOrderAmount: fc.integer({ min: 0, max: 500000 }),
    expiryDate: fc.date({ min: new Date(), max: new Date('2026-12-31') }),
    imageUrl: fc.option(fc.webUrl(), { nil: undefined }),
    category: fc.constantFrom('food', 'delivery', 'special') as fc.Arbitrary<'food' | 'delivery' | 'special'>,
    isDisabled: fc.boolean(),
    disabledReason: fc.option(fc.string({ minLength: 5, maxLength: 50 }), { nil: undefined }),
    conditions: fc.option(fc.array(fc.string({ minLength: 5, maxLength: 50 }), { minLength: 1, maxLength: 5 }), { nil: undefined })
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PromoCodeModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PromoCodeModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('openPromoDetail sets showDetailModal to true', () => {
    fc.assert(
      fc.property(
        promoCodeArbitrary,
        (promo) => {
          // Ensure detail modal is initially closed
          component.showDetailModal.set(false);
          component.selectedPromoForDetail.set(null);
          
          // Create a mock event
          const mockEvent = new MouseEvent('click');
          
          // Open promo detail
          component.openPromoDetail(promo, mockEvent);
          
          // Detail modal should now be open
          expect(component.showDetailModal()).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('openPromoDetail sets selectedPromoForDetail to the clicked promo', () => {
    fc.assert(
      fc.property(
        promoCodeArbitrary,
        (promo) => {
          // Ensure detail modal is initially closed
          component.showDetailModal.set(false);
          component.selectedPromoForDetail.set(null);
          
          // Create a mock event
          const mockEvent = new MouseEvent('click');
          
          // Open promo detail
          component.openPromoDetail(promo, mockEvent);
          
          // Selected promo should match the clicked promo
          const selectedPromo = component.selectedPromoForDetail();
          expect(selectedPromo).not.toBeNull();
          expect(selectedPromo?.id).toBe(promo.id);
          expect(selectedPromo?.code).toBe(promo.code);
          expect(selectedPromo?.title).toBe(promo.title);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('openPromoDetail works for both enabled and disabled promos', () => {
    fc.assert(
      fc.property(
        promoCodeArbitrary,
        fc.boolean(),
        (promo, isDisabled) => {
          const testPromo: PromoCode = { ...promo, isDisabled };
          
          // Ensure detail modal is initially closed
          component.showDetailModal.set(false);
          component.selectedPromoForDetail.set(null);
          
          // Create a mock event
          const mockEvent = new MouseEvent('click');
          
          // Open promo detail
          component.openPromoDetail(testPromo, mockEvent);
          
          // Detail modal should open regardless of disabled state
          expect(component.showDetailModal()).toBe(true);
          expect(component.selectedPromoForDetail()?.id).toBe(testPromo.id);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('closeDetailModal closes the detail modal and clears selected promo', () => {
    fc.assert(
      fc.property(
        promoCodeArbitrary,
        (promo) => {
          // Open detail modal first
          component.showDetailModal.set(true);
          component.selectedPromoForDetail.set(promo);
          
          // Close detail modal
          component.closeDetailModal();
          
          // Detail modal should be closed and promo cleared
          expect(component.showDetailModal()).toBe(false);
          expect(component.selectedPromoForDetail()).toBeNull();
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('opening different promos updates selectedPromoForDetail correctly', () => {
    fc.assert(
      fc.property(
        promoCodeArbitrary,
        promoCodeArbitrary,
        (promo1, promo2) => {
          // Ensure different IDs
          const testPromo1 = { ...promo1, id: 'promo-1' };
          const testPromo2 = { ...promo2, id: 'promo-2' };
          
          const mockEvent = new MouseEvent('click');
          
          // Open first promo
          component.openPromoDetail(testPromo1, mockEvent);
          expect(component.selectedPromoForDetail()?.id).toBe('promo-1');
          
          // Open second promo (without closing first)
          component.openPromoDetail(testPromo2, mockEvent);
          expect(component.selectedPromoForDetail()?.id).toBe('promo-2');
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * **Feature: ui-ux-improvements-v2, Property 7: Maximum 10 promos per category**
 * **Validates: Requirements 5.5**
 * 
 * For any category of promo codes, the displayed list should contain at most 10 items
 */
describe('Property 7: Maximum 10 promos per category', () => {
  let component: PromoCodeModalComponent;
  let fixture: ComponentFixture<PromoCodeModalComponent>;

  // Arbitrary for generating valid PromoCode objects
  const promoCodeArbitrary = fc.record({
    id: fc.uuid(),
    code: fc.string({ minLength: 3, maxLength: 10 }).map(s => s.toUpperCase()),
    title: fc.string({ minLength: 5, maxLength: 50 }),
    description: fc.string({ minLength: 5, maxLength: 100 }),
    discount: fc.integer({ min: 1, max: 100 }),
    discountType: fc.constantFrom('percent', 'fixed') as fc.Arbitrary<'percent' | 'fixed'>,
    maxDiscount: fc.option(fc.integer({ min: 1000, max: 100000 }), { nil: undefined }),
    minOrderAmount: fc.integer({ min: 0, max: 500000 }),
    expiryDate: fc.date({ min: new Date(), max: new Date('2026-12-31') }),
    imageUrl: fc.option(fc.webUrl(), { nil: undefined }),
    category: fc.constantFrom('food', 'delivery', 'special') as fc.Arbitrary<'food' | 'delivery' | 'special'>,
    isDisabled: fc.boolean(),
    disabledReason: fc.option(fc.string({ minLength: 5, maxLength: 50 }), { nil: undefined }),
    conditions: fc.option(fc.array(fc.string({ minLength: 5, maxLength: 50 }), { minLength: 1, maxLength: 5 }), { nil: undefined })
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PromoCodeModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PromoCodeModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('getDisplayedPromos returns at most 10 food promos regardless of input size', () => {
    fc.assert(
      fc.property(
        fc.array(promoCodeArbitrary, { minLength: 0, maxLength: 30 }),
        (promos) => {
          // Force all promos to be food category
          const foodPromos = promos.map((p, i) => ({ 
            ...p, 
            id: `food-${i}`,
            category: 'food' as const 
          }));
          
          // Set the promos on the component and clear search
          component.promoCodes = foodPromos;
          component.searchTerm.set('');
          
          // Get displayed promos
          const displayed = component.getDisplayedPromos('food');
          
          // Should never exceed 10
          expect(displayed.length).toBeLessThanOrEqual(10);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('getDisplayedPromos returns at most 10 delivery promos regardless of input size', () => {
    fc.assert(
      fc.property(
        fc.array(promoCodeArbitrary, { minLength: 0, maxLength: 30 }),
        (promos) => {
          // Force all promos to be delivery category
          const deliveryPromos = promos.map((p, i) => ({ 
            ...p, 
            id: `delivery-${i}`,
            category: 'delivery' as const 
          }));
          
          // Set the promos on the component and clear search
          component.promoCodes = deliveryPromos;
          component.searchTerm.set('');
          
          // Get displayed promos
          const displayed = component.getDisplayedPromos('delivery');
          
          // Should never exceed 10
          expect(displayed.length).toBeLessThanOrEqual(10);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('getDisplayedPromos returns correct count when promos are 10 or less', () => {
    // Test with the component's default promos
    // The component has 4 food promos and 2 delivery promos by default
    const foodDisplayed = component.getDisplayedPromos('food');
    const deliveryDisplayed = component.getDisplayedPromos('delivery');
    
    // Both should be <= 10
    expect(foodDisplayed.length).toBeLessThanOrEqual(10);
    expect(deliveryDisplayed.length).toBeLessThanOrEqual(10);
  });

  it('getDisplayedPromos returns exactly 10 when more than 10 promos exist', () => {
    fc.assert(
      fc.property(
        fc.array(promoCodeArbitrary, { minLength: 11, maxLength: 30 }),
        (promos) => {
          // Force all promos to be food category
          const foodPromos = promos.map((p, i) => ({ 
            ...p, 
            id: `food-${i}`,
            category: 'food' as const 
          }));
          
          // Set the promos on the component and clear search
          component.promoCodes = foodPromos;
          component.searchTerm.set('');
          
          // Get displayed promos
          const displayed = component.getDisplayedPromos('food');
          
          // Should return exactly 10 when more than 10 exist
          expect(displayed.length).toBe(10);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('foodPromoCodes computed property respects 10 item limit', () => {
    fc.assert(
      fc.property(
        fc.array(promoCodeArbitrary, { minLength: 0, maxLength: 30 }),
        (promos) => {
          // Force all promos to be food category
          const foodPromos = promos.map((p, i) => ({ 
            ...p, 
            id: `food-${i}`,
            category: 'food' as const 
          }));
          
          // Set the promos on the component and clear search
          component.promoCodes = foodPromos;
          component.searchTerm.set('');
          
          // Access computed property
          const displayed = component.foodPromoCodes();
          
          // Should never exceed 10
          expect(displayed.length).toBeLessThanOrEqual(10);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('deliveryPromoCodes computed property respects 10 item limit', () => {
    fc.assert(
      fc.property(
        fc.array(promoCodeArbitrary, { minLength: 0, maxLength: 30 }),
        (promos) => {
          // Force all promos to be delivery category
          const deliveryPromos = promos.map((p, i) => ({ 
            ...p, 
            id: `delivery-${i}`,
            category: 'delivery' as const 
          }));
          
          // Set the promos on the component and clear search
          component.promoCodes = deliveryPromos;
          component.searchTerm.set('');
          
          // Access computed property
          const displayed = component.deliveryPromoCodes();
          
          // Should never exceed 10
          expect(displayed.length).toBeLessThanOrEqual(10);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * **Feature: ui-ux-improvements-v2, Property 8: Available promos sorted before disabled**
 * **Validates: Requirements 5.6**
 * 
 * For any list of displayed promo codes, all available (non-disabled) codes should appear before any disabled codes
 */
describe('Property 8: Available promos sorted before disabled', () => {
  let component: PromoCodeModalComponent;
  let fixture: ComponentFixture<PromoCodeModalComponent>;

  // Arbitrary for generating valid PromoCode objects
  const promoCodeArbitrary = fc.record({
    id: fc.uuid(),
    code: fc.string({ minLength: 3, maxLength: 10 }).map(s => s.toUpperCase()),
    title: fc.string({ minLength: 5, maxLength: 50 }),
    description: fc.string({ minLength: 5, maxLength: 100 }),
    discount: fc.integer({ min: 1, max: 100 }),
    discountType: fc.constantFrom('percent', 'fixed') as fc.Arbitrary<'percent' | 'fixed'>,
    maxDiscount: fc.option(fc.integer({ min: 1000, max: 100000 }), { nil: undefined }),
    minOrderAmount: fc.integer({ min: 0, max: 500000 }),
    expiryDate: fc.date({ min: new Date(), max: new Date('2026-12-31') }),
    imageUrl: fc.option(fc.webUrl(), { nil: undefined }),
    category: fc.constantFrom('food', 'delivery', 'special') as fc.Arbitrary<'food' | 'delivery' | 'special'>,
    isDisabled: fc.boolean(),
    disabledReason: fc.option(fc.string({ minLength: 5, maxLength: 50 }), { nil: undefined }),
    conditions: fc.option(fc.array(fc.string({ minLength: 5, maxLength: 50 }), { minLength: 1, maxLength: 5 }), { nil: undefined })
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PromoCodeModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PromoCodeModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('all available promos appear before any disabled promos in food category', () => {
    fc.assert(
      fc.property(
        fc.array(promoCodeArbitrary, { minLength: 2, maxLength: 20 }),
        (promos) => {
          // Create a mix of enabled and disabled food promos
          const foodPromos = promos.map((p, i) => ({ 
            ...p, 
            id: `food-${i}`,
            category: 'food' as const,
            isDisabled: i % 2 === 0 // Alternate enabled/disabled
          }));
          
          // Set the promos on the component and clear search
          component.promoCodes = foodPromos;
          component.searchTerm.set('');
          
          // Get displayed promos
          const displayed = component.getDisplayedPromos('food');
          
          // Find the index of first disabled promo
          const firstDisabledIndex = displayed.findIndex(p => p.isDisabled === true);
          
          // If there are disabled promos, all promos before it should be enabled
          if (firstDisabledIndex > 0) {
            for (let i = 0; i < firstDisabledIndex; i++) {
              expect(displayed[i].isDisabled).not.toBe(true);
            }
          }
          
          // All promos after first disabled should also be disabled
          if (firstDisabledIndex >= 0) {
            for (let i = firstDisabledIndex; i < displayed.length; i++) {
              expect(displayed[i].isDisabled).toBe(true);
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('all available promos appear before any disabled promos in delivery category', () => {
    fc.assert(
      fc.property(
        fc.array(promoCodeArbitrary, { minLength: 2, maxLength: 20 }),
        (promos) => {
          // Create a mix of enabled and disabled delivery promos
          const deliveryPromos = promos.map((p, i) => ({ 
            ...p, 
            id: `delivery-${i}`,
            category: 'delivery' as const,
            isDisabled: i % 2 === 0 // Alternate enabled/disabled
          }));
          
          // Set the promos on the component and clear search
          component.promoCodes = deliveryPromos;
          component.searchTerm.set('');
          
          // Get displayed promos
          const displayed = component.getDisplayedPromos('delivery');
          
          // Find the index of first disabled promo
          const firstDisabledIndex = displayed.findIndex(p => p.isDisabled === true);
          
          // If there are disabled promos, all promos before it should be enabled
          if (firstDisabledIndex > 0) {
            for (let i = 0; i < firstDisabledIndex; i++) {
              expect(displayed[i].isDisabled).not.toBe(true);
            }
          }
          
          // All promos after first disabled should also be disabled
          if (firstDisabledIndex >= 0) {
            for (let i = firstDisabledIndex; i < displayed.length; i++) {
              expect(displayed[i].isDisabled).toBe(true);
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('sorting is stable - available promos appear before disabled in default data', () => {
    // Test with the component's default promos
    const foodDisplayed = component.getDisplayedPromos('food');
    const deliveryDisplayed = component.getDisplayedPromos('delivery');
    
    // Check food promos sorting
    let foundDisabledFood = false;
    for (const promo of foodDisplayed) {
      if (promo.isDisabled === true) {
        foundDisabledFood = true;
      } else if (foundDisabledFood) {
        fail('Found available food promo after disabled promo');
      }
    }
    
    // Check delivery promos sorting
    let foundDisabledDelivery = false;
    for (const promo of deliveryDisplayed) {
      if (promo.isDisabled === true) {
        foundDisabledDelivery = true;
      } else if (foundDisabledDelivery) {
        fail('Found available delivery promo after disabled promo');
      }
    }
    
    expect(true).toBe(true); // Ensure at least one expectation
  });

  it('no disabled promo appears before an available promo', () => {
    fc.assert(
      fc.property(
        fc.array(promoCodeArbitrary, { minLength: 2, maxLength: 20 }),
        (promos) => {
          // Create food promos with mixed disabled states
          const foodPromos = promos.map((p, i) => ({ 
            ...p, 
            id: `food-${i}`,
            category: 'food' as const
          }));
          
          // Set the promos on the component and clear search
          component.promoCodes = foodPromos;
          component.searchTerm.set('');
          
          // Get displayed promos
          const displayed = component.getDisplayedPromos('food');
          
          // Check that no disabled promo appears before an available one
          let foundDisabled = false;
          for (const promo of displayed) {
            if (promo.isDisabled === true) {
              foundDisabled = true;
            } else if (foundDisabled) {
              // Found an available promo after a disabled one - this is wrong
              fail('Found available promo after disabled promo');
            }
          }
          
          expect(true).toBe(true); // Ensure at least one expectation
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('foodPromoCodes computed property maintains sorting order', () => {
    fc.assert(
      fc.property(
        fc.array(promoCodeArbitrary, { minLength: 2, maxLength: 20 }),
        (promos) => {
          // Create food promos with mixed disabled states
          const foodPromos = promos.map((p, i) => ({ 
            ...p, 
            id: `food-${i}`,
            category: 'food' as const,
            isDisabled: i % 3 === 0 // Every third promo is disabled
          }));
          
          // Set the promos on the component and clear search
          component.promoCodes = foodPromos;
          component.searchTerm.set('');
          
          // Access computed property
          const displayed = component.foodPromoCodes();
          
          // Check sorting order
          let foundDisabled = false;
          for (const promo of displayed) {
            if (promo.isDisabled === true) {
              foundDisabled = true;
            } else if (foundDisabled) {
              fail('Found available promo after disabled promo in foodPromoCodes');
            }
          }
          
          expect(true).toBe(true); // Ensure at least one expectation
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('deliveryPromoCodes computed property maintains sorting order', () => {
    fc.assert(
      fc.property(
        fc.array(promoCodeArbitrary, { minLength: 2, maxLength: 20 }),
        (promos) => {
          // Create delivery promos with mixed disabled states
          const deliveryPromos = promos.map((p, i) => ({ 
            ...p, 
            id: `delivery-${i}`,
            category: 'delivery' as const,
            isDisabled: i % 3 === 0 // Every third promo is disabled
          }));
          
          // Set the promos on the component and clear search
          component.promoCodes = deliveryPromos;
          component.searchTerm.set('');
          
          // Access computed property
          const displayed = component.deliveryPromoCodes();
          
          // Check sorting order
          let foundDisabled = false;
          for (const promo of displayed) {
            if (promo.isDisabled === true) {
              foundDisabled = true;
            } else if (foundDisabled) {
              fail('Found available promo after disabled promo in deliveryPromoCodes');
            }
          }
          
          expect(true).toBe(true); // Ensure at least one expectation
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * **Feature: ui-ux-improvements-v2, Property 9: Maximum 2 promo codes selection**
 * **Validates: Requirements 5.7**
 * 
 * For any selection state, the user should not be able to select more than 2 promo codes (1 delivery + 1 product)
 */
describe('Property 9: Maximum 2 promo codes selection', () => {
  let component: PromoCodeModalComponent;
  let fixture: ComponentFixture<PromoCodeModalComponent>;

  // Arbitrary for generating valid PromoCode objects
  const promoCodeArbitrary = fc.record({
    id: fc.uuid(),
    code: fc.string({ minLength: 3, maxLength: 10 }).map(s => s.toUpperCase()),
    title: fc.string({ minLength: 5, maxLength: 50 }),
    description: fc.string({ minLength: 5, maxLength: 100 }),
    discount: fc.integer({ min: 1, max: 100 }),
    discountType: fc.constantFrom('percent', 'fixed') as fc.Arbitrary<'percent' | 'fixed'>,
    maxDiscount: fc.option(fc.integer({ min: 1000, max: 100000 }), { nil: undefined }),
    minOrderAmount: fc.integer({ min: 0, max: 500000 }),
    expiryDate: fc.date({ min: new Date(), max: new Date('2026-12-31') }),
    imageUrl: fc.option(fc.webUrl(), { nil: undefined }),
    category: fc.constantFrom('food', 'delivery', 'special') as fc.Arbitrary<'food' | 'delivery' | 'special'>,
    isDisabled: fc.boolean(),
    disabledReason: fc.option(fc.string({ minLength: 5, maxLength: 50 }), { nil: undefined }),
    conditions: fc.option(fc.array(fc.string({ minLength: 5, maxLength: 50 }), { minLength: 1, maxLength: 5 }), { nil: undefined })
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PromoCodeModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PromoCodeModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('canSelectPromo returns false when same type promo already selected', () => {
    fc.assert(
      fc.property(
        promoCodeArbitrary,
        promoCodeArbitrary,
        (promo1, promo2) => {
          // Force both promos to be enabled and same category (food)
          const foodPromo1: PromoCode = { ...promo1, id: 'food-1', isDisabled: false, category: 'food' };
          const foodPromo2: PromoCode = { ...promo2, id: 'food-2', isDisabled: false, category: 'food' };
          
          // Set up component with these promos
          component.promoCodes = [foodPromo1, foodPromo2];
          
          // Select first food promo
          component.selectedPromos.set(new Set([foodPromo1.id]));
          
          // canSelectPromo should return false for second food promo
          expect(component.canSelectPromo(foodPromo2)).toBe(false);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('canSelectPromo returns true when different type promo selected', () => {
    fc.assert(
      fc.property(
        promoCodeArbitrary,
        promoCodeArbitrary,
        (promo1, promo2) => {
          // Force promos to be enabled and different categories
          const foodPromo: PromoCode = { ...promo1, id: 'food-1', isDisabled: false, category: 'food' };
          const deliveryPromo: PromoCode = { ...promo2, id: 'delivery-1', isDisabled: false, category: 'delivery' };
          
          // Set up component with these promos
          component.promoCodes = [foodPromo, deliveryPromo];
          
          // Select food promo
          component.selectedPromos.set(new Set([foodPromo.id]));
          
          // canSelectPromo should return true for delivery promo
          expect(component.canSelectPromo(deliveryPromo)).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('maximum 2 promos can be selected (1 delivery + 1 product)', () => {
    fc.assert(
      fc.property(
        promoCodeArbitrary,
        promoCodeArbitrary,
        promoCodeArbitrary,
        (promo1, promo2, promo3) => {
          // Create one food, one delivery, and one more food promo
          const foodPromo1: PromoCode = { ...promo1, id: 'food-1', isDisabled: false, category: 'food' };
          const deliveryPromo: PromoCode = { ...promo2, id: 'delivery-1', isDisabled: false, category: 'delivery' };
          const foodPromo2: PromoCode = { ...promo3, id: 'food-2', isDisabled: false, category: 'food' };
          
          // Set up component with these promos
          component.promoCodes = [foodPromo1, deliveryPromo, foodPromo2];
          component.selectedPromos.set(new Set());
          
          // Select food promo
          component.togglePromo(foodPromo1);
          expect(component.selectedPromos().has(foodPromo1.id)).toBe(true);
          
          // Select delivery promo
          component.togglePromo(deliveryPromo);
          expect(component.selectedPromos().has(deliveryPromo.id)).toBe(true);
          
          // Now we have 2 promos selected (1 food + 1 delivery)
          expect(component.selectedPromos().size).toBe(2);
          
          // Try to select another food promo - should fail
          component.togglePromo(foodPromo2);
          expect(component.selectedPromos().has(foodPromo2.id)).toBe(false);
          
          // Total should still be 2
          expect(component.selectedPromos().size).toBe(2);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('cannot select more than 1 delivery promo', () => {
    fc.assert(
      fc.property(
        promoCodeArbitrary,
        promoCodeArbitrary,
        (promo1, promo2) => {
          // Force both promos to be enabled and delivery category
          const deliveryPromo1: PromoCode = { ...promo1, id: 'delivery-1', isDisabled: false, category: 'delivery' };
          const deliveryPromo2: PromoCode = { ...promo2, id: 'delivery-2', isDisabled: false, category: 'delivery' };
          
          // Set up component with these promos
          component.promoCodes = [deliveryPromo1, deliveryPromo2];
          component.selectedPromos.set(new Set());
          
          // Select first delivery promo
          component.togglePromo(deliveryPromo1);
          expect(component.selectedPromos().has(deliveryPromo1.id)).toBe(true);
          
          // Try to select second delivery promo - should fail
          component.togglePromo(deliveryPromo2);
          expect(component.selectedPromos().has(deliveryPromo2.id)).toBe(false);
          
          // Only first delivery promo should be selected
          expect(component.selectedPromos().size).toBe(1);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('cannot select more than 1 product promo (food or special)', () => {
    fc.assert(
      fc.property(
        promoCodeArbitrary,
        promoCodeArbitrary,
        promoCodeArbitrary,
        (promo1, promo2, promo3) => {
          // Create food, special, and another food promo
          const foodPromo: PromoCode = { ...promo1, id: 'food-1', isDisabled: false, category: 'food' };
          const specialPromo: PromoCode = { ...promo2, id: 'special-1', isDisabled: false, category: 'special' };
          const foodPromo2: PromoCode = { ...promo3, id: 'food-2', isDisabled: false, category: 'food' };
          
          // Set up component with these promos
          component.promoCodes = [foodPromo, specialPromo, foodPromo2];
          component.selectedPromos.set(new Set());
          
          // Select food promo
          component.togglePromo(foodPromo);
          expect(component.selectedPromos().has(foodPromo.id)).toBe(true);
          
          // Try to select special promo - should fail (same type category: product)
          component.togglePromo(specialPromo);
          expect(component.selectedPromos().has(specialPromo.id)).toBe(false);
          
          // Try to select another food promo - should also fail
          component.togglePromo(foodPromo2);
          expect(component.selectedPromos().has(foodPromo2.id)).toBe(false);
          
          // Only first food promo should be selected
          expect(component.selectedPromos().size).toBe(1);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('can deselect a promo and select another of same type', () => {
    fc.assert(
      fc.property(
        promoCodeArbitrary,
        promoCodeArbitrary,
        (promo1, promo2) => {
          // Force both promos to be enabled and same category
          const foodPromo1: PromoCode = { ...promo1, id: 'food-1', isDisabled: false, category: 'food' };
          const foodPromo2: PromoCode = { ...promo2, id: 'food-2', isDisabled: false, category: 'food' };
          
          // Set up component with these promos
          component.promoCodes = [foodPromo1, foodPromo2];
          component.selectedPromos.set(new Set());
          
          // Select first food promo
          component.togglePromo(foodPromo1);
          expect(component.selectedPromos().has(foodPromo1.id)).toBe(true);
          
          // Deselect first food promo
          component.togglePromo(foodPromo1);
          expect(component.selectedPromos().has(foodPromo1.id)).toBe(false);
          
          // Now can select second food promo
          component.togglePromo(foodPromo2);
          expect(component.selectedPromos().has(foodPromo2.id)).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('selection count never exceeds 2 regardless of toggle attempts', () => {
    fc.assert(
      fc.property(
        fc.array(promoCodeArbitrary, { minLength: 5, maxLength: 15 }),
        fc.array(fc.integer({ min: 0, max: 14 }), { minLength: 10, maxLength: 30 }),
        (promos, toggleIndices) => {
          // Create a mix of food and delivery promos, all enabled
          const testPromos = promos.map((p, i) => ({
            ...p,
            id: `promo-${i}`,
            isDisabled: false,
            category: (i % 3 === 0 ? 'delivery' : (i % 3 === 1 ? 'food' : 'special')) as 'food' | 'delivery' | 'special'
          }));
          
          // Set up component
          component.promoCodes = testPromos;
          component.selectedPromos.set(new Set());
          
          // Perform random toggles
          for (const index of toggleIndices) {
            const promoIndex = index % testPromos.length;
            component.togglePromo(testPromos[promoIndex]);
            
            // Selection count should never exceed 2
            expect(component.selectedPromos().size).toBeLessThanOrEqual(2);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('shows feedback message when selection limit reached', () => {
    fc.assert(
      fc.property(
        promoCodeArbitrary,
        promoCodeArbitrary,
        (promo1, promo2) => {
          // Force both promos to be enabled and same category
          const foodPromo1: PromoCode = { ...promo1, id: 'food-1', isDisabled: false, category: 'food' };
          const foodPromo2: PromoCode = { ...promo2, id: 'food-2', isDisabled: false, category: 'food' };
          
          // Set up component with these promos
          component.promoCodes = [foodPromo1, foodPromo2];
          component.selectedPromos.set(new Set());
          component.selectionLimitMessage.set(null);
          
          // Select first food promo
          component.togglePromo(foodPromo1);
          
          // Try to select second food promo - should show message
          component.togglePromo(foodPromo2);
          
          // Message should be set
          expect(component.selectionLimitMessage()).not.toBeNull();
          expect(component.selectionLimitMessage()).toContain('Đã chọn 1 mã');
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('getSelectionBlockReason returns correct message for same type limit', () => {
    fc.assert(
      fc.property(
        promoCodeArbitrary,
        promoCodeArbitrary,
        (promo1, promo2) => {
          // Test with food promos
          const foodPromo1: PromoCode = { ...promo1, id: 'food-1', isDisabled: false, category: 'food' };
          const foodPromo2: PromoCode = { ...promo2, id: 'food-2', isDisabled: false, category: 'food' };
          
          component.promoCodes = [foodPromo1, foodPromo2];
          component.selectedPromos.set(new Set([foodPromo1.id]));
          
          const reason = component.getSelectionBlockReason(foodPromo2);
          expect(reason).not.toBeNull();
          expect(reason).toContain('sản phẩm');
          
          // Test with delivery promos
          const deliveryPromo1: PromoCode = { ...promo1, id: 'delivery-1', isDisabled: false, category: 'delivery' };
          const deliveryPromo2: PromoCode = { ...promo2, id: 'delivery-2', isDisabled: false, category: 'delivery' };
          
          component.promoCodes = [deliveryPromo1, deliveryPromo2];
          component.selectedPromos.set(new Set([deliveryPromo1.id]));
          
          const deliveryReason = component.getSelectionBlockReason(deliveryPromo2);
          expect(deliveryReason).not.toBeNull();
          expect(deliveryReason).toContain('giao hàng');
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

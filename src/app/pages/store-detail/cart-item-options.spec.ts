import { TestBed, ComponentFixture } from '@angular/core/testing';
import { StoreDetailComponent } from './store-detail.component';
import { ActivatedRoute } from '@angular/router';
import * as fc from 'fast-check';

/**
 * Property 4: Cart item option display
 * Feature: ui-ux-improvements, Property 4: Cart item option display
 * Validates: Requirements 5.1, 5.2, 5.3
 * 
 * For any cart item with selected customization options, the displayed options 
 * string should include all selected option names and their price modifiers 
 * (if non-zero)
 */
describe('Property 4: Cart item option display', () => {
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

  it('should format cart item options with all selected option names', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...component.products().filter(p => p.customizationGroups && p.customizationGroups.length > 0)),
        (product) => {
          if (!product.customizationGroups || product.customizationGroups.length === 0) {
            return;
          }

          const testFixture = TestBed.createComponent(StoreDetailComponent);
          const testComponent = testFixture.componentInstance;
          testFixture.detectChanges();

          // Create selected options - select first option from each group
          const selectedOptions = new Map<string, string>();
          const expectedOptionNames: string[] = [];

          product.customizationGroups.forEach(group => {
            if (group.options.length > 0) {
              const selectedOption = group.options[0];
              selectedOptions.set(group.id, selectedOption.id);
              expectedOptionNames.push(selectedOption.name);
            }
          });

          const cartItem = {
            product: product,
            quantity: 1,
            note: undefined,
            selectedOptions: selectedOptions
          };

          // Requirement 5.1: Format options for display
          const formattedOptions = testComponent.formatCartItemOptions(cartItem);

          // Requirement 5.1: All selected option names should be in the formatted string
          expectedOptionNames.forEach(optionName => {
            expect(formattedOptions).toContain(optionName);
          });

          testFixture.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display price modifiers next to option names when non-zero', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...component.products().filter(p => p.customizationGroups && p.customizationGroups.length > 0)),
        (product) => {
          if (!product.customizationGroups || product.customizationGroups.length === 0) {
            return;
          }

          const testFixture = TestBed.createComponent(StoreDetailComponent);
          const testComponent = testFixture.componentInstance;
          testFixture.detectChanges();

          // Find options with price modifiers
          const selectedOptions = new Map<string, string>();
          const optionsWithModifiers: Array<{ name: string; modifier: number }> = [];

          product.customizationGroups.forEach(group => {
            // Find option with highest price modifier in this group
            const optionWithModifier = group.options.reduce((max, opt) => 
              opt.priceModifier > max.priceModifier ? opt : max
            );

            if (optionWithModifier.priceModifier > 0) {
              selectedOptions.set(group.id, optionWithModifier.id);
              optionsWithModifiers.push({
                name: optionWithModifier.name,
                modifier: optionWithModifier.priceModifier
              });
            }
          });

          if (optionsWithModifiers.length === 0) {
            testFixture.destroy();
            return; // Skip if no options with modifiers
          }

          const cartItem = {
            product: product,
            quantity: 1,
            note: undefined,
            selectedOptions: selectedOptions
          };

          // Requirement 5.2: Format options with price modifiers
          const formattedOptions = testComponent.formatCartItemOptions(cartItem);

          // Requirement 5.2: Price modifiers should be displayed next to option names
          optionsWithModifiers.forEach(option => {
            expect(formattedOptions).toContain(option.name);
            // Check for price modifier format: (+X,XXXđ)
            const formattedModifier = `(+${option.modifier.toLocaleString()}đ)`;
            expect(formattedOptions).toContain(formattedModifier);
          });

          testFixture.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not display price modifier when it is zero', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...component.products().filter(p => p.customizationGroups && p.customizationGroups.length > 0)),
        (product) => {
          if (!product.customizationGroups || product.customizationGroups.length === 0) {
            return;
          }

          const testFixture = TestBed.createComponent(StoreDetailComponent);
          const testComponent = testFixture.componentInstance;
          testFixture.detectChanges();

          // Find options with zero price modifier
          const selectedOptions = new Map<string, string>();
          const optionsWithZeroModifier: string[] = [];

          product.customizationGroups.forEach(group => {
            const zeroModifierOption = group.options.find(opt => opt.priceModifier === 0);
            if (zeroModifierOption) {
              selectedOptions.set(group.id, zeroModifierOption.id);
              optionsWithZeroModifier.push(zeroModifierOption.name);
            }
          });

          if (optionsWithZeroModifier.length === 0) {
            testFixture.destroy();
            return; // Skip if no options with zero modifier
          }

          const cartItem = {
            product: product,
            quantity: 1,
            note: undefined,
            selectedOptions: selectedOptions
          };

          // Format options
          const formattedOptions = testComponent.formatCartItemOptions(cartItem);

          // Requirement 5.2: Options with zero modifier should not show price
          optionsWithZeroModifier.forEach(optionName => {
            expect(formattedOptions).toContain(optionName);
            // Should not contain (+0đ) or similar
            const optionIndex = formattedOptions.indexOf(optionName);
            const afterOption = formattedOptions.substring(optionIndex + optionName.length, optionIndex + optionName.length + 10);
            expect(afterOption).not.toContain('(+0');
          });

          testFixture.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should format multiple options as comma-separated list', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...component.products().filter(p => p.customizationGroups && p.customizationGroups.length >= 2)),
        (product) => {
          if (!product.customizationGroups || product.customizationGroups.length < 2) {
            return;
          }

          const testFixture = TestBed.createComponent(StoreDetailComponent);
          const testComponent = testFixture.componentInstance;
          testFixture.detectChanges();

          // Select options from multiple groups
          const selectedOptions = new Map<string, string>();
          const selectedOptionNames: string[] = [];

          product.customizationGroups.forEach(group => {
            if (group.options.length > 0) {
              const option = group.options[0];
              selectedOptions.set(group.id, option.id);
              selectedOptionNames.push(option.name);
            }
          });

          if (selectedOptionNames.length < 2) {
            testFixture.destroy();
            return;
          }

          const cartItem = {
            product: product,
            quantity: 1,
            note: undefined,
            selectedOptions: selectedOptions
          };

          // Requirement 5.3: Format as comma-separated list
          const formattedOptions = testComponent.formatCartItemOptions(cartItem);

          // Should contain commas separating options
          const commaCount = (formattedOptions.match(/,/g) || []).length;
          expect(commaCount).toBeGreaterThanOrEqual(selectedOptionNames.length - 1);

          // All option names should be present
          selectedOptionNames.forEach(name => {
            expect(formattedOptions).toContain(name);
          });

          testFixture.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return empty string when no options are selected', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...component.products()),
        (product) => {
          const testFixture = TestBed.createComponent(StoreDetailComponent);
          const testComponent = testFixture.componentInstance;
          testFixture.detectChanges();

          const cartItem = {
            product: product,
            quantity: 1,
            note: undefined,
            selectedOptions: new Map<string, string>() // Empty options
          };

          // Should return empty string when no options
          const formattedOptions = testComponent.formatCartItemOptions(cartItem);
          expect(formattedOptions).toBe('');

          testFixture.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return empty string when product has no customization groups', () => {
    const productsWithoutCustomization = component.products().filter(p => !p.customizationGroups || p.customizationGroups.length === 0);
    
    if (productsWithoutCustomization.length === 0) {
      // Skip test if all products have customization groups
      expect(true).toBe(true);
      return;
    }

    fc.assert(
      fc.property(
        fc.constantFrom(...productsWithoutCustomization),
        (product) => {
          if (product.customizationGroups && product.customizationGroups.length > 0) {
            return; // Skip products with customization groups
          }

          const testFixture = TestBed.createComponent(StoreDetailComponent);
          const testComponent = testFixture.componentInstance;
          testFixture.detectChanges();

          const cartItem = {
            product: product,
            quantity: 1,
            note: undefined,
            selectedOptions: new Map<string, string>()
          };

          // Should return empty string when product has no customization groups
          const formattedOptions = testComponent.formatCartItemOptions(cartItem);
          expect(formattedOptions).toBe('');

          testFixture.destroy();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle cart items with all possible option combinations', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...component.products().filter(p => p.customizationGroups && p.customizationGroups.length > 0)),
        fc.integer({ min: 0, max: 10 }), // Random seed for option selection
        (product, seed) => {
          if (!product.customizationGroups || product.customizationGroups.length === 0) {
            return;
          }

          const testFixture = TestBed.createComponent(StoreDetailComponent);
          const testComponent = testFixture.componentInstance;
          testFixture.detectChanges();

          // Select random options from each group
          const selectedOptions = new Map<string, string>();
          const expectedContent: string[] = [];

          product.customizationGroups.forEach((group, groupIndex) => {
            if (group.options.length > 0) {
              const optionIndex = (seed + groupIndex) % group.options.length;
              const option = group.options[optionIndex];
              selectedOptions.set(group.id, option.id);

              let expectedText = option.name;
              if (option.priceModifier > 0) {
                expectedText += ` (+${option.priceModifier.toLocaleString()}đ)`;
              }
              expectedContent.push(expectedText);
            }
          });

          const cartItem = {
            product: product,
            quantity: 1,
            note: undefined,
            selectedOptions: selectedOptions
          };

          const formattedOptions = testComponent.formatCartItemOptions(cartItem);

          // All expected content should be in the formatted string
          expectedContent.forEach(content => {
            expect(formattedOptions).toContain(content);
          });

          testFixture.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should format price modifiers with thousand separators', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...component.products().filter(p => p.customizationGroups && p.customizationGroups.length > 0)),
        (product) => {
          if (!product.customizationGroups || product.customizationGroups.length === 0) {
            return;
          }

          const testFixture = TestBed.createComponent(StoreDetailComponent);
          const testComponent = testFixture.componentInstance;
          testFixture.detectChanges();

          // Find option with price modifier >= 1000
          let foundLargeModifier = false;
          const selectedOptions = new Map<string, string>();

          product.customizationGroups.forEach(group => {
            const largeModifierOption = group.options.find(opt => opt.priceModifier >= 1000);
            if (largeModifierOption) {
              selectedOptions.set(group.id, largeModifierOption.id);
              foundLargeModifier = true;
            }
          });

          if (!foundLargeModifier) {
            testFixture.destroy();
            return;
          }

          const cartItem = {
            product: product,
            quantity: 1,
            note: undefined,
            selectedOptions: selectedOptions
          };

          const formattedOptions = testComponent.formatCartItemOptions(cartItem);

          // Should contain formatted number with thousand separator
          // JavaScript's toLocaleString() uses period (.) as thousand separator in some locales
          // For example: 10.000 instead of 10000
          expect(formattedOptions).toMatch(/\d{1,3}([.,]\d{3})+đ/);

          testFixture.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle edge case: single option selected', () => {
    const productsWithOptions = component.products().filter(p => p.customizationGroups && p.customizationGroups.length > 0);
    
    if (productsWithOptions.length > 0) {
      const product = productsWithOptions[0];
      const firstGroup = product.customizationGroups![0];
      const firstOption = firstGroup.options[0];

      const selectedOptions = new Map<string, string>();
      selectedOptions.set(firstGroup.id, firstOption.id);

      const cartItem = {
        product: product,
        quantity: 1,
        note: undefined,
        selectedOptions: selectedOptions
      };

      const formattedOptions = component.formatCartItemOptions(cartItem);

      // Should contain the option name
      expect(formattedOptions).toContain(firstOption.name);

      // Should not contain comma (only one option)
      if (product.customizationGroups!.length === 1) {
        expect(formattedOptions).not.toContain(',');
      }
    }
  });

  it('should handle edge case: option with maximum price modifier', () => {
    const productsWithOptions = component.products().filter(p => p.customizationGroups && p.customizationGroups.length > 0);
    
    if (productsWithOptions.length > 0) {
      const product = productsWithOptions[0];
      
      // Find option with highest price modifier
      let maxModifier = 0;
      let maxOption: any = null;
      let maxGroupId = '';

      product.customizationGroups!.forEach(group => {
        group.options.forEach(option => {
          if (option.priceModifier > maxModifier) {
            maxModifier = option.priceModifier;
            maxOption = option;
            maxGroupId = group.id;
          }
        });
      });

      if (maxOption && maxModifier > 0) {
        const selectedOptions = new Map<string, string>();
        selectedOptions.set(maxGroupId, maxOption.id);

        const cartItem = {
          product: product,
          quantity: 1,
          note: undefined,
          selectedOptions: selectedOptions
        };

        const formattedOptions = component.formatCartItemOptions(cartItem);

        // Should contain option name and formatted price
        expect(formattedOptions).toContain(maxOption.name);
        expect(formattedOptions).toContain(`(+${maxModifier.toLocaleString()}đ)`);
      }
    }
  });

  it('should maintain consistent formatting across multiple calls', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...component.products().filter(p => p.customizationGroups && p.customizationGroups.length > 0)),
        (product) => {
          if (!product.customizationGroups || product.customizationGroups.length === 0) {
            return;
          }

          const testFixture = TestBed.createComponent(StoreDetailComponent);
          const testComponent = testFixture.componentInstance;
          testFixture.detectChanges();

          const selectedOptions = new Map<string, string>();
          product.customizationGroups.forEach(group => {
            if (group.options.length > 0) {
              selectedOptions.set(group.id, group.options[0].id);
            }
          });

          const cartItem = {
            product: product,
            quantity: 1,
            note: undefined,
            selectedOptions: selectedOptions
          };

          // Call formatCartItemOptions multiple times
          const result1 = testComponent.formatCartItemOptions(cartItem);
          const result2 = testComponent.formatCartItemOptions(cartItem);
          const result3 = testComponent.formatCartItemOptions(cartItem);

          // Results should be identical
          expect(result1).toBe(result2);
          expect(result2).toBe(result3);

          testFixture.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });
});

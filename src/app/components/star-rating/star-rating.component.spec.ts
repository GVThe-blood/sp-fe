import { TestBed, ComponentFixture } from '@angular/core/testing';
import { StarRatingComponent } from './star-rating.component';
import * as fc from 'fast-check';

describe('StarRatingComponent', () => {
  let component: StarRatingComponent;
  let fixture: ComponentFixture<StarRatingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StarRatingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StarRatingComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  /**
   * Property 1: Star rating completeness and proportionality
   * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
   * 
   * For any rating value between 0 and 5, the StarRatingComponent should render 
   * exactly 5 star icons where the total filled area (in yellow) corresponds 
   * proportionally to the rating value, with unfilled areas in gray, and the 
   * numeric rating displayed beside the stars
   */
  describe('Property 1: Star rating completeness and proportionality', () => {
    it('should render exactly 5 stars for any rating between 0 and 5', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 5, noNaN: true }),
          (rating) => {
            const testFixture = TestBed.createComponent(StarRatingComponent);
            const testComponent = testFixture.componentInstance;
            
            testComponent.rating = rating;
            testFixture.detectChanges();

            const compiled = testFixture.nativeElement as HTMLElement;
            const starContainers = compiled.querySelectorAll('.relative');
            
            // Requirement 2.1: Should render exactly 5 star icons
            expect(starContainers.length).toBe(5);
            
            testFixture.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should fill stars proportionally to the rating value', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 5, noNaN: true }),
          (rating) => {
            const testFixture = TestBed.createComponent(StarRatingComponent);
            const testComponent = testFixture.componentInstance;
            
            testComponent.rating = rating;
            testFixture.detectChanges();

            // Calculate expected fill percentages for each star
            for (let i = 0; i < 5; i++) {
              const expectedFill = Math.max(0, Math.min(1, rating - i)) * 100;
              const actualFill = testComponent.getStarFillPercentage(i);
              
              // Requirement 2.2: Stars should be filled proportionally
              expect(actualFill).toBe(expectedFill);
            }
            
            testFixture.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should display filled stars in yellow and empty portions in gray', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 5, noNaN: true }),
          (rating) => {
            const testFixture = TestBed.createComponent(StarRatingComponent);
            const testComponent = testFixture.componentInstance;
            
            testComponent.rating = rating;
            testFixture.detectChanges();

            const compiled = testFixture.nativeElement as HTMLElement;
            const starContainers = compiled.querySelectorAll('.relative');

            starContainers.forEach((container, index) => {
              const grayStar = container.querySelector('.text-gray-300');
              const yellowStar = container.querySelector('.text-yellow-400');

              // Requirement 2.3, 2.4, 2.5: Yellow for filled, gray for empty
              expect(grayStar).toBeTruthy();
              expect(yellowStar).toBeTruthy();
            });
            
            testFixture.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should display numeric rating when showNumber is true', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 5, noNaN: true }),
          (rating) => {
            // Create a fresh fixture for each test run to avoid state pollution
            const testFixture = TestBed.createComponent(StarRatingComponent);
            const testComponent = testFixture.componentInstance;
            
            testComponent.rating = rating;
            testComponent.showNumber = true;
            testFixture.detectChanges();

            const compiled = testFixture.nativeElement as HTMLElement;
            const ratingText = compiled.querySelector('span');

            // Requirement 2.6: Should display numeric rating
            expect(ratingText).toBeTruthy();
            expect(ratingText?.textContent).toContain(rating.toFixed(1));
            
            testFixture.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not display numeric rating when showNumber is false', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 5, noNaN: true }),
          (rating) => {
            const testFixture = TestBed.createComponent(StarRatingComponent);
            const testComponent = testFixture.componentInstance;
            
            testComponent.rating = rating;
            testComponent.showNumber = false;
            testFixture.detectChanges();

            const compiled = testFixture.nativeElement as HTMLElement;
            const ratingText = compiled.querySelector('span');

            // Should not display numeric rating when showNumber is false
            expect(ratingText).toBeFalsy();
            
            testFixture.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle edge cases: rating 0 means all stars empty', () => {
      component.rating = 0;
      fixture.detectChanges();

      for (let i = 0; i < 5; i++) {
        const fillPercentage = component.getStarFillPercentage(i);
        expect(fillPercentage).toBe(0);
      }
    });

    it('should handle edge cases: rating 5 means all stars filled', () => {
      component.rating = 5;
      fixture.detectChanges();

      for (let i = 0; i < 5; i++) {
        const fillPercentage = component.getStarFillPercentage(i);
        expect(fillPercentage).toBe(100);
      }
    });

    it('should handle partial fills correctly', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 5, noNaN: true }),
          (rating) => {
            const testFixture = TestBed.createComponent(StarRatingComponent);
            const testComponent = testFixture.componentInstance;
            
            testComponent.rating = rating;
            testFixture.detectChanges();

            // Calculate total fill across all stars
            let totalFill = 0;
            for (let i = 0; i < 5; i++) {
              totalFill += testComponent.getStarFillPercentage(i);
            }

            // Total fill should equal rating * 100 (since each star is 100% when full)
            const expectedTotalFill = rating * 100;
            expect(Math.abs(totalFill - expectedTotalFill)).toBeLessThan(0.01);
            
            testFixture.destroy();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Size variants', () => {
    it('should apply correct size classes', () => {
      const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg'];
      const expectedClasses = {
        'sm': 'w-3 h-3',
        'md': 'w-4 h-4',
        'lg': 'w-5 h-5'
      };

      sizes.forEach(size => {
        component.size = size;
        expect(component.sizeClass).toBe(expectedClasses[size]);
      });
    });
  });
});

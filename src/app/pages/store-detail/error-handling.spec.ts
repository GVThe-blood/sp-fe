import { TestBed, ComponentFixture } from '@angular/core/testing';
import { StoreDetailComponent } from './store-detail.component';
import { ActivatedRoute } from '@angular/router';

describe('StoreDetailComponent - Error Handling (Task 14)', () => {
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

  describe('Image Error Handling', () => {
    it('should have onBannerImageError method', () => {
      expect(component.onBannerImageError).toBeDefined();
      expect(typeof component.onBannerImageError).toBe('function');
    });

    it('should have onProductImageError method', () => {
      expect(component.onProductImageError).toBeDefined();
      expect(typeof component.onProductImageError).toBe('function');
    });

    it('should set fallback image when banner image fails to load', () => {
      const mockImg = document.createElement('img');
      mockImg.src = 'https://invalid-url.com/image.jpg';
      
      const event = new Event('error');
      Object.defineProperty(event, 'target', { value: mockImg, enumerable: true });
      
      component.onBannerImageError(event);
      
      // Should set to fallback image (SVG data URL)
      expect(mockImg.src).toContain('data:image/svg+xml');
      expect(mockImg.src).toContain('Store Banner');
    });

    it('should set fallback image when product image fails to load', () => {
      const mockImg = document.createElement('img');
      mockImg.src = 'https://invalid-url.com/product.jpg';
      
      const event = new Event('error');
      Object.defineProperty(event, 'target', { value: mockImg, enumerable: true });
      
      component.onProductImageError(event);
      
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
      component.onProductImageError(event);
      
      // Should not change the src (prevents infinite loop)
      expect(mockImg.src).toBe(fallbackUrl);
    });
  });
});

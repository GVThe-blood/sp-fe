import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductDetailModalComponent } from './product-detail-modal.component';

describe('ProductDetailModalComponent - Responsive Design', () => {
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
    description: 'Test description',
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
      }
    ]
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductDetailModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductDetailModalComponent);
    component = fixture.componentInstance;
    component.product = mockProduct;
    component.isOpen = true;
    fixture.detectChanges();
  });

  describe('Mobile Responsive Design (below 768px)', () => {
    beforeEach(() => {
      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });
      window.dispatchEvent(new Event('resize'));
    });

    it('should render modal when open on mobile', () => {
      const modalOverlay = fixture.nativeElement.querySelector('.modal-overlay');
      expect(modalOverlay).toBeTruthy();
    });

    it('should have modal content with proper mobile classes', () => {
      const modalContent = fixture.nativeElement.querySelector('.modal-content');
      expect(modalContent).toBeTruthy();
      expect(modalContent.classList.contains('bg-white')).toBe(true);
      expect(modalContent.classList.contains('w-full')).toBe(true);
    });

    it('should display product image on mobile', () => {
      const productImage = fixture.nativeElement.querySelector('img[alt="Test Product"]');
      expect(productImage).toBeTruthy();
      expect(productImage.src).toContain('test.jpg');
    });

    it('should display product details on mobile', () => {
      const productName = fixture.nativeElement.querySelector('h2');
      expect(productName?.textContent).toContain('Test Product');
    });

    it('should display customization options on mobile', () => {
      const customizationGroup = fixture.nativeElement.querySelector('h3');
      expect(customizationGroup?.textContent).toContain('Size');
    });

    it('should display quantity controls on mobile', () => {
      const quantityButtons = fixture.nativeElement.querySelectorAll('button');
      expect(quantityButtons.length).toBeGreaterThan(0);
    });

    it('should display add to cart button on mobile', () => {
      // Find the add to cart button by its text content
      const buttons = fixture.nativeElement.querySelectorAll('button');
      const addToCartButton = Array.from(buttons).find((btn: any) => 
        btn.textContent?.includes('Thêm vào giỏ')
      ) as HTMLElement;
      expect(addToCartButton).toBeTruthy();
      expect(addToCartButton.textContent).toContain('Thêm vào giỏ');
    });

    it('should have scrollable content on mobile', () => {
      const modalContent = fixture.nativeElement.querySelector('.modal-content');
      const computedStyle = window.getComputedStyle(modalContent);
      // Modal content should allow scrolling
      expect(['auto', 'scroll']).toContain(computedStyle.overflowY);
    });
  });

  describe('Desktop Responsive Design (768px and above)', () => {
    beforeEach(() => {
      // Simulate desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024
      });
      window.dispatchEvent(new Event('resize'));
    });

    it('should render modal when open on desktop', () => {
      const modalOverlay = fixture.nativeElement.querySelector('.modal-overlay');
      expect(modalOverlay).toBeTruthy();
    });

    it('should have modal content with proper desktop classes', () => {
      const modalContent = fixture.nativeElement.querySelector('.modal-content');
      expect(modalContent).toBeTruthy();
      expect(modalContent.classList.contains('bg-white')).toBe(true);
      expect(modalContent.classList.contains('w-full')).toBe(true);
    });

    it('should display product image on desktop', () => {
      const productImage = fixture.nativeElement.querySelector('img[alt="Test Product"]');
      expect(productImage).toBeTruthy();
    });

    it('should display product details on desktop', () => {
      const productName = fixture.nativeElement.querySelector('h2');
      expect(productName?.textContent).toContain('Test Product');
    });

    it('should display customization options on desktop', () => {
      const customizationGroup = fixture.nativeElement.querySelector('h3');
      expect(customizationGroup?.textContent).toContain('Size');
    });

    it('should have scrollable content on desktop', () => {
      const modalContent = fixture.nativeElement.querySelector('.modal-content');
      const computedStyle = window.getComputedStyle(modalContent);
      // Modal content should allow scrolling
      expect(['auto', 'scroll']).toContain(computedStyle.overflowY);
    });
  });

  describe('Modal Overlay Behavior', () => {
    it('should close modal when clicking overlay', (done) => {
      spyOn(component.close, 'emit');
      const modalOverlay = fixture.nativeElement.querySelector('.modal-overlay');
      modalOverlay.click();
      
      // Wait for animation
      setTimeout(() => {
        expect(component.close.emit).toHaveBeenCalled();
        done();
      }, 350);
    });

    it('should not close modal when clicking modal content', () => {
      spyOn(component.close, 'emit');
      const modalContent = fixture.nativeElement.querySelector('.modal-content');
      modalContent.click();
      
      // Should not close immediately
      expect(component.close.emit).not.toHaveBeenCalled();
    });
  });

  describe('Content Scrollability', () => {
    it('should allow scrolling when content exceeds viewport height', () => {
      const modalContent = fixture.nativeElement.querySelector('.modal-content');
      expect(modalContent).toBeTruthy();
      
      // Check if overflow is set to allow scrolling
      const computedStyle = window.getComputedStyle(modalContent);
      expect(['auto', 'scroll']).toContain(computedStyle.overflowY);
    });

    it('should have proper scroll behavior', () => {
      const modalContent = fixture.nativeElement.querySelector('.modal-content');
      const computedStyle = window.getComputedStyle(modalContent);
      expect(computedStyle.scrollBehavior).toBe('smooth');
    });
  });

  describe('Close Button', () => {
    it('should display close button', () => {
      // Close button uses modal-close-btn class
      const closeButton = fixture.nativeElement.querySelector('button.modal-close-btn');
      expect(closeButton).toBeTruthy();
    });

    it('should close modal when close button is clicked', (done) => {
      spyOn(component.close, 'emit');
      // Close button uses modal-close-btn class
      const closeButton = fixture.nativeElement.querySelector('button.modal-close-btn');
      closeButton.click();
      
      // Wait for animation
      setTimeout(() => {
        expect(component.close.emit).toHaveBeenCalled();
        done();
      }, 350);
    });
  });

  describe('Responsive Image Sizing', () => {
    it('should have appropriate image height on mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });
      window.dispatchEvent(new Event('resize'));
      fixture.detectChanges();

      const imageContainer = fixture.nativeElement.querySelector('div.relative.w-full');
      expect(imageContainer).toBeTruthy();
      expect(imageContainer.classList.contains('h-64')).toBe(true);
    });

    it('should have appropriate image height on desktop', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024
      });
      window.dispatchEvent(new Event('resize'));
      fixture.detectChanges();

      const imageContainer = fixture.nativeElement.querySelector('div.relative.w-full');
      expect(imageContainer).toBeTruthy();
      // Should have md:h-72 class for desktop
      expect(imageContainer.classList.contains('md:h-72')).toBe(true);
    });
  });

  describe('Responsive Padding', () => {
    it('should have appropriate padding on mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });
      window.dispatchEvent(new Event('resize'));
      fixture.detectChanges();

      const productDetails = fixture.nativeElement.querySelector('div.p-4');
      expect(productDetails).toBeTruthy();
    });

    it('should have appropriate padding on desktop', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024
      });
      window.dispatchEvent(new Event('resize'));
      fixture.detectChanges();

      const productDetails = fixture.nativeElement.querySelector('div.md\\:p-6');
      expect(productDetails).toBeTruthy();
    });
  });
});

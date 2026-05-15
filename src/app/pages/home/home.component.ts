import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { HotToastService } from '@ngxpert/hot-toast';
import { ColorRibbonComponent } from '../../components/color-ribbon/color-ribbon.component';
import { HeroCarouselComponent } from '../../components/hero-carousel/hero-carousel.component';
import { FeaturedProductsComponent } from '../../components/featured-products/featured-products.component';
import { FeaturedShopsComponent } from '../../components/featured-shops/featured-shops.component';
import { ProductDetailModalComponent } from '../../components/product-detail-modal/product-detail-modal.component';
import { FloatingCartButtonComponent } from '../../components/floating-cart-button/floating-cart-button.component';
import { ProductItem } from '../../components/product-item/product-item.component';
import { CartService, Product, CartItem, CustomizationGroup } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';

interface Category {
  id: number;
  name: string;
  icon: string;
  iconFill: boolean;
}

/**
 * HomeComponent - Main homepage container
 * 
 * Orchestrates homepage sections based on Stitch design:
 * - Hero Carousel (auto-rotating banners with flash sale, promotions, announcements)
 * - Category Chips
 * - Delivery Location Bar
 * - Featured Products section
 * - Featured Shops section
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.7, 3.8
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    ColorRibbonComponent,
    HeroCarouselComponent,
    FeaturedProductsComponent,
    FeaturedShopsComponent,
    ProductDetailModalComponent,
    FloatingCartButtonComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
  private toast = inject(HotToastService);
  private translate = inject(TranslateService);
  private cartService = inject(CartService);
  private productService = inject(ProductService);
  
  // Delivery address
  deliveryAddress = signal('123 Nguyễn Văn Linh, Quận 7, TP.HCM');

  // Categories for chips
  categories = signal<Category[]>([
    { id: 1, name: 'Món Chính', icon: 'restaurant', iconFill: true },
    { id: 2, name: 'Đồ Uống', icon: 'local_cafe', iconFill: false },
    { id: 3, name: 'Tráng Miệng', icon: 'cake', iconFill: false },
    { id: 4, name: 'Ăn Vặt', icon: 'tapas', iconFill: false },
    { id: 5, name: 'Đồ Chay', icon: 'eco', iconFill: false },
  ]);

  activeCategoryId = signal(1);
  
  // Scroll state for categories
  canScrollLeft = signal(false);
  canScrollRight = signal(false);
  
  // Modal state
  selectedProduct = signal<Product | null>(null);
  isModalOpen = signal<boolean>(false);
  editingCartItem = signal<{item: CartItem, index: number} | null>(null);
  
  setActiveCategory(id: number) {
    this.activeCategoryId.set(id);
  }
  
  /**
   * Handle product click - open product detail modal
   */
  onProductClick(product: ProductItem): void {
    // Fetch full product detail when clicking on product
    this.productService.getProductById(product.id).subscribe({
      next: (response) => {
        const detailProduct = this.mapApiProductToModalProduct(response.data, product);
        this.openProductModal(detailProduct);
      },
      error: (error) => {
        console.error('Error loading product detail:', error);
        this.openProductModal(this.mapProductItemToProduct(product));
      }
    });
  }
  
  /**
   * Handle add to cart click - fetch product detail then open modal
   */
  onAddToCartClick(product: ProductItem): void {
    // Fetch product detail from API
    this.productService.getProductById(product.id).subscribe({
      next: (response) => {
        const detailProduct = this.mapApiProductToModalProduct(response.data, product);
        this.openProductModal(detailProduct);
      },
      error: (error) => {
        console.error('Error loading product detail:', error);
        // Fallback to basic product info
        this.openProductModal(this.mapProductItemToProduct(product));
      }
    });
  }
  
  /**
   * Map ProductItem to Product (fallback when API fails)
   */
  private mapProductItemToProduct(item: ProductItem): Product {
    return {
      id: item.id,
      name: item.name,
      price: item.price,
      originalPrice: item.originalPrice,
      image: item.image,
      sold: item.sold || 0,
      rating: item.rating,
      isSoldOut: item.isSoldOut || false,
      description: item.description,
      shopName: item.shopName,
      customizationGroups: this.generateMockCustomizationGroups({})
    };
  }
  
  /**
   * Map API Product response to modal Product with customization groups
   */
  private mapApiProductToModalProduct(apiProduct: any, originalItem: ProductItem): Product {
    // Parse images
    const images = this.productService.parseImages(apiProduct.images);
    const firstImage = images.length > 0 ? images[0] : originalItem.image;
    
    // TODO: Load customization groups from API when available
    // For now, generate mock customization groups based on product type
    const customizationGroups = this.generateMockCustomizationGroups(apiProduct);
    
    return {
      id: apiProduct.id,
      name: apiProduct.name,
      price: parseFloat(apiProduct.price),
      originalPrice: originalItem.originalPrice,
      image: firstImage,
      sold: originalItem.sold || 0,
      rating: apiProduct.averageRating || originalItem.rating,
      isSoldOut: apiProduct.quantity === 0,
      description: apiProduct.description,
      shopName: originalItem.shopName,
      customizationGroups: customizationGroups
    };
  }
  
  /**
   * Generate mock customization groups
   * TODO: Replace with API call when backend supports customization groups
   */
  private generateMockCustomizationGroups(product: any): CustomizationGroup[] {
    // Basic customization groups for food/beverage products
    return [
      {
        id: 'size-1',
        name: 'Kích cỡ',
        required: true,
        maxSelection: 1,
        options: [
          { id: 'medium', name: 'Vừa', priceModifier: 0 },
          { id: 'large', name: 'Lớn', priceModifier: 10000 }
        ]
      },
      {
        id: 'note-1',
        name: 'Ghi chú đặc biệt',
        required: false,
        maxSelection: 1,
        options: [
          { id: 'none', name: 'Không', priceModifier: 0 },
          { id: 'less-spicy', name: 'Ít cay', priceModifier: 0 },
          { id: 'no-onion', name: 'Không hành', priceModifier: 0 }
        ]
      }
    ];
  }
  
  /**
   * Open product detail modal
   */
  openProductModal(product: Product): void {
    if (product.isSoldOut) return;
    this.selectedProduct.set(product);
    this.isModalOpen.set(true);
  }
  
  /**
   * Close product detail modal
   */
  closeProductModal(): void {
    this.isModalOpen.set(false);
    setTimeout(() => {
      this.selectedProduct.set(null);
      this.editingCartItem.set(null);
    }, 300);
  }
  
  /**
   * Handle add to cart from modal
   */
  handleAddToCart(cartItem: CartItem): void {
    this.cartService.addToCart(cartItem);
    this.toast.success(
      this.translate.instant('cart.itemAdded', { name: cartItem.product.name })
    );
  }
  
  /**
   * Handle update cart item from modal
   */
  handleUpdateCartItem(data: {index: number, cartItem: CartItem}): void {
    this.cartService.updateCartItem(data.index, data.cartItem);
    this.editingCartItem.set(null);
    this.toast.success(
      this.translate.instant('cart.itemUpdated')
    );
  }
  
  /**
   * Scroll categories left
   */
  scrollCategoriesLeft(container: HTMLElement) {
    container.scrollBy({ left: -200, behavior: 'smooth' });
    setTimeout(() => this.updateScrollButtons(container), 300);
  }
  
  /**
   * Scroll categories right
   */
  scrollCategoriesRight(container: HTMLElement) {
    container.scrollBy({ left: 200, behavior: 'smooth' });
    setTimeout(() => this.updateScrollButtons(container), 300);
  }
  
  /**
   * Update scroll button visibility
   */
  updateScrollButtons(container: HTMLElement) {
    this.canScrollLeft.set(container.scrollLeft > 0);
    this.canScrollRight.set(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
  }
  
  /**
   * Initialize scroll buttons on container
   */
  onCategoryContainerInit(container: HTMLElement) {
    this.updateScrollButtons(container);
    container.addEventListener('scroll', () => this.updateScrollButtons(container));
  }
}

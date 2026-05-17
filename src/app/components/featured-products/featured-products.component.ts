import { Component, ChangeDetectionStrategy, signal, inject, OnInit, effect, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import { ProductItemComponent, ProductItem } from '../product-item/product-item.component';
import { ProductService, Product } from '../../services/product.service';

@Component({
  selector: 'app-featured-products',
  standalone: true,
  imports: [ProductItemComponent, TranslateModule],
  templateUrl: './featured-products.component.html',
  styleUrl: './featured-products.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    /**
     * Page-change animation for the product grid.
     *
     * Uses Angular's built-in `:increment` / `:decrement` transitions so that
     * navigating to a higher page slides items in from the right while
     * navigating to a lower page slides them in from the left — no extra
     * direction-tracking state required. Items are staggered by 25ms each so
     * the row reveals as a quick wave instead of a single bulk flash.
     *
     * Total duration capped under 250ms to stay snappy ("animation nhanh vào").
     */
    trigger('pageSlide', [
      transition(':increment', [
        query(
          'app-product-item',
          [
            style({ opacity: 0, transform: 'translateX(28px)' }),
            stagger(25, [
              animate(
                '220ms cubic-bezier(0.22, 1, 0.36, 1)',
                style({ opacity: 1, transform: 'translateX(0)' }),
              ),
            ]),
          ],
          { optional: true },
        ),
      ]),
      transition(':decrement', [
        query(
          'app-product-item',
          [
            style({ opacity: 0, transform: 'translateX(-28px)' }),
            stagger(25, [
              animate(
                '220ms cubic-bezier(0.22, 1, 0.36, 1)',
                style({ opacity: 1, transform: 'translateX(0)' }),
              ),
            ]),
          ],
          { optional: true },
        ),
      ]),
    ]),
  ],
})
export class FeaturedProductsComponent implements OnInit {
  private productService = inject(ProductService);

  // Output events to parent
  productClicked = output<ProductItem>();
  addToCartClicked = output<ProductItem>();
  
  // All products
  private allProducts = signal<ProductItem[]>([]);
  
  // Display limit
  private readonly ITEMS_PER_PAGE = 12;
  currentPage = signal(1);
  
  // Displayed products (computed from allProducts and currentPage)
  products = signal<ProductItem[]>([]);
  
  // Total pages
  totalPages = signal(1);
  
  // Check if can go to previous/next page
  canGoPrevious = signal(false);
  canGoNext = signal(false);
  
  // Loading state
  isLoading = signal(true);

  /** Placeholder slots dùng để render skeleton lúc load lần đầu. 6 = 3 cột × 2 hàng. */
  protected readonly skeletonSlots = Array.from({ length: 6 });
  
  ngOnInit(): void {
    this.loadRecommendedProducts();
  }
  
  /**
   * Load recommended products from API
   */
  private loadRecommendedProducts(): void {
    this.isLoading.set(true);

    this.productService.getRecommendedProducts(0, 20).subscribe({
      next: (response) => {
        const products = response.data.content.map(this.mapProductToProductItem.bind(this));
        this.allProducts.set(products);
        this.totalPages.set(Math.ceil(products.length / this.ITEMS_PER_PAGE));
        this.updateDisplayedProducts();
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading recommended products:', error);
        // Khi API fail, render empty state thay vì mock data. Trước đây ta
        // fallback sang mock products ("Cơm Gà Xối Mỡ", "Phở Bò"…) nhưng
        // pattern này gây flash UI lúc navigate giữa trang — mock cards
        // hiện trong tích tắc rồi bị real cards thay → user thấy "thẻ thừa".
        // Empty state cho biết chính xác trạng thái và không spam fake data.
        this.allProducts.set([]);
        this.totalPages.set(1);
        this.updateDisplayedProducts();
        this.isLoading.set(false);
      }
    });
  }
  
  /**
   * Map API Product to ProductItem
   */
  private mapProductToProductItem(product: Product): ProductItem {
    const images = this.productService.parseImages(product.images);
    const firstImage = images.length > 0 ? images[0] : this.productService.getFirstImage(product);

    // BE serialises BigDecimal as JSON number; defensive parse handles
    // both string and number representations.
    const rawPrice: any = product.price;
    const numericPrice =
      typeof rawPrice === 'number' ? rawPrice : parseFloat(rawPrice ?? '0');

    // BE thêm originalPrice + discountPercentage khi product có sale active.
    const rawOriginal: any = product.originalPrice;
    const numericOriginal =
      rawOriginal != null
        ? typeof rawOriginal === 'number'
          ? rawOriginal
          : parseFloat(rawOriginal)
        : undefined;

    return {
      id: product.id,
      name: product.name,
      shopName: product.shopName || 'Unknown Shop',
      description: product.description || '',
      image: firstImage,
      price: numericPrice,
      // Chỉ truyền originalPrice xuống UI khi thật sự có sale (giá gốc > giá hiện tại).
      originalPrice:
        numericOriginal != null && numericOriginal > numericPrice
          ? numericOriginal
          : undefined,
      sold: 0, // TODO: Get from product stats
      rating: product.averageRating || 0
    };
  }

  onProductClick(product: ProductItem): void {
    this.productClicked.emit(product);
  }
  
  onFavoriteClick(productId: string): void {
    console.log('Favorite clicked:', productId);
    // TODO: Toggle favorite
  }
  
  onAddToCartClick(product: ProductItem): void {
    this.addToCartClicked.emit(product);
  }
  
  /**
   * Go to previous page
   */
  previousPage(): void {
    if (this.currentPage() > 1) {
      const newPage = this.currentPage() - 1;
      this.currentPage.set(newPage);
      this.updateDisplayedProducts();
    }
  }
  
  /**
   * Go to next page
   */
  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      const newPage = this.currentPage() + 1;
      this.currentPage.set(newPage);
      this.updateDisplayedProducts();
    }
  }
  
  /**
   * Update displayed products based on current page
   */
  private updateDisplayedProducts(): void {
    const startIndex = (this.currentPage() - 1) * this.ITEMS_PER_PAGE;
    const endIndex = startIndex + this.ITEMS_PER_PAGE;
    this.products.set(this.allProducts().slice(startIndex, endIndex));
    this.canGoPrevious.set(this.currentPage() > 1);
    this.canGoNext.set(this.currentPage() < this.totalPages());
  }
}

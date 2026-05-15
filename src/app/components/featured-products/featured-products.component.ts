import { Component, ChangeDetectionStrategy, signal, inject, OnInit, effect, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ProductItemComponent, ProductItem } from '../product-item/product-item.component';
import { ProductService, Product } from '../../services/product.service';
import { HotToastService } from '@ngxpert/hot-toast';

@Component({
  selector: 'app-featured-products',
  standalone: true,
  imports: [ProductItemComponent, TranslateModule],
  templateUrl: './featured-products.component.html',
  styleUrl: './featured-products.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturedProductsComponent implements OnInit {
  private productService = inject(ProductService);
  private toast = inject(HotToastService);
  
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
        // Silently fallback to mock data without showing error toast
        this.isLoading.set(false);
        this.loadMockData();
      }
    });
  }
  
  /**
   * Map API Product to ProductItem
   */
  private mapProductToProductItem(product: Product): ProductItem {
    const images = this.productService.parseImages(product.images);
    const firstImage = images.length > 0 ? images[0] : this.productService.getFirstImage(product);
    
    return {
      id: product.id,
      name: product.name,
      shopName: product.shopName || 'Unknown Shop',
      description: product.description || '',
      image: firstImage,
      price: parseFloat(product.price),
      sold: 0, // TODO: Get from product stats
      rating: product.averageRating || 0
    };
  }
  
  /**
   * Load mock data as fallback
   */
  private loadMockData(): void {
    const mockProducts: ProductItem[] = [
      {
        id: '1',
        name: 'Cơm Gà Xối Mỡ',
        shopName: 'Quán Cô Ba',
        description: 'Đặc sản Hội An',
        image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&h=600&fit=crop',
        price: 39000,
        originalPrice: 45000,
        sold: 1200,
        rating: 4.8
      },
      {
        id: '2',
        name: 'Phở Bò Tái Nạm',
        shopName: 'Phở Hà Nội',
        description: 'Món ăn truyền thống',
        image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&h=600&fit=crop',
        price: 35000,
        sold: 850,
        rating: 4.9
      },
      {
        id: '3',
        name: 'Bánh Mì Thịt Nướng',
        shopName: 'Bánh Mì Huỳnh Hoa',
        description: 'Giòn tan, thơm ngon',
        image: 'https://images.unsplash.com/photo-1598511726623-d2e9996892f0?w=600&h=600&fit=crop',
        price: 25000,
        originalPrice: 30000,
        sold: 2000,
        rating: 4.7
      }
    ];
    
    this.allProducts.set(mockProducts);
    this.totalPages.set(Math.ceil(mockProducts.length / this.ITEMS_PER_PAGE));
    this.updateDisplayedProducts();
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

import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ProductItemComponent, ProductItem } from '../product-item/product-item.component';

@Component({
  selector: 'app-featured-products',
  standalone: true,
  imports: [ProductItemComponent, TranslateModule],
  templateUrl: './featured-products.component.html',
  styleUrl: './featured-products.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturedProductsComponent {
  // All products
  private allProducts = signal<ProductItem[]>([
    {
      id: '1',
      name: 'Cơm Gà Xối Mỡ',
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
      description: 'Món ăn truyền thống',
      image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&h=600&fit=crop',
      price: 35000,
      sold: 850,
      rating: 4.9
    },
    {
      id: '3',
      name: 'Bánh Mì Thịt Nướng',
      description: 'Giòn tan, thơm ngon',
      image: 'https://images.unsplash.com/photo-1598511726623-d2e9996892f0?w=600&h=600&fit=crop',
      price: 25000,
      originalPrice: 30000,
      sold: 2000,
      rating: 4.7
    },
    {
      id: '4',
      name: 'Bún Chả Hà Nội',
      description: 'Hương vị đậm đà',
      image: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=600&h=600&fit=crop',
      price: 40000,
      sold: 650,
      rating: 4.6
    },
    {
      id: '5',
      name: 'Gỏi Cuốn Tôm Thịt',
      description: 'Tươi mát, bổ dưỡng',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=600&fit=crop',
      price: 35000,
      originalPrice: 42000,
      sold: 900,
      rating: 4.5
    },
    {
      id: '6',
      name: 'Cà Phê Sữa Đá',
      description: 'Đậm vị Việt Nam',
      image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&h=600&fit=crop',
      price: 20000,
      originalPrice: 25000,
      sold: 1500,
      rating: 4.8
    },
    {
      id: '7',
      name: 'Bún Bò Huế',
      description: 'Cay nồng đặc trưng',
      image: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=600&h=600&fit=crop',
      price: 45000,
      sold: 700,
      rating: 4.7
    },
    {
      id: '8',
      name: 'Chả Giò Rế',
      description: 'Giòn rụm, thơm ngon',
      image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&h=600&fit=crop',
      price: 30000,
      sold: 1100,
      rating: 4.6
    },
    {
      id: '9',
      name: 'Hủ Tiếu Nam Vang',
      description: 'Thanh ngọt, đậm đà',
      image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&h=600&fit=crop',
      price: 38000,
      sold: 800,
      rating: 4.5
    },
    {
      id: '10',
      name: 'Bánh Xèo Miền Tây',
      description: 'Giòn tan, nhân đầy đặn',
      image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&h=600&fit=crop',
      price: 32000,
      sold: 950,
      rating: 4.7
    },
    {
      id: '11',
      name: 'Cao Lầu Hội An',
      description: 'Đặc sản xứ Quảng',
      image: 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=600&h=600&fit=crop',
      price: 42000,
      sold: 600,
      rating: 4.8
    },
    {
      id: '12',
      name: 'Mì Quảng',
      description: 'Hương vị miền Trung',
      image: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=600&h=600&fit=crop',
      price: 40000,
      sold: 750,
      rating: 4.6
    },
    {
      id: '13',
      name: 'Bánh Cuốn Hà Nội',
      description: 'Mềm mịn, thơm ngon',
      image: 'https://images.unsplash.com/photo-1626804475297-41608ea09aeb?w=600&h=600&fit=crop',
      price: 28000,
      sold: 1000,
      rating: 4.5
    },
    {
      id: '14',
      name: 'Nem Nướng Nha Trang',
      description: 'Thơm lừng, đậm đà',
      image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&h=600&fit=crop',
      price: 35000,
      sold: 850,
      rating: 4.7
    },
    {
      id: '15',
      name: 'Cơm Tấm Sườn Bì',
      description: 'Đặc sản Sài Gòn',
      image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&h=600&fit=crop',
      price: 42000,
      sold: 1200,
      rating: 4.8
    }
  ]);
  
  // Display limit
  private readonly INITIAL_LIMIT = 12;
  displayLimit = signal(this.INITIAL_LIMIT);
  
  // Displayed products (computed from allProducts and displayLimit)
  products = signal<ProductItem[]>(this.allProducts().slice(0, this.INITIAL_LIMIT));
  
  // Check if there are more products to show
  hasMore = signal(this.allProducts().length > this.INITIAL_LIMIT);
  
  onProductClick(product: ProductItem): void {
    console.log('Product clicked:', product);
    // TODO: Open product detail modal
  }
  
  onFavoriteClick(productId: string): void {
    console.log('Favorite clicked:', productId);
    // TODO: Toggle favorite
  }
  
  onAddToCartClick(product: ProductItem): void {
    console.log('Add to cart:', product);
    // TODO: Add to cart
  }
  
  /**
   * Load more products
   */
  loadMore(): void {
    const newLimit = this.displayLimit() + 12;
    this.displayLimit.set(newLimit);
    this.products.set(this.allProducts().slice(0, newLimit));
    this.hasMore.set(this.allProducts().length > newLimit);
  }
}

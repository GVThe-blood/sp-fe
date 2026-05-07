import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShopCardComponent, ShopItem } from '../shop-card/shop-card.component';
import { ShopService, Shop } from '../../services/shop.service';
import { HotToastService } from '@ngxpert/hot-toast';

/**
 * FeaturedShopsComponent - Featured shops section
 * 
 * Displays a single row of 4 featured/popular shops with navigation
 * Used in: Homepage
 */
@Component({
  selector: 'app-featured-shops',
  standalone: true,
  imports: [CommonModule, ShopCardComponent],
  templateUrl: './featured-shops.component.html',
  styleUrl: './featured-shops.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeaturedShopsComponent implements OnInit {
  private shopService = inject(ShopService);
  private toast = inject(HotToastService);
  
  // All shops data
  private allShops = signal<ShopItem[]>([]);
  
  // Display limit - 4 shops per page
  private readonly ITEMS_PER_PAGE = 4;
  currentPage = signal(1);
  
  // Displayed shops (computed from allShops and currentPage)
  shops = signal<ShopItem[]>([]);
  
  // Total pages
  totalPages = signal(1);
  
  // Check if can go to previous/next page
  canGoPrevious = signal(false);
  canGoNext = signal(false);
  
  // Loading state
  isLoading = signal(true);
  
  ngOnInit(): void {
    this.loadFeaturedShops();
  }
  
  /**
   * Load featured shops from API
   */
  private loadFeaturedShops(): void {
    this.isLoading.set(true);
    
    this.shopService.getFeaturedShops(0, 10).subscribe({
      next: (response) => {
        const shops = response.data.content.map(this.mapShopToShopItem.bind(this));
        this.allShops.set(shops);
        this.totalPages.set(Math.ceil(shops.length / this.ITEMS_PER_PAGE));
        this.updateDisplayedShops();
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading featured shops:', error);
        // Silently fallback to mock data without showing error toast
        this.isLoading.set(false);
        this.loadMockData();
      }
    });
  }
  
  /**
   * Map API Shop to ShopItem
   */
  private mapShopToShopItem(shop: Shop): ShopItem {
    return {
      id: shop.shopId,
      name: shop.shopName,
      address: shop.introduction || 'Chưa có thông tin',
      image: this.shopService.getShopLogo(shop),
      distance: 0.5, // TODO: Calculate based on user location
      rating: 4.5, // TODO: Get from shop stats
      reviewCount: shop.totalProducts || 0,
      hasPromo: true
    };
  }
  
  /**
   * Load mock data as fallback
   */
  private loadMockData(): void {
    const mockShops: ShopItem[] = [
      {
        id: '1',
        name: 'Anh Tùng - Phở Bò Nam Định - Tây Tựu',
        address: '340 Tây Tựu, Phường Tây Tựu, Quận Bắc Từ Liêm',
        image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop',
        distance: 0.1,
        rating: 4.5,
        reviewCount: 234,
        hasPromo: true
      },
      {
        id: '2',
        name: 'Coffee 20 - Phố Nhổn',
        address: '12 Phố Nhổn, Phường Tây Tựu, Quận Bắc Từ Liêm',
        image: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400&h=300&fit=crop',
        distance: 0.1,
        rating: 4.7,
        reviewCount: 156,
        hasPromo: true
      },
      {
        id: '3',
        name: 'Bún Bò Huế 65 & Bánh Mì Cay Hải Phòng - Phố Nhổn',
        address: '65 Phố Nhổn, Phường Phương Canh, Nam Từ Liêm',
        image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400&h=300&fit=crop',
        distance: 0.1,
        rating: 4.7,
        reviewCount: 386,
        hasPromo: true
      },
      {
        id: '4',
        name: 'Chè Thảo Chi - Chè Thảo Cẩm & Kem Dừa - Tự Hoàng',
        address: '33 Tự Hoàng, Phường Phương Canh, Quận Nam Từ Liêm',
        image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop',
        distance: 0.2,
        rating: 4.3,
        reviewCount: 54,
        hasPromo: true
      }
    ];
    
    this.allShops.set(mockShops);
    this.totalPages.set(Math.ceil(mockShops.length / this.ITEMS_PER_PAGE));
    this.updateDisplayedShops();
  }
  
  /**
   * Handle shop click
   */
  onShopClick(shop: ShopItem): void {
    console.log('Shop clicked:', shop);
    // TODO: Navigate to shop detail page
  }
  
  /**
   * Go to previous page
   */
  previousPage(): void {
    if (this.currentPage() > 1) {
      const newPage = this.currentPage() - 1;
      this.currentPage.set(newPage);
      this.updateDisplayedShops();
    }
  }
  
  /**
   * Go to next page
   */
  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      const newPage = this.currentPage() + 1;
      this.currentPage.set(newPage);
      this.updateDisplayedShops();
    }
  }
  
  /**
   * Update displayed shops based on current page
   */
  private updateDisplayedShops(): void {
    const startIndex = (this.currentPage() - 1) * this.ITEMS_PER_PAGE;
    const endIndex = startIndex + this.ITEMS_PER_PAGE;
    this.shops.set(this.allShops().slice(startIndex, endIndex));
    this.canGoPrevious.set(this.currentPage() > 1);
    this.canGoNext.set(this.currentPage() < this.totalPages());
  }
}

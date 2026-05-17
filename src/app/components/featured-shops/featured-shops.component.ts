import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import { ShopCardComponent, ShopItem } from '../shop-card/shop-card.component';
import { ShopService, Shop } from '../../services/shop.service';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    /**
     * Direction-aware slide for shop pagination — shops fly in from the side
     * the user is navigating towards. See {@code featured-products.component}
     * for the rationale behind using `:increment` / `:decrement`.
     */
    trigger('pageSlide', [
      transition(':increment', [
        query(
          'app-shop-card',
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
          'app-shop-card',
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
export class FeaturedShopsComponent implements OnInit {
  private shopService = inject(ShopService);

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

  /** Placeholder slots cho skeleton — 4 = grid 4 cột. */
  protected readonly skeletonSlots = Array.from({ length: 4 });
  
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
        // Render empty state thay vì mock data — pattern cũ (4 shop fake
        // "Phở Bò Nam Định"/"Coffee 20"…) gây flash UI lúc navigate vì
        // mock cards hiện trong tích tắc rồi bị real cards thay thế.
        this.allShops.set([]);
        this.totalPages.set(1);
        this.updateDisplayedShops();
        this.isLoading.set(false);
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

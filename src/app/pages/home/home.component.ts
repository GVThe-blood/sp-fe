import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { HotToastService } from '@ngxpert/hot-toast';
import { ColorRibbonComponent } from '../../components/color-ribbon/color-ribbon.component';
import { HeroCarouselComponent } from '../../components/hero-carousel/hero-carousel.component';
import { FeaturedProductsComponent } from '../../components/featured-products/featured-products.component';
import { FeaturedShopsComponent } from '../../components/featured-shops/featured-shops.component';

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
    FeaturedShopsComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
  private toast = inject(HotToastService);
  private translate = inject(TranslateService);
  
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
  
  setActiveCategory(id: number) {
    this.activeCategoryId.set(id);
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

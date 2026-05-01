import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { HotToastService } from '@ngxpert/hot-toast';
import { ColorRibbonComponent } from '../../components/color-ribbon/color-ribbon.component';
import { FlashSaleComponent } from '../../components/flash-sale/flash-sale.component';
import { FeaturedProductsComponent } from '../../components/featured-products/featured-products.component';

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
 * - Delivery Location Bar
 * - Category Chips
 * - Flash Sale Hero Banner (combined hero + flash sale)
 * - Featured Products section
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.7, 3.8
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    ColorRibbonComponent,
    FlashSaleComponent,
    FeaturedProductsComponent
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
  
  // Flash sale active state
  flashSaleActive = signal(true);
  
  setActiveCategory(id: number) {
    this.activeCategoryId.set(id);
  }
  
  /**
   * Handle flash sale ended event
   */
  onFlashSaleEnded(): void {
    this.flashSaleActive.set(false);
    this.toast.info(
      this.translate.instant('homepage.flashSale.ended')
    );
  }
}

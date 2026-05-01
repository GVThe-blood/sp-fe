import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColorRibbonComponent } from '../../components/color-ribbon/color-ribbon.component';
import { HeroComponent } from '../../components/hero/hero.component';
import { ProductCategoryCarouselComponent } from '../../components/product-category-carousel/product-category-carousel.component';
import { TrendingCategoriesComponent } from '../../components/trending-categories/trending-categories.component';
import { FeaturedProductsComponent } from '../../components/featured-products/featured-products.component';

interface Category {
  id: number;
  name: string;
  icon: string;
  iconFill: boolean;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    ColorRibbonComponent,
    HeroComponent,
    ProductCategoryCarouselComponent,
    TrendingCategoriesComponent,
    FeaturedProductsComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  deliveryAddress = signal('123 Nguyễn Văn Linh, Quận 7, TP.HCM');

  categories = signal<Category[]>([
    { id: 1, name: 'Món Chính', icon: 'restaurant', iconFill: true },
    { id: 2, name: 'Đồ Uống', icon: 'local_cafe', iconFill: false },
    { id: 3, name: 'Tráng Miệng', icon: 'cake', iconFill: false },
    { id: 4, name: 'Ăn Vặt', icon: 'tapas', iconFill: false },
    { id: 5, name: 'Đồ Chay', icon: 'eco', iconFill: false },
  ]);

  activeCategoryId = signal(1);

  setActiveCategory(id: number) {
    this.activeCategoryId.set(id);
  }
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColorRibbonComponent } from '../../components/color-ribbon/color-ribbon.component';
import { HeroComponent } from '../../components/hero/hero.component';
import { ProductCategoryCarouselComponent } from '../../components/product-category-carousel/product-category-carousel.component';
import { TrendingCategoriesComponent } from '../../components/trending-categories/trending-categories.component';
import { FeaturedProductsComponent } from '../../components/featured-products/featured-products.component';

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
export class HomeComponent {}

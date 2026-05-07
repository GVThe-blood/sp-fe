import { Component, ChangeDetectionStrategy, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface ShopItem {
  id: string;
  name: string;
  address: string;
  image: string;
  distance: number; // in km
  rating?: number;
  reviewCount?: number;
  hasPromo?: boolean;
}

/**
 * ShopCardComponent - Reusable shop card component
 * 
 * Displays shop information in a vertical card layout:
 * - Shop image with optional PROMO badge
 * - Shop name
 * - Address
 * - Distance and rating
 * 
 * Used in: Featured Shops section
 */
@Component({
  selector: 'app-shop-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './shop-card.component.html',
  styleUrl: './shop-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShopCardComponent {
  private router = inject(Router);
  
  // Inputs
  shop = input.required<ShopItem>();
  
  // Outputs
  shopClick = output<ShopItem>();
  
  // Placeholder image from environment
  private readonly placeholderImage = environment.placeholders.shop;
  
  /**
   * Handle shop click - navigate to shop detail page
   */
  onShopClick(): void {
    const shopData = this.shop();
    this.shopClick.emit(shopData);
    this.router.navigate(['/store', shopData.id]);
  }
  
  /**
   * Handle shop image error
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = this.placeholderImage;
  }
}

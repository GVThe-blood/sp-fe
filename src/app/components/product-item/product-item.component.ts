import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StarRatingComponent } from '../star-rating/star-rating.component';

export interface ProductItem {
  id: string;
  name: string;
  description?: string;
  image: string;
  price: number;
  originalPrice?: number;
  sold?: number;
  rating?: number;
  isSoldOut?: boolean;
}

/**
 * ProductItemComponent - Reusable product card component
 * 
 * Displays product information in a horizontal card layout:
 * - Product image (left)
 * - Product info (center): name, description, sold count, rating
 * - Price and action buttons (right): favorite, add to cart
 * 
 * Used in: Homepage, Store Detail, Search Results
 */
@Component({
  selector: 'app-product-item',
  standalone: true,
  imports: [CommonModule, StarRatingComponent],
  templateUrl: './product-item.component.html',
  styleUrl: './product-item.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductItemComponent {
  // Inputs
  product = input.required<ProductItem>();
  isFavorite = input<boolean>(false);
  
  // Outputs
  productClick = output<ProductItem>();
  favoriteClick = output<string>();
  addToCartClick = output<ProductItem>();
  
  /**
   * Handle product image error
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/placeholder-product.png';
  }
}

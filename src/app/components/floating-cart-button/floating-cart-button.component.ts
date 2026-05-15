import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart.service';

/**
 * FloatingCartButtonComponent - Floating cart button with item count
 * 
 * Displays a floating button at bottom-right showing cart item count
 * Navigates to order/cart page when clicked
 */
@Component({
  selector: 'app-floating-cart-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (cartCount() > 0) {
      <button
        (click)="navigateToCart()"
        class="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        style="background: linear-gradient(135deg, #6db33f, #90d960);"
        aria-label="View cart">
        <!-- Cart Icon -->
        <div class="relative">
          <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
          <!-- Badge -->
          <div class="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
            <span class="text-white text-xs font-bold">{{ cartCount() }}</span>
          </div>
        </div>
      </button>
    }
  `,
  styles: [`
    :host {
      display: contents;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FloatingCartButtonComponent {
  private cartService = inject(CartService);
  private router = inject(Router);
  
  // Expose cart count
  readonly cartCount = this.cartService.cartCount;
  
  /**
   * Navigate to cart/order page
   */
  navigateToCart(): void {
    this.router.navigate(['/order']);
  }
}

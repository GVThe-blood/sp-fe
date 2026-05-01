import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit, OnDestroy, output, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HotToastService } from '@ngxpert/hot-toast';
import { ProductService, Product } from '../../services/product.service';

/**
 * TimeRemaining interface for countdown timer state
 */
export interface TimeRemaining {
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

/**
 * FlashSaleComponent - Display flash sale section with countdown timer
 * 
 * Features:
 * - Countdown timer with glassmorphic styling
 * - Product grid (3 columns desktop, 2 tablet, 1 mobile)
 * - Loading states with skeleton
 * - Empty state handling
 * - Signal-based state management
 * - OnPush change detection
 * 
 * Requirements: 2.1, 2.4, 5.1, 5.9
 */
@Component({
  selector: 'app-flash-sale',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './flash-sale.component.html',
  styleUrl: './flash-sale.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FlashSaleComponent implements OnInit, OnDestroy {
  private destroyRef = inject(DestroyRef);
  private productService = inject(ProductService);
  private toast = inject(HotToastService);
  private translate = inject(TranslateService);
  
  // Output event when sale ends
  saleEnded = output<void>();
  
  // State signals
  products = signal<Product[]>([]);
  timeRemaining = signal<TimeRemaining>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0
  });
  isLoading = signal(true);
  error = signal<string | null>(null);
  
  // Computed signals
  isExpired = computed(() => this.timeRemaining().total <= 0);
  
  // Timer interval
  private timerInterval?: ReturnType<typeof setInterval>;
  
  ngOnInit(): void {
    // Start countdown with a default end time (4 hours from now for demo)
    const demoEndTime = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
    this.startCountdown(demoEndTime);
    
    // Uncomment to load from API
    // this.loadFlashSaleProducts();
  }
  
  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }
  
  /**
   * Load flash sale products from API
   * Requirements: 9.1, 9.2, 5.2
   */
  private loadFlashSaleProducts(): void {
    this.isLoading.set(true);
    this.error.set(null);
    
    this.productService.getFlashSaleProducts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.products.set(response.data.products);
          if (response.data.endTime) {
            this.startCountdown(response.data.endTime);
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load flash sale products:', error);
          const errorMessage = this.getErrorMessage(error);
          this.error.set(errorMessage);
          this.toast.error(this.translate.instant(errorMessage));
          this.isLoading.set(false);
        }
      });
  }
  
  /**
   * Get user-friendly error message
   * @param error HTTP error response
   * @returns Translation key for error message
   */
  private getErrorMessage(error: any): string {
    if (error.status === 0) {
      return 'errors.network';
    }
    
    if (error.status >= 400 && error.status < 500) {
      return 'errors.client.default';
    }
    
    if (error.status >= 500) {
      return 'errors.server.default';
    }
    
    return 'errors.unknown';
  }
  
  /**
   * Start countdown timer
   * @param endTime ISO 8601 datetime string
   */
  private startCountdown(endTime: string): void {
    try {
      const endDate = new Date(endTime).getTime();
      
      // Validate end time
      if (isNaN(endDate)) {
        throw new Error('Invalid end time format');
      }
      
      // Check if already expired
      if (endDate <= Date.now()) {
        this.timeRemaining.set({ hours: 0, minutes: 0, seconds: 0, total: 0 });
        this.saleEnded.emit();
        return;
      }
      
      // Update immediately
      this.updateTimeRemaining(endDate);
      
      // Update every second
      this.timerInterval = setInterval(() => {
        this.updateTimeRemaining(endDate);
        
        // Check if expired
        if (this.isExpired()) {
          clearInterval(this.timerInterval);
          this.saleEnded.emit();
        }
      }, 1000);
      
    } catch (error) {
      console.error('Failed to start countdown:', error);
      this.error.set('errors.countdown');
    }
  }
  
  /**
   * Update time remaining signal
   * @param endDate End date in milliseconds
   */
  private updateTimeRemaining(endDate: number): void {
    const now = Date.now();
    const total = Math.max(0, endDate - now);
    
    const hours = Math.floor(total / (1000 * 60 * 60));
    const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((total % (1000 * 60)) / 1000);
    
    this.timeRemaining.set({ hours, minutes, seconds, total });
  }
  
  /**
   * Format time value with leading zero
   * @param value Time value (hours, minutes, or seconds)
   * @returns Formatted string with leading zero
   */
  formatTime(value: number): string {
    return value.toString().padStart(2, '0');
  }
}

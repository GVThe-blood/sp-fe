import { Component, ChangeDetectionStrategy, signal, OnInit, OnDestroy, DestroyRef, inject } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FlashSaleComponent } from '../flash-sale/flash-sale.component';

export interface HeroSlide {
  id: string;
  type: 'flash-sale' | 'promotion' | 'announcement' | 'custom';
  // For custom HTML content
  title?: string;
  subtitle?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  backgroundImage?: string;
  backgroundColor?: string;
  textColor?: string;
}

/**
 * HeroCarouselComponent - Auto-rotating hero banner carousel
 * 
 * Features:
 * - Multiple slide types (flash sale, promotion, announcement, custom)
 * - Auto-rotate every 8 seconds
 * - Dot indicators showing current slide
 * - Smooth transitions
 * - Customizable content per slide
 */
@Component({
  selector: 'app-hero-carousel',
  standalone: true,
  imports: [CommonModule, FlashSaleComponent],
  templateUrl: './hero-carousel.component.html',
  styleUrl: './hero-carousel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeroCarouselComponent implements OnInit, OnDestroy {
  private destroyRef = inject(DestroyRef);
  
  // Slides configuration
  slides = signal<HeroSlide[]>([
    {
      id: 'flash-sale',
      type: 'flash-sale'
    },
    {
      id: 'promo-1',
      type: 'promotion',
      title: 'Miễn Phí Giao Hàng',
      subtitle: 'Cho đơn từ 99.000đ',
      description: 'Áp dụng cho tất cả các quận nội thành',
      buttonText: 'Đặt Ngay',
      buttonLink: '/products',
      backgroundImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&h=500&fit=crop',
      textColor: 'white'
    },
    {
      id: 'announcement-1',
      type: 'announcement',
      title: 'Khám Phá Món Mới',
      subtitle: 'Hơn 100+ món ăn đặc sản',
      description: 'Từ Bắc chí Nam, đa dạng hương vị',
      buttonText: 'Xem Menu',
      buttonLink: '/menu',
      backgroundImage: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1920&h=500&fit=crop',
      textColor: 'white'
    }
  ]);
  
  currentSlideIndex = signal(0);
  private autoRotateInterval?: ReturnType<typeof setInterval>;
  private readonly AUTO_ROTATE_DELAY = 8000; // 8 seconds
  
  ngOnInit(): void {
    this.startAutoRotate();
  }
  
  ngOnDestroy(): void {
    this.stopAutoRotate();
  }
  
  /**
   * Start auto-rotation
   */
  private startAutoRotate(): void {
    this.autoRotateInterval = setInterval(() => {
      this.nextSlide();
    }, this.AUTO_ROTATE_DELAY);
  }
  
  /**
   * Stop auto-rotation
   */
  private stopAutoRotate(): void {
    if (this.autoRotateInterval) {
      clearInterval(this.autoRotateInterval);
    }
  }
  
  /**
   * Go to next slide
   */
  nextSlide(): void {
    const nextIndex = (this.currentSlideIndex() + 1) % this.slides().length;
    this.currentSlideIndex.set(nextIndex);
  }
  
  /**
   * Go to previous slide
   */
  previousSlide(): void {
    const prevIndex = this.currentSlideIndex() === 0 
      ? this.slides().length - 1 
      : this.currentSlideIndex() - 1;
    this.currentSlideIndex.set(prevIndex);
  }
  
  /**
   * Go to specific slide
   */
  goToSlide(index: number): void {
    this.currentSlideIndex.set(index);
    // Reset auto-rotate timer
    this.stopAutoRotate();
    this.startAutoRotate();
  }
  
  /**
   * Get current slide
   */
  getCurrentSlide(): HeroSlide {
    return this.slides()[this.currentSlideIndex()];
  }
}

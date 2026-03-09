import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './star-rating.component.html',
  styleUrl: './star-rating.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StarRatingComponent {
  @Input() rating: number = 0;
  @Input() showNumber: boolean = true;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  get stars(): number[] {
    return [0, 1, 2, 3, 4];
  }

  getStarFillPercentage(index: number): number {
    const fillAmount = this.rating - index;
    return Math.max(0, Math.min(1, fillAmount)) * 100;
  }

  get sizeClass(): string {
    const sizeMap = {
      'sm': 'w-3 h-3',
      'md': 'w-4 h-4',
      'lg': 'w-5 h-5'
    };
    return sizeMap[this.size];
  }

  get textSizeClass(): string {
    const textSizeMap = {
      'sm': 'text-xs',
      'md': 'text-sm',
      'lg': 'text-base'
    };
    return textSizeMap[this.size];
  }
}

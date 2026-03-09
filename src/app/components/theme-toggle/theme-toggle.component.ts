import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService, ThemeMode } from '../../services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ThemeToggleComponent {
  private themeService = inject(ThemeService);
  
  /** Current theme from service */
  currentTheme = this.themeService.currentTheme;
  
  /** Animation state for icon transition */
  isAnimating = signal(false);

  /**
   * Handle toggle click
   * Requirements: 2.1, 2.6
   */
  onToggle(): void {
    // Start animation
    this.isAnimating.set(true);
    
    // Toggle theme
    this.themeService.toggleTheme();
    
    // End animation after transition completes
    setTimeout(() => {
      this.isAnimating.set(false);
    }, 300);
  }

  /**
   * Check if current theme is dark
   */
  isDark(): boolean {
    return this.currentTheme() === 'dark';
  }
}

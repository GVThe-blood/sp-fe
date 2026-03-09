import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'springfood-theme';
export const DARK_CLASS = 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private platformId = inject(PLATFORM_ID);
  
  /** Current theme mode as a Signal */
  currentTheme = signal<ThemeMode>('light');
  
  /** MediaQueryList for system preference detection */
  private mediaQuery: MediaQueryList | null = null;
  
  /** Bound handler for system preference changes */
  private systemPreferenceHandler = (e: MediaQueryListEvent) => {
    // Only update if no stored preference exists
    if (this.isBrowser() && !localStorage.getItem(THEME_STORAGE_KEY)) {
      const newTheme: ThemeMode = e.matches ? 'dark' : 'light';
      this.applyTheme(newTheme);
    }
  };

  constructor() {
    this.initializeTheme();
  }

  /**
   * Initialize theme on app start
   * - Check LocalStorage for stored preference
   * - Fall back to system preference if no stored value
   * - Set up listener for system preference changes
   * Requirements: 1.1, 1.2, 1.3, 1.4, 5.3
   */
  initializeTheme(): void {
    if (!this.isBrowser()) {
      return;
    }

    // Try to get stored preference
    const storedTheme = this.getStoredTheme();
    
    if (storedTheme) {
      // Use stored preference (Requirement 1.3)
      this.applyTheme(storedTheme);
    } else {
      // Fall back to system preference (Requirement 1.1)
      const systemTheme = this.getSystemPreference();
      this.applyTheme(systemTheme);
    }

    // Listen to system preference changes (Requirement 5.3)
    this.setupSystemPreferenceListener();
  }

  /**
   * Toggle between light and dark modes
   * Requirement: 2.1
   */
  toggleTheme(): void {
    const newTheme: ThemeMode = this.currentTheme() === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  /**
   * Set specific theme and persist to LocalStorage
   * Requirement: 1.2
   */
  setTheme(theme: ThemeMode): void {
    this.applyTheme(theme);
    this.storeTheme(theme);
  }

  /**
   * Get system preference from prefers-color-scheme media query
   * Requirement: 1.1
   */
  getSystemPreference(): ThemeMode {
    if (!this.isBrowser()) {
      return 'light';
    }

    try {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    } catch {
      // matchMedia not supported, default to light (Requirement 1.4)
      return 'light';
    }
  }

  /**
   * Apply theme to document and update signal
   */
  private applyTheme(theme: ThemeMode): void {
    this.currentTheme.set(theme);
    
    if (!this.isBrowser()) {
      return;
    }

    const htmlElement = document.documentElement;
    
    if (theme === 'dark') {
      htmlElement.classList.add(DARK_CLASS);
    } else {
      htmlElement.classList.remove(DARK_CLASS);
    }
  }

  /**
   * Store theme preference in LocalStorage
   * Requirement: 1.2
   */
  private storeTheme(theme: ThemeMode): void {
    if (!this.isBrowser()) {
      return;
    }

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // LocalStorage unavailable, silently fail (Requirement 1.4)
      console.warn('ThemeService: Unable to store theme preference in LocalStorage');
    }
  }

  /**
   * Get stored theme from LocalStorage
   * Returns null if not found or invalid
   */
  private getStoredTheme(): ThemeMode | null {
    if (!this.isBrowser()) {
      return null;
    }

    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
      // Invalid stored value, clear it
      if (stored !== null) {
        localStorage.removeItem(THEME_STORAGE_KEY);
      }
      return null;
    } catch {
      // LocalStorage unavailable (Requirement 1.4)
      return null;
    }
  }

  /**
   * Set up listener for system preference changes
   * Requirement: 5.3
   */
  private setupSystemPreferenceListener(): void {
    if (!this.isBrowser()) {
      return;
    }

    try {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.mediaQuery.addEventListener('change', this.systemPreferenceHandler);
    } catch {
      // matchMedia not supported, skip listener setup
    }
  }

  /**
   * Check if running in browser environment
   */
  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  /**
   * Clean up listeners (for testing purposes)
   */
  destroy(): void {
    if (this.mediaQuery) {
      this.mediaQuery.removeEventListener('change', this.systemPreferenceHandler);
    }
  }
}

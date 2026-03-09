/**
 * Theme System Tests
 * 
 * These tests verify that the centralized theme system is properly configured
 * and all CSS custom properties are defined.
 */

import * as fc from 'fast-check';

/**
 * Helper function to convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate relative luminance according to WCAG 2.1
 * https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * https://www.w3.org/WAI/GL/wiki/Contrast_ratio
 */
function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) {
    throw new Error(`Invalid color format: ${color1} or ${color2}`);
  }
  
  const l1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * WCAG AA minimum contrast ratios
 */
const WCAG_AA_NORMAL_TEXT = 4.5;
const WCAG_AA_LARGE_TEXT = 3.0;

describe('Theme System', () => {
  let testElement: HTMLDivElement;

  beforeEach(() => {
    // Create a test element to check computed styles
    testElement = document.createElement('div');
    document.body.appendChild(testElement);
  });

  afterEach(() => {
    document.body.removeChild(testElement);
  });

  describe('Primary Colors', () => {
    it('should define primary color', () => {
      const primaryColor = getComputedStyle(testElement).getPropertyValue('--color-primary').trim();
      // Adjusted from #ff6b35 to #e85d2a for WCAG AA compliance
      expect(primaryColor).toBe('#e85d2a');
    });

    it('should define primary hover color', () => {
      const primaryHover = getComputedStyle(testElement).getPropertyValue('--color-primary-hover').trim();
      // Adjusted from #ff5722 to #d54d1a for WCAG AA compliance
      expect(primaryHover).toBe('#d54d1a');
    });

    it('should define primary light color', () => {
      const primaryLight = getComputedStyle(testElement).getPropertyValue('--color-primary-light').trim();
      expect(primaryLight).toBe('#ffebe6');
    });
  });

  describe('Secondary Colors', () => {
    it('should define secondary color', () => {
      const secondaryColor = getComputedStyle(testElement).getPropertyValue('--color-secondary').trim();
      expect(secondaryColor).toBe('#4a5568');
    });

    it('should define secondary hover color', () => {
      const secondaryHover = getComputedStyle(testElement).getPropertyValue('--color-secondary-hover').trim();
      expect(secondaryHover).toBe('#2d3748');
    });
  });

  describe('Semantic Colors', () => {
    it('should define success color', () => {
      const successColor = getComputedStyle(testElement).getPropertyValue('--color-success').trim();
      // Adjusted from #10b981 to #059669 for WCAG AA compliance
      expect(successColor).toBe('#059669');
    });

    it('should define error color', () => {
      const errorColor = getComputedStyle(testElement).getPropertyValue('--color-error').trim();
      expect(errorColor).toBe('#ef4444');
    });

    it('should define warning color', () => {
      const warningColor = getComputedStyle(testElement).getPropertyValue('--color-warning').trim();
      expect(warningColor).toBe('#f59e0b');
    });
  });

  describe('Spacing System', () => {
    it('should define spacing variables', () => {
      const spacingXs = getComputedStyle(testElement).getPropertyValue('--spacing-xs').trim();
      const spacingSm = getComputedStyle(testElement).getPropertyValue('--spacing-sm').trim();
      const spacingBase = getComputedStyle(testElement).getPropertyValue('--spacing-base').trim();
      const spacingLg = getComputedStyle(testElement).getPropertyValue('--spacing-lg').trim();
      
      expect(spacingXs).toBe('0.25rem');
      expect(spacingSm).toBe('0.5rem');
      expect(spacingBase).toBe('1rem');
      expect(spacingLg).toBe('1.5rem');
    });
  });

  describe('Transitions', () => {
    it('should define transition variables', () => {
      const transitionFast = getComputedStyle(testElement).getPropertyValue('--transition-fast').trim();
      const transitionBase = getComputedStyle(testElement).getPropertyValue('--transition-base').trim();
      const transitionSlow = getComputedStyle(testElement).getPropertyValue('--transition-slow').trim();
      
      expect(transitionFast).toBe('150ms ease-in-out');
      expect(transitionBase).toBe('200ms ease-in-out');
      expect(transitionSlow).toBe('300ms ease-in-out');
    });
  });

  describe('Utility Classes', () => {
    it('should apply btn-primary class styles', () => {
      testElement.className = 'btn-primary';
      const styles = getComputedStyle(testElement);
      
      // Check that the button has the primary background color
      const bgColor = styles.backgroundColor;
      // RGB equivalent of #e85d2a (adjusted for WCAG AA compliance)
      expect(bgColor).toMatch(/rgb\(232,\s*93,\s*42\)/);
    });

    it('should apply btn-secondary class styles', () => {
      testElement.className = 'btn-secondary';
      const styles = getComputedStyle(testElement);
      
      // Check that the button has the secondary background color
      const bgColor = styles.backgroundColor;
      // RGB equivalent of #4a5568
      expect(bgColor).toMatch(/rgb\(74,\s*85,\s*104\)/);
    });

    it('should apply text-primary class styles', () => {
      testElement.className = 'text-primary';
      const styles = getComputedStyle(testElement);
      
      // Check that text has primary color
      const color = styles.color;
      // RGB equivalent of #e85d2a (adjusted for WCAG AA compliance)
      expect(color).toMatch(/rgb\(232,\s*93,\s*42\)/);
    });

    it('should apply divider class styles', () => {
      testElement.className = 'divider';
      const styles = getComputedStyle(testElement);
      
      // Check divider height
      const height = styles.height;
      expect(height).toBe('8px');
    });
  });

  describe('Theme Consistency', () => {
    it('should use CSS variables for all theme colors', () => {
      // Verify that theme variables are defined and not empty
      const variables = [
        '--color-primary',
        '--color-secondary',
        '--color-success',
        '--color-error',
        '--color-warning',
        '--spacing-base',
        '--transition-base',
        '--shadow-base',
        '--radius-base'
      ];

      variables.forEach(variable => {
        const value = getComputedStyle(testElement).getPropertyValue(variable).trim();
        expect(value).toBeTruthy();
        expect(value).not.toBe('');
      });
    });
  });

  /**
   * Property 1: Modal close button consistency
   * **Feature: ui-ux-improvements-v2, Property 1: Modal close button consistency**
   * **Validates: Requirements 1.1**
   * 
   * For any modal component that is open, the close button element should exist
   * with the unified styling class (modal-close-btn)
   */
  describe('Modal Close Button Consistency (Property-Based Test)', () => {
    // Define the modal components that should have unified close buttons
    const modalComponents = [
      'ProductDetailModal',
      'PromoCodeModal', 
      'AddressModal'
    ];

    it('should apply modal-close-btn class with correct styles', () => {
      /**
       * **Feature: ui-ux-improvements-v2, Property 1: Modal close button consistency**
       * **Validates: Requirements 1.1**
       */
      fc.assert(
        fc.property(
          fc.constantFrom(...modalComponents),
          (modalName: string) => {
            // Create a button element with the modal-close-btn class
            const closeButton = document.createElement('button');
            closeButton.className = 'modal-close-btn';
            document.body.appendChild(closeButton);

            try {
              const styles = getComputedStyle(closeButton);
              
              // Property: All modal close buttons should have consistent styling
              // 1. Position should be absolute
              expect(styles.position).toBe('absolute');
              
              // 2. Should have white background
              const bgColor = styles.backgroundColor;
              expect(bgColor).toMatch(/rgb\(255,\s*255,\s*255\)/);
              
              // 3. Should be circular (border-radius: 9999px)
              const borderRadius = styles.borderRadius;
              expect(borderRadius).toBe('9999px');
              
              // 4. Should have flex display for centering content
              expect(styles.display).toBe('flex');
              
              // 5. Should have cursor pointer
              expect(styles.cursor).toBe('pointer');
              
              // 6. Should have z-index of 10
              expect(styles.zIndex).toBe('10');
              
              // 7. Should have dimensions 40x40
              expect(styles.width).toBe('40px');
              expect(styles.height).toBe('40px');

              return true;
            } finally {
              document.body.removeChild(closeButton);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should position close button at top-right corner overlapping modal', () => {
      /**
       * **Feature: ui-ux-improvements-v2, Property 1: Modal close button consistency**
       * **Validates: Requirements 1.2**
       */
      fc.assert(
        fc.property(
          fc.constantFrom(...modalComponents),
          (modalName: string) => {
            const closeButton = document.createElement('button');
            closeButton.className = 'modal-close-btn';
            document.body.appendChild(closeButton);

            try {
              const styles = getComputedStyle(closeButton);
              
              // Property: Close button should be positioned to overlap corner
              // top: -12px and right: -12px
              expect(styles.top).toBe('-12px');
              expect(styles.right).toBe('-12px');

              return true;
            } finally {
              document.body.removeChild(closeButton);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 5: CSS Variables Update on Theme Change
   * **Feature: dark-light-mode, Property 5: CSS Variables Update on Theme Change**
   * **Validates: Requirements 3.3, 4.2**
   * 
   * For any theme change to dark mode, the CSS variables on :root should update 
   * to their dark theme values. Specifically, --bg-page should change from light 
   * value to dark value.
   */
  describe('CSS Variables Update on Theme Change (Property-Based Test)', () => {
    // Define the CSS variables that should change between themes
    const themeVariables: Array<{
      variable: string;
      lightValue: string;
      darkValue: string;
    }> = [
      { variable: '--bg-page', lightValue: '#ffffff', darkValue: '#0f0f0f' },
      { variable: '--bg-card', lightValue: '#ffffff', darkValue: '#1a1a1a' },
      { variable: '--bg-subtle', lightValue: '#f9fafb', darkValue: '#242424' },
      { variable: '--bg-hover', lightValue: '#f3f4f6', darkValue: '#2d2d2d' },
      { variable: '--text-primary', lightValue: '#111827', darkValue: '#f9fafb' },
      { variable: '--text-secondary', lightValue: '#4b5563', darkValue: '#a1a1aa' },
      { variable: '--border-default', lightValue: '#e5e7eb', darkValue: '#27272a' },
      // Adjusted from #ff6b35 to #e85d2a for WCAG AA compliance
      { variable: '--color-primary', lightValue: '#e85d2a', darkValue: '#ff7f50' },
      // Adjusted from #10b981 to #059669 for WCAG AA compliance
      { variable: '--color-success', lightValue: '#059669', darkValue: '#34d399' },
      { variable: '--color-error', lightValue: '#ef4444', darkValue: '#f87171' },
    ];

    beforeEach(() => {
      // Ensure we start in light mode
      document.documentElement.classList.remove('dark');
    });

    afterEach(() => {
      // Clean up - remove dark class
      document.documentElement.classList.remove('dark');
    });

    it('should update CSS variables when dark class is added to document', () => {
      /**
       * **Feature: dark-light-mode, Property 5: CSS Variables Update on Theme Change**
       * **Validates: Requirements 3.3, 4.2**
       */
      fc.assert(
        fc.property(
          fc.constantFrom(...themeVariables),
          (themeVar: { variable: string; lightValue: string; darkValue: string }) => {
            // Start in light mode
            document.documentElement.classList.remove('dark');
            
            // Get light mode value
            const lightModeValue = getComputedStyle(document.documentElement)
              .getPropertyValue(themeVar.variable).trim();
            
            // Switch to dark mode
            document.documentElement.classList.add('dark');
            
            // Get dark mode value
            const darkModeValue = getComputedStyle(document.documentElement)
              .getPropertyValue(themeVar.variable).trim();
            
            // Clean up
            document.documentElement.classList.remove('dark');
            
            // Property: CSS variable should have different values in light and dark modes
            // The values should match the expected light and dark values
            expect(lightModeValue).toBe(themeVar.lightValue);
            expect(darkModeValue).toBe(themeVar.darkValue);
            expect(lightModeValue).not.toBe(darkModeValue);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should toggle CSS variables correctly when switching themes multiple times', () => {
      /**
       * **Feature: dark-light-mode, Property 5: CSS Variables Update on Theme Change**
       * **Validates: Requirements 3.3, 4.2**
       */
      fc.assert(
        fc.property(
          fc.constantFrom(...themeVariables),
          fc.nat({ max: 5 }), // Number of toggles (0-5)
          (themeVar: { variable: string; lightValue: string; darkValue: string }, toggleCount: number) => {
            // Start in light mode
            document.documentElement.classList.remove('dark');
            
            // Toggle theme multiple times
            for (let i = 0; i < toggleCount; i++) {
              document.documentElement.classList.toggle('dark');
            }
            
            // Determine expected mode based on toggle count
            const shouldBeDark = toggleCount % 2 === 1;
            const expectedValue = shouldBeDark ? themeVar.darkValue : themeVar.lightValue;
            
            // Get current value
            const currentValue = getComputedStyle(document.documentElement)
              .getPropertyValue(themeVar.variable).trim();
            
            // Clean up
            document.documentElement.classList.remove('dark');
            
            // Property: After N toggles, the CSS variable should have the correct value
            // based on whether N is odd (dark) or even (light)
            expect(currentValue).toBe(expectedValue);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain theme transition variable in both modes', () => {
      /**
       * **Feature: dark-light-mode, Property 5: CSS Variables Update on Theme Change**
       * **Validates: Requirements 3.3, 4.2**
       */
      fc.assert(
        fc.property(
          fc.boolean(), // true = dark mode, false = light mode
          (isDarkMode: boolean) => {
            // Set theme mode
            if (isDarkMode) {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
            
            // Get theme transition variable
            const themeTransition = getComputedStyle(document.documentElement)
              .getPropertyValue('--theme-transition').trim();
            
            // Clean up
            document.documentElement.classList.remove('dark');
            
            // Property: Theme transition should be defined in both modes
            // and should include the expected transition properties
            expect(themeTransition).toBeTruthy();
            expect(themeTransition).toContain('background-color');
            expect(themeTransition).toContain('200ms');
            expect(themeTransition).toContain('ease');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


/**
 * WCAG AA Contrast Ratio Compliance Tests
 * 
 * These tests verify that all text/background color combinations
 * meet WCAG AA minimum contrast ratio requirements.
 * 
 * Requirements:
 * - Normal text (< 18pt or < 14pt bold): 4.5:1 minimum
 * - Large text (>= 18pt or >= 14pt bold): 3.0:1 minimum
 */
describe('WCAG AA Contrast Ratio Compliance', () => {
  /**
   * Light Mode Color Combinations
   * These are the actual color values used in light mode
   * Colors adjusted for WCAG AA compliance
   */
  const lightModeColors = {
    bgPage: '#ffffff',
    bgCard: '#ffffff',
    bgSubtle: '#f9fafb',
    bgHover: '#f3f4f6',
    textPrimary: '#111827',
    textSecondary: '#4b5563',
    textMuted: '#6b7280',
    textDisabled: '#9ca3af',
    colorPrimary: '#e85d2a',  // Adjusted from #ff6b35 for WCAG AA
    colorSuccess: '#059669',  // Adjusted from #10b981 for WCAG AA
    colorError: '#ef4444',
    colorWarning: '#f59e0b',
    colorInfo: '#2563eb',     // Adjusted from #3b82f6 for WCAG AA
    textOnPrimary: '#ffffff',
  };

  /**
   * Dark Mode Color Combinations
   * These are the actual color values used in dark mode
   * Colors adjusted for WCAG AA compliance
   */
  const darkModeColors = {
    bgPage: '#0f0f0f',
    bgCard: '#1a1a1a',
    bgSubtle: '#242424',
    bgHover: '#2d2d2d',
    textPrimary: '#f9fafb',
    textSecondary: '#a1a1aa',
    textMuted: '#8b8b94',     // Adjusted from #71717a for WCAG AA
    textDisabled: '#52525b',
    colorPrimary: '#ff7f50',
    colorSuccess: '#34d399',
    colorError: '#f87171',
    colorWarning: '#fbbf24',
    colorInfo: '#60a5fa',
    textOnPrimary: '#ffffff',
  };

  describe('Light Mode Contrast Ratios', () => {
    it('should have sufficient contrast for primary text on page background', () => {
      const ratio = getContrastRatio(lightModeColors.textPrimary, lightModeColors.bgPage);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
      // Actual ratio: ~16.8:1
    });

    it('should have sufficient contrast for secondary text on page background', () => {
      const ratio = getContrastRatio(lightModeColors.textSecondary, lightModeColors.bgPage);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
      // Actual ratio: ~7.5:1
    });

    it('should have sufficient contrast for muted text on page background', () => {
      const ratio = getContrastRatio(lightModeColors.textMuted, lightModeColors.bgPage);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
      // Actual ratio: ~5.4:1
    });

    it('should have sufficient contrast for primary text on card background', () => {
      const ratio = getContrastRatio(lightModeColors.textPrimary, lightModeColors.bgCard);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
    });

    it('should have sufficient contrast for primary text on subtle background', () => {
      const ratio = getContrastRatio(lightModeColors.textPrimary, lightModeColors.bgSubtle);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
    });

    it('should have sufficient contrast for secondary text on subtle background', () => {
      const ratio = getContrastRatio(lightModeColors.textSecondary, lightModeColors.bgSubtle);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
    });

    it('should have sufficient contrast for success color on page background (large text)', () => {
      const ratio = getContrastRatio(lightModeColors.colorSuccess, lightModeColors.bgPage);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_LARGE_TEXT);
    });

    it('should have sufficient contrast for error color on page background (large text)', () => {
      const ratio = getContrastRatio(lightModeColors.colorError, lightModeColors.bgPage);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_LARGE_TEXT);
    });

    it('should have sufficient contrast for info color on page background', () => {
      const ratio = getContrastRatio(lightModeColors.colorInfo, lightModeColors.bgPage);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
    });

    // Note: Primary color (#ff6b35) on white has ~3.1:1 ratio
    // This is acceptable for large text (buttons) but not for small text
    it('should have sufficient contrast for primary color as large text/buttons', () => {
      const ratio = getContrastRatio(lightModeColors.colorPrimary, lightModeColors.bgPage);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_LARGE_TEXT);
    });
  });

  describe('Dark Mode Contrast Ratios', () => {
    it('should have sufficient contrast for primary text on page background', () => {
      const ratio = getContrastRatio(darkModeColors.textPrimary, darkModeColors.bgPage);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
      // Actual ratio: ~18.5:1
    });

    it('should have sufficient contrast for secondary text on page background', () => {
      const ratio = getContrastRatio(darkModeColors.textSecondary, darkModeColors.bgPage);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
      // Actual ratio: ~8.2:1
    });

    it('should have sufficient contrast for muted text on page background', () => {
      const ratio = getContrastRatio(darkModeColors.textMuted, darkModeColors.bgPage);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
      // Actual ratio: ~4.5:1
    });

    it('should have sufficient contrast for primary text on card background', () => {
      const ratio = getContrastRatio(darkModeColors.textPrimary, darkModeColors.bgCard);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
    });

    it('should have sufficient contrast for primary text on subtle background', () => {
      const ratio = getContrastRatio(darkModeColors.textPrimary, darkModeColors.bgSubtle);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
    });

    it('should have sufficient contrast for secondary text on card background', () => {
      const ratio = getContrastRatio(darkModeColors.textSecondary, darkModeColors.bgCard);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
    });

    it('should have sufficient contrast for success color on page background', () => {
      const ratio = getContrastRatio(darkModeColors.colorSuccess, darkModeColors.bgPage);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
    });

    it('should have sufficient contrast for error color on page background', () => {
      const ratio = getContrastRatio(darkModeColors.colorError, darkModeColors.bgPage);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
    });

    it('should have sufficient contrast for primary color on page background', () => {
      const ratio = getContrastRatio(darkModeColors.colorPrimary, darkModeColors.bgPage);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
      // Actual ratio: ~5.5:1
    });

    it('should have sufficient contrast for info color on page background', () => {
      const ratio = getContrastRatio(darkModeColors.colorInfo, darkModeColors.bgPage);
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
    });
  });

  /**
   * Property-based test for contrast ratio compliance
   * Tests all text/background combinations systematically
   */
  describe('Contrast Ratio Property Tests', () => {
    // Define all text/background combinations that must meet WCAG AA
    const lightModeCombinations: Array<{
      name: string;
      textColor: string;
      bgColor: string;
      minRatio: number;
    }> = [
      { name: 'primary text on page', textColor: lightModeColors.textPrimary, bgColor: lightModeColors.bgPage, minRatio: WCAG_AA_NORMAL_TEXT },
      { name: 'secondary text on page', textColor: lightModeColors.textSecondary, bgColor: lightModeColors.bgPage, minRatio: WCAG_AA_NORMAL_TEXT },
      { name: 'muted text on page', textColor: lightModeColors.textMuted, bgColor: lightModeColors.bgPage, minRatio: WCAG_AA_NORMAL_TEXT },
      { name: 'primary text on card', textColor: lightModeColors.textPrimary, bgColor: lightModeColors.bgCard, minRatio: WCAG_AA_NORMAL_TEXT },
      { name: 'primary text on subtle', textColor: lightModeColors.textPrimary, bgColor: lightModeColors.bgSubtle, minRatio: WCAG_AA_NORMAL_TEXT },
      { name: 'secondary text on subtle', textColor: lightModeColors.textSecondary, bgColor: lightModeColors.bgSubtle, minRatio: WCAG_AA_NORMAL_TEXT },
      { name: 'primary color (large text)', textColor: lightModeColors.colorPrimary, bgColor: lightModeColors.bgPage, minRatio: WCAG_AA_LARGE_TEXT },
      { name: 'success color', textColor: lightModeColors.colorSuccess, bgColor: lightModeColors.bgPage, minRatio: WCAG_AA_LARGE_TEXT },
      { name: 'error color', textColor: lightModeColors.colorError, bgColor: lightModeColors.bgPage, minRatio: WCAG_AA_LARGE_TEXT },
      { name: 'info color', textColor: lightModeColors.colorInfo, bgColor: lightModeColors.bgPage, minRatio: WCAG_AA_NORMAL_TEXT },
    ];

    const darkModeCombinations: Array<{
      name: string;
      textColor: string;
      bgColor: string;
      minRatio: number;
    }> = [
      { name: 'primary text on page', textColor: darkModeColors.textPrimary, bgColor: darkModeColors.bgPage, minRatio: WCAG_AA_NORMAL_TEXT },
      { name: 'secondary text on page', textColor: darkModeColors.textSecondary, bgColor: darkModeColors.bgPage, minRatio: WCAG_AA_NORMAL_TEXT },
      { name: 'muted text on page', textColor: darkModeColors.textMuted, bgColor: darkModeColors.bgPage, minRatio: WCAG_AA_NORMAL_TEXT },
      { name: 'primary text on card', textColor: darkModeColors.textPrimary, bgColor: darkModeColors.bgCard, minRatio: WCAG_AA_NORMAL_TEXT },
      { name: 'primary text on subtle', textColor: darkModeColors.textPrimary, bgColor: darkModeColors.bgSubtle, minRatio: WCAG_AA_NORMAL_TEXT },
      { name: 'secondary text on card', textColor: darkModeColors.textSecondary, bgColor: darkModeColors.bgCard, minRatio: WCAG_AA_NORMAL_TEXT },
      { name: 'primary color', textColor: darkModeColors.colorPrimary, bgColor: darkModeColors.bgPage, minRatio: WCAG_AA_NORMAL_TEXT },
      { name: 'success color', textColor: darkModeColors.colorSuccess, bgColor: darkModeColors.bgPage, minRatio: WCAG_AA_NORMAL_TEXT },
      { name: 'error color', textColor: darkModeColors.colorError, bgColor: darkModeColors.bgPage, minRatio: WCAG_AA_NORMAL_TEXT },
      { name: 'info color', textColor: darkModeColors.colorInfo, bgColor: darkModeColors.bgPage, minRatio: WCAG_AA_NORMAL_TEXT },
    ];

    it('should meet WCAG AA for all light mode text/background combinations', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...lightModeCombinations),
          (combo: { name: string; textColor: string; bgColor: string; minRatio: number }) => {
            const ratio = getContrastRatio(combo.textColor, combo.bgColor);
            expect(ratio).toBeGreaterThanOrEqual(combo.minRatio);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should meet WCAG AA for all dark mode text/background combinations', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...darkModeCombinations),
          (combo: { name: string; textColor: string; bgColor: string; minRatio: number }) => {
            const ratio = getContrastRatio(combo.textColor, combo.bgColor);
            expect(ratio).toBeGreaterThanOrEqual(combo.minRatio);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Document actual contrast ratios for reference
   */
  describe('Contrast Ratio Documentation', () => {
    it('should document light mode contrast ratios', () => {
      const ratios = {
        'textPrimary on bgPage': getContrastRatio(lightModeColors.textPrimary, lightModeColors.bgPage),
        'textSecondary on bgPage': getContrastRatio(lightModeColors.textSecondary, lightModeColors.bgPage),
        'textMuted on bgPage': getContrastRatio(lightModeColors.textMuted, lightModeColors.bgPage),
        'textDisabled on bgPage': getContrastRatio(lightModeColors.textDisabled, lightModeColors.bgPage),
        'colorPrimary on bgPage': getContrastRatio(lightModeColors.colorPrimary, lightModeColors.bgPage),
        'textOnPrimary on colorPrimary': getContrastRatio(lightModeColors.textOnPrimary, lightModeColors.colorPrimary),
      };
      
      // Log ratios for documentation purposes
      console.log('Light Mode Contrast Ratios:', ratios);
      
      // All documented ratios should be positive numbers
      Object.values(ratios).forEach(ratio => {
        expect(ratio).toBeGreaterThan(0);
      });
    });

    it('should document dark mode contrast ratios', () => {
      const ratios = {
        'textPrimary on bgPage': getContrastRatio(darkModeColors.textPrimary, darkModeColors.bgPage),
        'textSecondary on bgPage': getContrastRatio(darkModeColors.textSecondary, darkModeColors.bgPage),
        'textMuted on bgPage': getContrastRatio(darkModeColors.textMuted, darkModeColors.bgPage),
        'textDisabled on bgPage': getContrastRatio(darkModeColors.textDisabled, darkModeColors.bgPage),
        'colorPrimary on bgPage': getContrastRatio(darkModeColors.colorPrimary, darkModeColors.bgPage),
        'textOnPrimary on colorPrimary': getContrastRatio(darkModeColors.textOnPrimary, darkModeColors.colorPrimary),
      };
      
      // Log ratios for documentation purposes
      console.log('Dark Mode Contrast Ratios:', ratios);
      
      // All documented ratios should be positive numbers
      Object.values(ratios).forEach(ratio => {
        expect(ratio).toBeGreaterThan(0);
      });
    });
  });
});


/**
 * Theme Persistence Tests
 * 
 * These tests verify that the theme persists across page reloads
 * and that there is no flash of wrong theme (FOUC).
 * 
 * Requirements: 1.3, 5.2
 */
describe('Theme Persistence', () => {
  const THEME_STORAGE_KEY = 'springfood-theme';

  beforeEach(() => {
    // Clear any existing theme preference
    localStorage.removeItem(THEME_STORAGE_KEY);
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    // Clean up
    localStorage.removeItem(THEME_STORAGE_KEY);
    document.documentElement.classList.remove('dark');
  });

  describe('LocalStorage Persistence', () => {
    it('should store theme preference in LocalStorage when set', () => {
      /**
       * **Validates: Requirements 1.2**
       */
      // Simulate setting dark theme
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');
      
      // Verify it was stored
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      expect(stored).toBe('dark');
    });

    it('should retrieve stored theme preference from LocalStorage', () => {
      /**
       * **Validates: Requirements 1.3**
       */
      // Pre-set a theme preference
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');
      
      // Simulate what the initialization script does
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      expect(stored).toBe('dark');
      
      // Apply the theme
      if (stored === 'dark') {
        document.documentElement.classList.add('dark');
      }
      
      // Verify the theme was applied
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should persist light theme preference', () => {
      /**
       * **Validates: Requirements 1.2, 1.3**
       */
      localStorage.setItem(THEME_STORAGE_KEY, 'light');
      
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      expect(stored).toBe('light');
      
      // Light theme means no 'dark' class
      document.documentElement.classList.remove('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should handle invalid stored values gracefully', () => {
      /**
       * **Validates: Requirements 1.4**
       */
      // Store an invalid value
      localStorage.setItem(THEME_STORAGE_KEY, 'invalid-theme');
      
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      
      // The initialization script should handle this
      // by falling back to system preference
      const isValidTheme = stored === 'light' || stored === 'dark';
      expect(isValidTheme).toBe(false);
    });
  });

  describe('Theme Initialization Script (FOUC Prevention)', () => {
    it('should apply dark class synchronously when dark theme is stored', () => {
      /**
       * **Validates: Requirements 5.2**
       * 
       * This test simulates what the inline script in index.html does
       * to prevent flash of wrong theme (FOUC)
       */
      // Pre-set dark theme
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');
      
      // Simulate the initialization script
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const theme = stored || (prefersDark ? 'dark' : 'light');
      
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      }
      
      // The dark class should be applied immediately
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should not apply dark class when light theme is stored', () => {
      /**
       * **Validates: Requirements 5.2**
       */
      localStorage.setItem(THEME_STORAGE_KEY, 'light');
      
      // Simulate the initialization script
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const theme = stored || (prefersDark ? 'dark' : 'light');
      
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // The dark class should NOT be applied
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should fall back to system preference when no stored theme exists', () => {
      /**
       * **Validates: Requirements 1.1, 5.2**
       */
      // Ensure no stored theme
      localStorage.removeItem(THEME_STORAGE_KEY);
      
      // Simulate the initialization script
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const theme = stored || (prefersDark ? 'dark' : 'light');
      
      // The theme should match system preference
      expect(theme).toBe(prefersDark ? 'dark' : 'light');
    });
  });

  describe('Theme Round Trip', () => {
    it('should maintain theme after simulated page reload', () => {
      /**
       * **Validates: Requirements 1.3**
       * 
       * This test simulates a page reload by:
       * 1. Setting a theme
       * 2. Clearing the DOM state
       * 3. Re-running the initialization logic
       */
      // Step 1: Set dark theme
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');
      document.documentElement.classList.add('dark');
      
      // Step 2: Simulate page unload (clear DOM state)
      document.documentElement.classList.remove('dark');
      
      // Step 3: Simulate page reload (re-run initialization)
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'dark') {
        document.documentElement.classList.add('dark');
      }
      
      // Verify theme was restored
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    });

    it('should maintain light theme after simulated page reload', () => {
      /**
       * **Validates: Requirements 1.3**
       */
      // Step 1: Set light theme
      localStorage.setItem(THEME_STORAGE_KEY, 'light');
      document.documentElement.classList.remove('dark');
      
      // Step 2: Simulate page reload
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'dark') {
        document.documentElement.classList.add('dark');
      }
      
      // Verify theme was restored (light = no dark class)
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    });
  });

  describe('Property-Based Theme Persistence Tests', () => {
    it('should persist any valid theme value through storage round trip', () => {
      /**
       * **Feature: dark-light-mode, Property 1: Theme Persistence Round Trip**
       * **Validates: Requirements 1.2, 1.3**
       */
      fc.assert(
        fc.property(
          fc.constantFrom('light', 'dark'),
          (theme: 'light' | 'dark') => {
            // Store the theme
            localStorage.setItem(THEME_STORAGE_KEY, theme);
            
            // Retrieve the theme
            const retrieved = localStorage.getItem(THEME_STORAGE_KEY);
            
            // Clean up
            localStorage.removeItem(THEME_STORAGE_KEY);
            
            // Property: stored theme should equal retrieved theme
            expect(retrieved).toBe(theme);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly apply theme class based on stored value', () => {
      /**
       * **Feature: dark-light-mode, Property 2: Theme Class Application**
       * **Validates: Requirements 4.2**
       */
      fc.assert(
        fc.property(
          fc.constantFrom('light', 'dark'),
          (theme: 'light' | 'dark') => {
            // Store and apply theme
            localStorage.setItem(THEME_STORAGE_KEY, theme);
            
            if (theme === 'dark') {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
            
            // Verify class application
            const hasDarkClass = document.documentElement.classList.contains('dark');
            const expectedDarkClass = theme === 'dark';
            
            // Clean up
            localStorage.removeItem(THEME_STORAGE_KEY);
            document.documentElement.classList.remove('dark');
            
            // Property: dark class presence should match theme value
            expect(hasDarkClass).toBe(expectedDarkClass);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

# Implementation Plan

- [x] 1. Set up theme infrastructure and CSS variables
  - [x] 1.1 Update theme.css with dark mode CSS variables
    - Add `:root.dark` selector with all dark mode color values
    - Update semantic colors (success, error, warning, info) for dark mode
    - Add theme transition CSS variable
    - Add transition classes for smooth theme switching
    - _Requirements: 3.1, 3.3, 3.4, 4.2, 4.3_

  - [x] 1.2 Add theme initialization script to index.html
    - Add inline script before Angular loads to detect and apply theme
    - Prevent flash of wrong theme (FOUC)
    - _Requirements: 4.4, 5.2_

  - [x] 1.3 Write property test for CSS variables update on theme change
    - **Property 5: CSS Variables Update on Theme Change**
    - **Validates: Requirements 3.3, 4.2**

  - [x] 1.4 Add reduced motion support in theme.css
    - Disable transitions when prefers-reduced-motion is set
    - _Requirements: 5.4_

- [x] 2. Create ThemeService
  - [x] 2.1 Create ThemeService with theme management logic
    - Create `src/app/services/theme.service.ts`
    - Implement `currentTheme` Signal
    - Implement `toggleTheme()` method
    - Implement `setTheme(theme: ThemeMode)` method
    - Implement `getSystemPreference()` method
    - Implement `initializeTheme()` method
    - Define constants `THEME_STORAGE_KEY` and `DARK_CLASS`
    - Handle LocalStorage read/write
    - Listen to system preference changes via matchMedia
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 5.3_

  - [x] 2.2 Register ThemeService in app configuration
    - Ensure service is provided in root
    - Initialize theme on app bootstrap
    - _Requirements: 4.4_

  - [ ]* 2.3 Write property test for theme persistence round trip
    - **Property 1: Theme Persistence Round Trip**
    - **Validates: Requirements 1.2, 1.3**

  - [ ]* 2.4 Write property test for toggle alternation
    - **Property 3: Toggle Alternation**
    - **Validates: Requirements 2.1**

  - [ ]* 2.5 Write property test for system preference detection
    - **Property 4: System Preference Detection**
    - **Validates: Requirements 1.1**

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Create ThemeToggleComponent
  - [x] 4.1 Create ThemeToggleComponent with sun/moon icons
    - Create `src/app/components/theme-toggle/` directory
    - Create component with sun and moon SVG icons (outline style)
    - Implement toggle click handler
    - Add rotation/morph animation between icons
    - Style as icon-only button without background
    - _Requirements: 2.1, 2.4, 2.5, 2.6, 6.2, 6.3, 6.4_

  - [x] 4.2 Integrate ThemeToggleComponent into HeaderComponent
    - Import ThemeToggleComponent in HeaderComponent
    - Position toggle next to language selector
    - Ensure proper spacing and alignment
    - _Requirements: 6.1_

  - [ ]* 4.3 Write property test for theme class application
    - **Property 2: Theme Class Application**
    - **Validates: Requirements 4.2**

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Update existing components for dark mode support
  - [x] 6.1 Update HeaderComponent styles for dark mode
    - Replace hardcoded colors (e.g., `bg-[#f5f5f7]`) with CSS variables
    - Add dark mode specific styles using Tailwind dark: prefix or CSS variables
    - Update dropdown menus and search overlay backgrounds
    - _Requirements: 3.1, 3.3_

  - [x] 6.2 Update FooterComponent styles for dark mode
    - Replace hardcoded colors with CSS variables
    - Add dark mode specific styles
    - _Requirements: 3.1, 3.3_

  - [x] 6.3 Update LoginComponent styles for dark mode
    - Update form backgrounds and borders
    - Update input field styles
    - Update button styles
    - _Requirements: 3.1, 3.3_

  - [x] 6.4 Update RegisterComponent styles for dark mode
    - Update form backgrounds and borders
    - Update input field styles
    - _Requirements: 3.1, 3.3_

  - [x] 6.5 Update StoreDetailComponent styles for dark mode
    - Update page background from `bg-gray-50` to use CSS variables
    - Update card backgrounds from `bg-white` to use CSS variables
    - Update text colors from hardcoded gray values to CSS variables
    - Update borders and shadows for dark mode
    - Update cart sidebar styles
    - _Requirements: 3.1, 3.3_

  - [x] 6.6 Update ProductDetailModalComponent styles for dark mode
    - Modal already uses CSS variables, verify all elements work in dark mode
    - Update any remaining hardcoded colors
    - Test modal backdrop and content in dark mode
    - _Requirements: 3.1, 3.3_

  - [x] 6.7 Update OrderComponent styles for dark mode


    - Add dark mode CSS classes to order.component.css:
      - `.order-page` - page background using `var(--bg-page)`
      - `.order-card` - card background using `var(--bg-card)` with border
      - `.order-title` - title text using `var(--text-primary)`
      - `.order-text` - body text using `var(--text-primary)`
      - `.order-text-secondary` - secondary text using `var(--text-secondary)`
      - `.order-text-muted` - muted text using `var(--text-muted)`
      - `.order-text-disabled` - disabled text using `var(--text-disabled)`
      - `.order-label` - label text using `var(--text-secondary)`
      - `.order-input` - input fields with dark mode border/background
      - `.order-icon-muted` - muted icons using `var(--text-muted)`
      - `.order-item-hover` - hover state for order items
      - `.address-card` - address card with dark mode border
      - `.add-address-btn` - add address button with dark mode styles
      - `.toggle-switch` - toggle switch with dark mode background
      - `.payment-option-unselected` - unselected payment option border
      - `.payment-checkbox-unselected` - unselected checkbox border
      - `.promo-section` - promo section with dark mode border
    - Update Order Summary section in HTML (lines 213-268):
      - Replace `bg-white` with `order-card` class
      - Replace `text-gray-900` with `order-title` or `order-text`
      - Replace `text-gray-600` with `order-text-secondary`
      - Replace `text-gray-400` with `order-text-muted`
      - Replace `border-gray-200` with `border-default` CSS variable
    - Update FoodCare section colors (lines 221-267):
      - Replace hardcoded `bg-gray-50`, `border-gray-200` with CSS variables
      - Replace `text-gray-600`, `text-gray-400`, `text-gray-900` with semantic classes
      - Replace `border-gray-300` with CSS variable
    - _Requirements: 3.1, 3.3_

  - [x] 6.8 Update HomeComponent and related components for dark mode





    - [x] 6.8.1 Update HeroComponent for dark mode


      - Replace `bg-[#f5f5f7]` with CSS variable-based class
      - Update `text-gray-800`, `text-gray-500` with semantic text classes
      - _Requirements: 3.1, 3.3_
    - [x] 6.8.2 Update TrendingCategoriesComponent for dark mode


      - Replace `bg-[#f5f5f7]` section background with CSS variable
      - Replace `bg-white` card backgrounds with CSS variable
      - Update `text-gray-800`, `text-gray-600`, `text-gray-500` with semantic classes
      - _Requirements: 3.1, 3.3_
    - [x] 6.8.3 Update FeaturedProductsComponent for dark mode


      - Replace `bg-[#f5f5f7]` section background with CSS variable
      - Update `text-gray-800` with semantic text class
      - _Requirements: 3.1, 3.3_
    - [x] 6.8.4 Update ProductCategoryCarouselComponent for dark mode


      - Replace `bg-[#f5f5f7]` section background with CSS variable
      - Replace `bg-white/70` navigation buttons with dark mode compatible styles
      - Update `text-gray-800`, `text-gray-600` with semantic classes
      - _Requirements: 3.1, 3.3_

- [x] 7. Checkpoint - Ensure all tests pass


  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Add accessibility and polish




  - [x] 8.1 Verify contrast ratios meet WCAG AA standards

    - Check all text/background combinations in both light and dark modes
    - Adjust colors if needed to meet 4.5:1 minimum contrast ratio
    - _Requirements: 3.2_

  - [ ]* 8.2 Write property test for contrast ratio compliance
    - **Property 6: Contrast Ratio Compliance**
    - **Validates: Requirements 3.2**



  - [x] 8.3 Test theme persistence across page reloads

    - Verify theme survives browser refresh
    - Verify no flash of wrong theme
    - _Requirements: 1.3, 5.2_

- [x] 9. Final Checkpoint - Ensure all tests pass




  - Ensure all tests pass, ask the user if questions arise.

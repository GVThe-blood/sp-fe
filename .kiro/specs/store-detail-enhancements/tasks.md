# Implementation Plan

- [x] 1. Create StarRatingComponent for reusable rating display
  - Create standalone component with inputs for rating value, size, and showNumber flag
  - Implement star rendering logic with 5 stars and proportional fill calculation
  - Add CSS styling for yellow filled stars and gray empty stars using Tailwind
  - Support partial star fills using CSS clip-path or linear gradients
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 1.1 Write property test for star rating rendering
  - **Property 1: Star rating completeness and proportionality**
  - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**

- [x] 2. Add store banner image to StoreDetailComponent
  - Add bannerImage property to StoreInfo interface
  - Update mock storeInfo data with banner image URL
  - Create full-width banner container in template above store information
  - Apply fixed height (200px mobile, 250px desktop) with object-fit cover styling
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 3. Implement favorite functionality with state management
  - Add favoriteProducts signal (Set<number>) to track favorited product IDs
  - Add isStoreFavorite signal (boolean) for store favorite state
  - Implement toggleStoreFavorite() method to toggle store favorite
  - Implement toggleProductFavorite(productId) method to toggle product favorite
  - Update template to use filled red heart when favorited, outline gray when not
  - Add CSS transitions for smooth color and scale animations on favorite toggle
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 3.1 Write property test for favorite state toggle
  - **Property 2: Favorite state toggle consistency**
  - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.6**

- [x] 4. Integrate StarRatingComponent into store and product displays
  - Replace simple rating display in store header with StarRatingComponent
  - Replace rating display in product cards with StarRatingComponent
  - Pass appropriate size prop (md for store, sm for products)
  - Ensure numeric rating is displayed alongside stars
  - _Requirements: 2.1, 2.6_

- [x] 5. Fix category tag navigation with scroll functionality
  - Update scrollToCategory() method to use smooth scroll behavior
  - Add activeCategory signal to track currently active category
  - Implement scroll event listener with Intersection Observer API
  - Update category tag styling to highlight active category
  - Ensure tag order matches category section order in the page
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 5.1 Write property test for category navigation
  - **Property 3: Category navigation and highlighting**
  - **Validates: Requirements 4.1, 4.4, 6.4**

- [x] 5.2 Write property test for scroll-based category tracking
  - **Property 4: Scroll-based active category tracking**
  - **Validates: Requirements 4.3, 4.5, 6.3**

- [x] 6. Create ProductDetailModalComponent
  - Create standalone modal component with product input and event outputs
  - Design modal layout with product image, name, price, rating, sold count
  - Add customer note textarea input field
  - Implement modal open/close functionality with backdrop click handling
  - Add fade-in/fade-out animations using CSS transitions
  - Prevent body scroll when modal is open
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.10_

- [x] 6.1 Write unit tests for modal open/close behavior
  - Test modal opens when product is provided
  - Test modal closes on backdrop click
  - Test modal closes on close button click
  - _Requirements: 5.1, 5.2, 5.10_

- [x] 7. Add customization options to ProductDetailModal
  - Create CustomizationGroup and CustomizationOption interfaces
  - Add customizationGroups property to Product interface
  - Implement radio button groups for customization options in modal
  - Display option names and price modifiers (if non-zero)
  - Add selectedOptions signal (Map<string, string>) to track selections
  - _Requirements: 5.5, 5.6_

- [x] 8. Implement quantity controls and price calculation in modal
  - Add quantity signal with initial value of 1
  - Create increment/decrement buttons for quantity adjustment
  - Implement totalPrice computed signal: (basePrice + sum(optionModifiers)) × quantity
  - Display calculated total price on add-to-cart button
  - Update price display when options or quantity changes
  - _Requirements: 5.7, 5.8_

- [x] 8.1 Write property test for price calculation
  - **Property 6: Customization price calculation**
  - **Validates: Requirements 5.6, 5.7**

- [x] 9. Connect modal to store detail page
  - Add selectedProduct signal to StoreDetailComponent
  - Add isModalOpen signal to control modal visibility
  - Implement openProductModal(product) method
  - Update product card click handlers to open modal
  - Update add button click handlers to open modal
  - Pass selectedProduct to ProductDetailModal component
  - _Requirements: 5.1, 5.2_

- [x] 9.1 Write property test for modal product data integrity
  - **Property 5: Modal product data integrity**
  - **Validates: Requirements 5.1, 5.2, 5.3, 5.5, 6.5**

- [x] 10. Implement add-to-cart from modal with cart synchronization
  - Update CartItem interface to include selectedOptions map
  - Implement handleAddToCart(cartItem) method in StoreDetailComponent
  - Add addToCart output event emitter in ProductDetailModal
  - Emit cart item with product, quantity, note, and selectedOptions on button click
  - Update cart display immediately when item is added
  - Close modal after successful add
  - _Requirements: 5.9, 6.1_

- [x] 10.1 Write property test for cart synchronization
  - **Property 7: Cart item addition and synchronization**
  - **Validates: Requirements 5.9, 6.1**

- [x] 10.2 Write property test for cart total calculation
  - **Property 8: Cart total calculation**
  - **Validates: Requirements 6.2**

- [x] 10.3 Write property test for add-to-cart success feedback
  - **Property 9: Add-to-cart success feedback**
  - **Validates: Requirements 7.2, 7.3**

- [x] 11. Polish modal animations and transitions
  - Implement modal fade-in animation (opacity 0→1, scale 0.95→1) in CSS
  - Implement modal fade-out animation (opacity 1→0, scale 1→0.95) in CSS
  - Ensure all transitions use ease-out timing function
  - Add smooth backdrop fade transitions
  - _Requirements: 3.5, 7.1, 7.4, 7.5, 7.6_

- [x] 12. Optimize responsive design for modal
  - Make modal full-screen on mobile (below 768px breakpoint)
  - Make modal centered dialog on desktop (above 768px breakpoint)
  - Ensure modal content is scrollable on small screens
  - Test modal interactions on various screen sizes
  - _Requirements: 4.3, 4.5, 6.3_

- [x] 13. Implement error handling and validation
  - Add image error handling with fallback images for banner and products
  - Implement validation for required customization options
  - Add debouncing to prevent rapid add-to-cart clicks (500ms)
  - Handle null/undefined product data gracefully in modal
  - _Requirements: 5.7, 5.9_

- [x] 14. Final integration and testing checkpoint
  - Ensure all tests pass, ask the user if questions arise
  - Test complete user flow: browse → click product → customize → add to cart
  - Verify cart updates correctly with all product configurations
  - Test scroll synchronization with category tags
  - Verify favorite state persists during component lifecycle
  - Test responsive behavior on mobile and desktop viewports
  - Verify all animations play smoothly without blocking interactions
  - Test error handling for image loading failures
  - Verify debouncing prevents rapid add-to-cart clicks

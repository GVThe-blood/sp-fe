# Implementation Plan

- [x] 1. Create DeviceIdService for UUID management

  - [x] 1.1 Create DeviceIdService with UUID v4 generation and LocalStorage management
    - Create `src/app/services/device-id.service.ts`
    - Implement `getDeviceId()` method that retrieves or generates UUID
    - Implement `hasDeviceId()` method to check existence
    - Implement `generateUUID()` method using crypto API
    - Define constants `DEVICE_ID_KEY` and `UUID_V4_PATTERN`
    - Handle LocalStorage unavailability gracefully
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 1.2 Write property test for Device ID round trip consistency






    - **Property 1: Device ID Round Trip Consistency**
    - **Validates: Requirements 1.1, 1.2**

  - [ ]* 1.3 Write property test for UUID v4 format validity
    - **Property 2: UUID v4 Format Validity**
    - **Validates: Requirements 1.3**

- [x] 2. Create DeviceIdInterceptor for automatic header attachment

  - [x] 2.1 Create DeviceIdInterceptor HTTP interceptor
    - Create `src/app/interceptors/device-id.interceptor.ts`
    - Implement `HttpInterceptorFn` that attaches `X-Device-Id` header
    - Define cart API URL patterns for selective header attachment
    - Inject DeviceIdService to get current Device ID
    - Handle cases where Device ID is unavailable
    - _Requirements: 2.1, 2.3, 2.4_

  - [x] 2.2 Register interceptor in app configuration
    - Update `src/app/app.config.ts` to include the interceptor
    - Ensure interceptor is registered with `provideHttpClient(withInterceptors([...]))`
    - _Requirements: 2.1_

  - [x] 2.3 Write property test for cart API header attachment






    - **Property 3: Cart API Header Attachment**
    - **Validates: Requirements 2.1, 2.4, 5.2**

  - [ ]* 2.4 Write property test for authenticated request headers
    - **Property 4: Authenticated Request Headers**
    - **Validates: Requirements 2.2**

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Enhance CartService with merge functionality

  - [x] 4.1 Add merge cart interfaces and types
    - Add `MergeCartRequest`, `MergeCartResponse`, `AdjustedItem` interfaces to cart.service.ts
    - Define API endpoint constants
    - _Requirements: 3.2_

  - [x] 4.2 Implement mergeGuestCart method
    - Add `mergeGuestCart(): Observable<MergeCartResponse>` method
    - Call POST `/api/v1/cart/merge` with Device ID in body
    - Handle success and error responses
    - Inject DeviceIdService for Device ID retrieval
    - _Requirements: 3.2, 3.3_

  - [x] 4.3 Implement cart refresh after merge
    - Add logic to call `getCart()` after successful merge
    - Update local cart state with merged data
    - _Requirements: 3.3_

  - [x] 4.4 Implement clearLocalCart method for logout
    - Add `clearLocalCart()` method that clears cart state
    - Ensure Device ID is NOT deleted from LocalStorage
    - _Requirements: 5.3_

  - [x] 4.5 Write property test for merge API call format






    - **Property 5: Merge API Call Format**
    - **Validates: Requirements 3.2**

  - [ ]* 4.6 Write property test for post-merge cart refresh
    - **Property 6: Post-Merge Cart Refresh**
    - **Validates: Requirements 3.3**

  - [ ]* 4.7 Write property test for Device ID persistence after merge
    - **Property 7: Device ID Persistence After Merge**
    - **Validates: Requirements 3.5**

  - [ ]* 4.8 Write property test for logout cart state isolation
    - **Property 8: Logout Cart State Isolation**
    - **Validates: Requirements 5.3**

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Integrate merge flow into LoginComponent

  - [x] 6.1 Update LoginComponent to call merge after successful login
    - Inject CartService into LoginComponent
    - After receiving JWT token, call `cartService.mergeGuestCart()`
    - Handle merge response before redirecting
    - _Requirements: 3.1_

  - [x] 6.2 Implement merge error handling
    - Log errors but don't block login flow
    - Continue with redirect even if merge fails
    - _Requirements: 3.4_

  - [x] 6.3 Implement merge notification display
    - Check for `adjustedItems` in merge response
    - Display toast notification if items were adjusted
    - Show affected items and reasons
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ]* 6.4 Write unit tests for login merge integration
    - Test merge is called after successful login
    - Test error handling doesn't block login
    - Test notification display logic
    - _Requirements: 3.1, 3.4, 4.1_

- [x] 7. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

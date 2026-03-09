# Implementation Plan

## Phase 1: Foundation & Shared Components ✅

- [x] 1. Create ProfileSidebarComponent
  - [x] 1.1 Create component files (ts, html, css)
    - Define MenuItem interface with id, label, icon, route, isSpecial, saleEventName
    - Implement menu items: Sale, Thông tin cá nhân, Giỏ hàng, Sản phẩm yêu thích, Vouchers, Đơn hàng, Cửa hàng của tôi
    - Add user avatar and name display at top
    - Add Settings and Logout at bottom
    - _Requirements: 5.1, 5.2, 5.5_
  - [x] 1.2 Implement Sale menu item with special styling
    - Show sale event name when active (e.g., "11/11")
    - Show "Sale" as default when no active event
    - Add decorative styling for sale events
    - _Requirements: 5.3, 5.4_
  - [x] 1.3 Style sidebar with design system CSS variables
    - Use --bg-card, --text-primary, --border-default
    - Implement active state with --color-primary
    - Add hover effects with --bg-hover
    - _Requirements: 2.1, 2.3, 6.2_

- [x] 2. Update Profile Page to use shared sidebar
  - [x] 2.1 Import and integrate ProfileSidebarComponent
    - Replace inline sidebar with shared component
    - Pass user data and active route
    - _Requirements: 1.1, 2.1_
  - [x] 2.2 Color theme consistency already implemented
    - All CSS uses design system variables
    - Dark mode compatible
    - _Requirements: 2.1, 2.2_

- [x] 3. Update My Store Page layout
  - [x] 3.1 Show sidebar when user has no store
    - Display sidebar alongside "Create Store" content
    - Highlight "Cửa hàng của tôi" as active
    - _Requirements: 1.1, 1.2_
  - [x] 3.2 Color theme and styling already implemented
    - Uses design system CSS variables
    - Matches website color scheme
    - _Requirements: 2.1, 2.2_
  - [x] 3.3 Mobile responsive navigation implemented
    - Responsive sidebar layout
    - _Requirements: 1.3_

## Phase 2: Address Management System

- [x] 4. Create LocationService for Vietnam addresses
  - [x] 4.1 Create service with mock data
    - Define Province, District, Ward interfaces
    - Add mock data for provinces, districts, wards
    - Implement getProvinces(), getDistrictsByProvince(), getWardsByDistrict()
    - _Requirements: 3.6, 3.7_
  - [x] 4.2 Write property test for cascading filter
    - **Property 3: Cascading Province-District Filter**
    - **Property 4: Cascading District-Ward Filter**
    - **Validates: Requirements 3.6, 3.7**

- [x] 5. Update UserService for address management




  - [x] 5.1 Extend User model with addresses array


    - Add addresses: Address[] field with full Address interface
    - Add defaultAddressId field
    - Update mock user data with sample addresses
    - _Requirements: 3.1, 3.2_
  - [x] 5.2 Implement address CRUD methods


    - addAddress(address: Address): void
    - updateAddress(id: string, address: Partial<Address>): void
    - deleteAddress(id: string): void
    - setDefaultAddress(id: string): void
    - getAddressesSorted(): Address[] (default first)
    - _Requirements: 3.3, 3.4, 3.5_
  - [x] 5.3 Write property test for default address ordering


    - **Property 2: Default Address Ordering**
    - **Validates: Requirements 3.2**

- [x] 6. Create AddressCardComponent





  - [x] 6.1 Create component files (ts, html, css)


    - Define AddressCardProps interface
    - Display recipient name, phone, full address
    - Show "Mặc định" badge for default address
    - _Requirements: 3.1, 3.2_
  - [x] 6.2 Add action buttons (edit, set default, delete)


    - Use material-symbols-outlined icons (edit, star, delete)
    - Add hover effects and loading states
    - Emit events for parent component
    - _Requirements: 3.3, 6.1, 6.3_
-

- [x] 7. Create AddressFormModalComponent



  - [x] 7.1 Create modal component files (ts, html, css)


    - Create modal structure with backdrop
    - Add form fields: recipient name, phone, street address
    - _Requirements: 3.4, 3.5_
  - [x] 7.2 Implement cascading location selects


    - Province select with search/filter
    - District select filtered by selected province
    - Ward select filtered by selected district
    - Use LocationService for data
    - _Requirements: 3.6, 3.7_
  - [x] 7.3 Add form validation


    - Validate required fields (name, phone, province, district, ward, street)
    - Show validation errors
    - Disable save button when invalid
    - _Requirements: 6.3, 6.5_
  - [x] 7.4 Implement save and cancel actions


    - Emit save event with complete address
    - Show loading state during save
    - Close modal on cancel or successful save
    - _Requirements: 3.4, 3.5_

- [x] 8. Integrate address management into Profile page




  - [x] 8.1 Update Profile component to use new address system


    - Import AddressCardComponent and AddressFormModalComponent
    - Get addresses from UserService
    - Display AddressCard for each address (sorted with default first)
    - _Requirements: 3.1, 3.2_
  - [x] 8.2 Wire up "Thêm địa chỉ mới" button

    - Open AddressFormModal with empty form
    - Handle save event to add new address
    - _Requirements: 3.5_
  - [x] 8.3 Wire up address card actions

    - Edit: Open AddressFormModal with existing address data
    - Set Default: Call UserService.setDefaultAddress()
    - Delete: Show confirmation, then call UserService.deleteAddress()
    - Show success/error toast notifications
    - _Requirements: 3.3, 3.4, 6.4_
  - [x] 8.4 Update Google Maps placeholder

    - Already exists in profile.component.html
    - Keep as placeholder for future integration
    - _Requirements: 3.8_

- [ ] 9. Checkpoint - Ensure address management works
  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: Avatar Management
-

- [x] 10. Create AvatarPickerModalComponent



  - [x] 10.1 Create modal component files (ts, html, css)


    - Create modal structure with backdrop
    - Define AvatarPickerModalProps interface
    - Add close button
    - _Requirements: 4.1, 4.2_
  - [x] 10.2 Add preset avatar grid

    - Display 8-12 preset avatar URLs in grid
    - Highlight currently selected avatar
    - Make avatars clickable to select
    - _Requirements: 4.2_
  - [x] 10.3 Add custom upload option

    - File input below preset grid
    - Accept only: image/jpeg, image/jpg, image/png, image/webp, image/gif
    - Show file type validation error for invalid types
    - Preview uploaded image
    - _Requirements: 4.3, 4.4_
  - [x] 10.4 Write property test for file type validation


    - **Property 5: Avatar File Type Validation**
    - **Validates: Requirements 4.4**
  - [x] 10.5 Implement save action

    - Emit selected avatar URL or uploaded file
    - Close modal on save
    - _Requirements: 4.5_

- [x] 11. Integrate avatar picker into Profile page







  - [x] 11.1 Update ProfileSidebarComponent with edit button


    - Add edit overlay on avatar in sidebar
    - Show camera/edit icon on hover
    - Emit event when clicked
    - _Requirements: 4.1_
  - [x] 11.2 Add AvatarPickerModal to Profile page


    - Import and add modal component
    - Open modal when sidebar avatar edit is clicked
    - Pass current avatar URL
    - _Requirements: 4.1, 4.2_
  - [x] 11.3 Connect avatar selection to UserService


    - Handle modal save event
    - Update user avatar via UserService.updateUser()
    - Update preview immediately
    - Show success notification
    - _Requirements: 4.5_

- [ ] 12. Checkpoint - Ensure avatar management works
  - Ensure all tests pass, ask the user if questions arise.

## Phase 4: UX Polish & Testing

- [x] 13. Add loading states and feedback






  - [x] 13.1 Create toast notification service


    - Create ToastService with show() method
    - Support success, error, info types
    - Auto-dismiss after timeout
    - _Requirements: 6.4_
  - [x] 13.2 Add loading states to address operations


    - Show spinner during save/delete
    - Disable buttons during operations
    - _Requirements: 6.3_
  - [x] 13.3 Add loading state to avatar upload


    - Show spinner during upload
    - Disable save button during upload
    - _Requirements: 6.3_
  - [x] 13.4 Add toast notifications for all actions


    - Address added/updated/deleted success
    - Avatar updated success
    - Error messages for failures
    - _Requirements: 6.4_
-

- [x] 14. Write property test for theme consistency



  - [x] 14.1 Create theme consistency property test

    - **Property 1: Theme Color Consistency**
    - Test that all components update colors on theme switch
    - **Validates: Requirements 2.2**
-

- [x] 15. Final Checkpoint - Ensure all features work



  - Ensure all tests pass, ask the user if questions arise.


## Phase 5: Store Dashboard for Store Owners

- [x] 16. Create StoreSidebarComponent
  - [x] 16.1 Create component files (ts, html, css)
    - Define StoreMenuItem interface with id, label, icon, route, section
    - Implement menu sections: HOẠT ĐỘNG, PHÂN TÍCH & TĂNG TRƯỞNG, QUẢN TRỊ
    - Add store name and username display at top
    - _Requirements: 7.2, 7.3_
  - [x] 16.2 Implement menu items for each section
    - HOẠT ĐỘNG: Vận chuyển, Quản lý Đơn hàng, Quản lý Sản phẩm
    - PHÂN TÍCH & TĂNG TRƯỞNG: Thống kê, Doanh thu, Phát triển, Chăm sóc Khách hàng
    - QUẢN TRỊ: Cài đặt Cửa hàng, Nguồn lực
    - _Requirements: 7.2_
  - [x] 16.3 Style sidebar with design system CSS variables
    - Use --bg-card, --text-primary, --border-default
    - Implement active state with --color-primary
    - Add section headers styling
    - _Requirements: 7.5_

- [x] 17. Update My Store Page to handle dashboard routing
  - [x] 17.1 Add conditional rendering based on user.hasStore
    - If hasStore === false: Show ProfileSidebar + "Create Store" content
    - If hasStore === true: Show StoreSidebar + Dashboard content
    - _Requirements: 7.1, 7.6_
  - [x] 17.2 Implement dashboard placeholder content
    - Create placeholder sections for each menu item
    - Display "Coming soon" or basic layout for each section
    - _Requirements: 7.4_
  - [x] 17.3 Add route guards for store access
    - Redirect users without store to create store page
    - _Requirements: 7.6_

- [x]* 18. Write property test for store dashboard access control
  - **Property 6: Store Dashboard Access Control**
  - **Validates: Requirements 7.6**

- [x] 19. Mobile responsive layout for Store Dashboard
  - [x] 19.1 Implement collapsible sidebar for mobile
    - Add hamburger menu button
    - Sidebar slides in/out on mobile
    - _Requirements: 7.7_
  - [x] 19.2 Responsive content area
    - Adjust layout for mobile screens
    - Ensure all menu items are accessible
    - _Requirements: 7.7_

- [x] 20. Final Checkpoint - Ensure Store Dashboard works
  - Ensure all tests pass, ask the user if questions arise.

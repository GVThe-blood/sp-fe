# Requirements Document

## Introduction

Cải thiện và mở rộng tính năng cho trang Profile và My Store, bao gồm quản lý địa chỉ giao hàng, chỉnh sửa avatar, cập nhật sidebar menu, và tối ưu hóa giao diện người dùng để phù hợp với design system của website.

## Glossary

- **Profile_Page**: Trang thông tin cá nhân của người dùng
- **My_Store_Page**: Trang quản lý cửa hàng của người dùng (khi chưa có store)
- **Store_Dashboard**: Dashboard quản lý cửa hàng (khi đã có store)
- **Store_Sidebar**: Menu điều hướng bên trái của Store Dashboard
- **Sidebar_Menu**: Menu điều hướng bên trái của trang Profile
- **Address_Card**: Component hiển thị một địa chỉ giao hàng
- **Avatar_Picker**: Modal cho phép chọn hoặc upload avatar
- **Cascading_Select**: Dropdown selection theo cấp bậc (Tỉnh → Huyện → Xã)
- **Sale_Menu_Item**: Menu item đặc biệt hiển thị các chương trình sale

## Requirements

### Requirement 1: My Store Page - Hiển thị Sidebar khi chưa có cửa hàng

**User Story:** As a user, I want to see the sidebar menu when viewing My Store page even if I don't have a store yet, so that I can navigate to other sections easily.

#### Acceptance Criteria

1. WHEN a user navigates to My Store page without having a store THEN the My_Store_Page SHALL display the sidebar menu alongside the "Create Store" content
2. WHEN the sidebar is displayed on My Store page THEN the My_Store_Page SHALL highlight the "Cửa hàng của tôi" menu item as active
3. WHEN viewing My Store page on mobile devices THEN the My_Store_Page SHALL provide a collapsible sidebar or bottom navigation

### Requirement 2: Color Theme Consistency

**User Story:** As a user, I want the Profile and My Store pages to use consistent colors with the rest of the website, so that I have a unified visual experience.

#### Acceptance Criteria

1. WHEN displaying Profile or My Store pages THEN the Profile_Page SHALL use CSS variables from the design system (--bg-card, --text-primary, --border-default, etc.)
2. WHEN the user switches between light and dark mode THEN the Profile_Page SHALL update all colors according to the theme CSS variables
3. WHEN displaying active menu items THEN the Sidebar_Menu SHALL use the primary color defined in the design system

### Requirement 3: Address Management System

**User Story:** As a user, I want to manage my delivery addresses with full CRUD operations, so that I can easily update my shipping information.

#### Acceptance Criteria

1. WHEN viewing the address section THEN the Profile_Page SHALL display a list of saved addresses as cards instead of editable input fields
2. WHEN a user has a default address THEN the Profile_Page SHALL display the default address at the top with a "Mặc định" badge
3. WHEN viewing an address card THEN the Address_Card SHALL display action buttons for edit, set as default, and delete
4. WHEN a user clicks the edit button on an address THEN the Profile_Page SHALL open an address edit form with cascading location selects
5. WHEN a user clicks "Thêm địa chỉ mới" THEN the Profile_Page SHALL open a new address form with empty cascading selects
6. WHEN selecting a province in the address form THEN the Cascading_Select SHALL filter districts to show only those belonging to the selected province
7. WHEN selecting a district THEN the Cascading_Select SHALL filter wards to show only those belonging to the selected district
8. WHEN a user wants to add address via map THEN the Profile_Page SHALL provide a placeholder section for Google Maps API integration

### Requirement 4: Avatar Management

**User Story:** As a user, I want to change my profile avatar by selecting from preset options or uploading my own image, so that I can personalize my profile.

#### Acceptance Criteria

1. WHEN viewing the profile section THEN the Profile_Page SHALL display an edit button overlay on the avatar image
2. WHEN a user clicks the avatar edit button THEN the Avatar_Picker SHALL open showing a grid of preset avatar options
3. WHEN a user wants to upload a custom avatar THEN the Avatar_Picker SHALL provide an upload option below the preset avatars
4. WHEN uploading an avatar THEN the Avatar_Picker SHALL accept only common image formats (jpg, jpeg, png, webp) and gif files
5. WHEN a user selects a preset avatar or uploads an image THEN the Profile_Page SHALL update the avatar preview immediately

### Requirement 5: Enhanced Sidebar Menu

**User Story:** As a user, I want access to more features from the sidebar menu, so that I can navigate to all important sections of my account.

#### Acceptance Criteria

1. WHEN displaying the sidebar menu THEN the Sidebar_Menu SHALL include menu items: Sale, Thông tin cá nhân, Giỏ hàng của tôi, Sản phẩm yêu thích, Vouchers, Đơn hàng, Cửa hàng của tôi
2. WHEN displaying the Sale menu item THEN the Sale_Menu_Item SHALL appear at the top of the menu list above "Thông tin cá nhân"
3. WHEN there is an active sale event (e.g., 11/11, 12/12) THEN the Sale_Menu_Item SHALL display the sale event name and decorative styling
4. WHEN there is no active sale event THEN the Sale_Menu_Item SHALL display "Sale" as the default text
5. WHEN the menu item "Lịch sử mua hàng" exists THEN the Sidebar_Menu SHALL rename it to "Đơn hàng"

### Requirement 6: UX Optimization

**User Story:** As a user, I want a clean and intuitive interface, so that I can easily use all features without confusion.

#### Acceptance Criteria

1. WHEN displaying action buttons THEN the Profile_Page SHALL use consistent icons from the existing icon set (material-symbols-outlined)
2. WHEN hovering over interactive elements THEN the Profile_Page SHALL provide visual feedback through color changes or subtle effects
3. WHEN performing actions like delete or set default THEN the Profile_Page SHALL show appropriate loading states
4. WHEN an action is completed THEN the Profile_Page SHALL provide visual confirmation of success
5. WHEN displaying forms THEN the Profile_Page SHALL show clear labels and placeholder text in Vietnamese

### Requirement 7: Store Dashboard for Store Owners

**User Story:** As a store owner, I want to access a dedicated dashboard to manage my store operations, so that I can efficiently handle orders, products, analytics, and customer relationships.

#### Acceptance Criteria

1. WHEN a user with an existing store clicks "Cửa hàng của tôi" in the sidebar THEN the system SHALL navigate to the Store_Dashboard page
2. WHEN the Store_Dashboard loads THEN the system SHALL display a Store_Sidebar with the following menu sections: HOẠT ĐỘNG (Vận chuyển, Quản lý Đơn hàng, Quản lý Sản phẩm), PHÂN TÍCH & TĂNG TRƯỞNG (Thống kê, Doanh thu, Phát triển, Chăm sóc Khách hàng), QUẢN TRỊ (Cài đặt Cửa hàng, Nguồn lực)
3. WHEN displaying the Store_Sidebar THEN the system SHALL show the store name and username at the top
4. WHEN a user clicks on a menu item in Store_Sidebar THEN the system SHALL highlight that item as active and display corresponding content
5. WHEN the Store_Dashboard is displayed THEN the system SHALL use the same design system CSS variables for consistent theming
6. WHEN a user without a store tries to access Store_Dashboard directly THEN the system SHALL redirect to the My_Store_Page with "Create Store" content
7. WHEN viewing Store_Dashboard on mobile devices THEN the system SHALL provide a responsive layout with collapsible sidebar

# Requirements Document

## Introduction

Tài liệu này mô tả các yêu cầu cải tiến UI/UX cho ứng dụng SpringFood, tập trung vào việc chuẩn hóa giao diện modal, cải thiện trải nghiệm người dùng trong trang đặt hàng, modal mã giảm giá, và trang chi tiết cửa hàng.

## Glossary

- **Modal**: Cửa sổ popup hiển thị nội dung bổ sung
- **Close Button**: Nút đóng modal với thiết kế thống nhất (hình tròn, nền trắng, icon X)
- **Quantity Controls**: Các nút +/- để điều chỉnh số lượng sản phẩm
- **Option Selector**: Các lựa chọn tùy chỉnh sản phẩm (size, nhiệt độ, topping)
- **Promo Code**: Mã giảm giá có thể áp dụng cho đơn hàng
- **FoodCare Insurance**: Bảo hiểm đơn hàng với dropdown xác nhận
- **Disabled State**: Trạng thái không thể tương tác của một element

## Requirements

### Requirement 1

**User Story:** As a user, I want all modals to have a consistent close button design, so that I can easily recognize and close any modal.

#### Acceptance Criteria

1. WHEN any modal is displayed THEN the system SHALL render a circular white close button with X icon in the top-right corner
2. WHEN the close button is rendered THEN the system SHALL position it overlapping the modal corner with shadow effect
3. WHEN the close button is hovered THEN the system SHALL apply a subtle scale animation

### Requirement 2

**User Story:** As a user, I want the product modal quantity controls to be smaller and color-coded, so that I can easily distinguish between decrease and increase actions.

#### Acceptance Criteria

1. WHEN quantity controls are displayed THEN the system SHALL render smaller buttons (reduced from current size)
2. WHEN the decrease button is rendered THEN the system SHALL apply the website's orange color (--color-primary)
3. WHEN the increase button is rendered THEN the system SHALL apply the website's green color (--color-success)
4. WHEN option selectors are displayed THEN the system SHALL use rounded square checkboxes instead of circular radio buttons
5. WHEN option selectors are rendered THEN the system SHALL match the checkbox style from promo code component (same size, border-radius)

### Requirement 3

**User Story:** As a user, I want the store detail page to have a smaller favorite button and include footer, so that the page looks more balanced.

#### Acceptance Criteria

1. WHEN the favorite shop button is displayed THEN the system SHALL render it in a smaller, more compact size
2. WHEN the store detail page is rendered THEN the system SHALL include the footer component at the bottom

### Requirement 4

**User Story:** As a user, I want the FoodCare insurance section to be a collapsible dropdown with confirmation, so that I can understand and confirm the insurance before it's applied.

#### Acceptance Criteria

1. WHEN the payment section is displayed THEN the system SHALL render FoodCare insurance as a collapsible dropdown/select
2. WHEN the dropdown is expanded THEN the system SHALL display insurance information with a confirmation checkbox
3. WHEN the user confirms the insurance THEN the system SHALL change the section to green color indicating active status
4. WHEN the insurance is not confirmed THEN the system SHALL display the section in default/neutral color
5. WHEN the payment button is displayed THEN the system SHALL use the website's green color (--color-success)

### Requirement 5

**User Story:** As a user, I want the promo code modal to show detailed information and have proper selection limits, so that I can understand each promo and select appropriately.

#### Acceptance Criteria

1. WHEN a promo code does not meet requirements THEN the system SHALL display it in disabled state (grayed out, not clickable)
2. WHEN user clicks on the checkbox area of a promo THEN the system SHALL toggle the promo selection
3. WHEN user clicks on the promo information area THEN the system SHALL open a detail modal showing full promo information
4. WHEN the promo detail modal is displayed THEN the system SHALL show back arrow, promo image, title, expiry date, detailed conditions, and apply button
5. WHEN displaying promo codes THEN the system SHALL show maximum 10 codes per category
6. WHEN sorting promo codes THEN the system SHALL place available (non-disabled) codes above disabled codes
7. WHEN user selects promo codes THEN the system SHALL allow maximum 2 codes (1 delivery promo + 1 product promo)

### Requirement 6

**User Story:** As a user, I want the order items to display quantity separately and have vertically centered delete button, so that I can clearly see item quantities and easily remove items.

#### Acceptance Criteria

1. WHEN an order item is displayed THEN the system SHALL show quantity (e.g., "2X") as separate element from product name
2. WHEN the quantity indicator is rendered THEN the system SHALL position it vertically centered within the item card
3. WHEN the delete button is rendered THEN the system SHALL position it vertically centered within the item card

### Requirement 7

**User Story:** As a user, I want the payment method section to have smaller text, so that it matches the visual hierarchy of other components.

#### Acceptance Criteria

1. WHEN payment method options are displayed THEN the system SHALL use smaller font size than current
2. WHEN the section title "Hình thức ưu đãi và thanh toán" is displayed THEN the system SHALL maintain its current size


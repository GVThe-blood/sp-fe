# Requirements Document

## Introduction

Tính năng **Guest Cart Merge** cho phép hệ thống ghi nhớ giỏ hàng của khách vãng lai (chưa đăng nhập) và tự động hợp nhất giỏ hàng này với giỏ hàng của user khi họ đăng nhập. Điều này đảm bảo trải nghiệm mua sắm liền mạch - khách hàng không mất các sản phẩm đã thêm vào giỏ trước khi đăng nhập.

## Glossary

- **Device_ID**: Mã định danh duy nhất (UUID v4) được sinh ra và lưu trữ trong LocalStorage để nhận diện khách vãng lai
- **Guest_Cart**: Giỏ hàng của khách chưa đăng nhập, được định danh bằng Device_ID
- **User_Cart**: Giỏ hàng của user đã đăng nhập, được định danh bằng User_ID từ JWT token
- **Cart_Merge**: Quá trình hợp nhất giỏ hàng Guest vào giỏ hàng User
- **HTTP_Interceptor**: Middleware trong Angular để can thiệp vào mọi HTTP request/response
- **JWT_Token**: JSON Web Token chứa thông tin xác thực của user đã đăng nhập

## Requirements

### Requirement 1

**User Story:** As a guest user, I want my cart to be remembered across browser sessions, so that I don't lose my selected items when I close and reopen the browser.

#### Acceptance Criteria

1. WHEN the application starts for the first time THEN the Device_ID_Service SHALL generate a UUID v4 and store it in LocalStorage with key `x-device-id`
2. WHEN the application starts and a Device_ID already exists in LocalStorage THEN the Device_ID_Service SHALL retrieve and use the existing Device_ID
3. WHEN the Device_ID is generated THEN the Device_ID_Service SHALL ensure the UUID follows the standard v4 format (xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)
4. WHEN LocalStorage is cleared or unavailable THEN the Device_ID_Service SHALL generate a new Device_ID and attempt to store it

### Requirement 2

**User Story:** As a developer, I want all cart-related API requests to automatically include the Device ID header, so that the backend can identify guest users without manual intervention.

#### Acceptance Criteria

1. WHEN any HTTP request is made to the Cart API THEN the HTTP_Interceptor SHALL attach the header `X-Device-Id` with the current Device_ID value
2. WHEN the user is authenticated THEN the HTTP_Interceptor SHALL attach both `Authorization: Bearer {token}` and `X-Device-Id` headers
3. WHEN the Device_ID is not available THEN the HTTP_Interceptor SHALL proceed without the `X-Device-Id` header for non-cart APIs
4. WHEN the request URL matches cart-related endpoints THEN the HTTP_Interceptor SHALL always include the `X-Device-Id` header

### Requirement 3

**User Story:** As a guest user who just logged in, I want my guest cart to be merged with my existing user cart, so that I have all my items in one place.

#### Acceptance Criteria

1. WHEN a user successfully logs in THEN the Login_Component SHALL call the Cart Merge API before redirecting
2. WHEN calling the Cart Merge API THEN the system SHALL send a POST request to `/api/v1/cart/merge` with the Device_ID in the request body
3. WHEN the Cart Merge API returns success (200 OK) THEN the system SHALL refresh the cart state by calling GET `/api/v1/cart`
4. WHEN the Cart Merge API returns an error THEN the system SHALL log the error and continue with the login flow without blocking the user
5. WHEN the merge is complete THEN the system SHALL NOT delete the Device_ID from LocalStorage (for future guest sessions)

### Requirement 4

**User Story:** As a user, I want to see a notification when my cart items have been adjusted during merge, so that I know if any quantities were changed due to stock limitations.

#### Acceptance Criteria

1. WHEN the Cart Merge API returns a warning about adjusted quantities THEN the system SHALL display a toast notification to the user
2. WHEN displaying the merge notification THEN the system SHALL show which items were affected and the reason (e.g., "Một số sản phẩm đã được điều chỉnh số lượng do hết hàng")
3. WHEN no adjustments were made during merge THEN the system SHALL NOT display any notification

### Requirement 5

**User Story:** As a developer, I want a centralized cart service that handles both guest and authenticated cart operations, so that the codebase remains maintainable.

#### Acceptance Criteria

1. WHEN adding items to cart THEN the Cart_Service SHALL use the appropriate API endpoint based on authentication state
2. WHEN fetching cart items THEN the Cart_Service SHALL include the Device_ID header for backend to determine the correct cart
3. WHEN the user logs out THEN the Cart_Service SHALL clear the local cart state but preserve the Device_ID for future guest sessions
4. WHEN the Cart_Service initializes THEN it SHALL check authentication state and fetch the appropriate cart data

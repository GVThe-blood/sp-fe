# Requirements Document

## Introduction

Tài liệu này mô tả các yêu cầu để cải thiện hệ thống xác thực (authentication) và routing của ứng dụng SpringFood. Các cải tiến bao gồm: thiết lập routing giữa các màn hình, sửa lỗi giao diện form đăng nhập/đăng ký, thêm validation dữ liệu người dùng, và tối ưu hóa layout cho các trang auth.

## Glossary

- **Auth_System**: Hệ thống xác thực bao gồm trang đăng nhập và đăng ký
- **Login_Page**: Trang đăng nhập của ứng dụng tại route `/login`
- **Register_Page**: Trang đăng ký của ứng dụng tại route `/register`
- **Home_Page**: Trang chủ của ứng dụng tại route `/`
- **Form_Input**: Các trường nhập liệu trong form đăng nhập/đăng ký
- **Gradient_Border**: Viền gradient màu xanh-cam bao quanh form
- **Validation**: Quá trình kiểm tra tính hợp lệ của dữ liệu người dùng nhập vào

## Requirements

### Requirement 1: Routing giữa các màn hình

**User Story:** As a user, I want to navigate between different pages of the application, so that I can access login, register, and home pages seamlessly.

#### Acceptance Criteria

1. WHEN a user clicks on "Tạo tài khoản ngay" link on Login_Page THEN the Auth_System SHALL navigate to Register_Page
2. WHEN a user clicks on "Đăng nhập" link on Register_Page THEN the Auth_System SHALL navigate to Login_Page
3. WHEN a user clicks on the SpringFood logo on Login_Page THEN the Auth_System SHALL navigate to Home_Page
4. WHEN a user clicks on the SpringFood logo on Register_Page THEN the Auth_System SHALL navigate to Home_Page
5. WHEN a user successfully logs in THEN the Auth_System SHALL navigate to Home_Page

### Requirement 2: Sửa lỗi nền xanh nhạt đè lên form input

**User Story:** As a user, I want the login and register forms to display correctly without visual glitches, so that I can have a pleasant user experience.

#### Acceptance Criteria

1. WHEN a user focuses on any Form_Input THEN the Auth_System SHALL display the input field without any background color overlay
2. WHEN a user types in any Form_Input THEN the Auth_System SHALL maintain transparent background for the input field
3. WHEN the form is rendered THEN the Auth_System SHALL display the Gradient_Border correctly without overlapping the input content
4. WHEN autofill is triggered by the browser THEN the Auth_System SHALL override the default autofill background color to maintain design consistency

### Requirement 3: Loại bỏ header trên trang auth và cấu hình logo navigation

**User Story:** As a user, I want the login and register pages to have a clean, focused layout without the main header, so that I can concentrate on the authentication process.

#### Acceptance Criteria

1. WHEN Login_Page is rendered THEN the Auth_System SHALL NOT display the main application header component
2. WHEN Register_Page is rendered THEN the Auth_System SHALL NOT display the main application header component
3. WHEN Login_Page is rendered THEN the Auth_System SHALL display the SpringFood logo as a clickable link to Home_Page
4. WHEN Register_Page is rendered THEN the Auth_System SHALL display the SpringFood logo as a clickable link to Home_Page

### Requirement 4: Sửa lỗi duplicate footer trên trang đăng nhập

**User Story:** As a user, I want to see only one footer on the login page, so that the page layout is clean and professional.

#### Acceptance Criteria

1. WHEN Login_Page is rendered THEN the Auth_System SHALL display exactly one footer section
2. WHEN Login_Page is rendered THEN the Auth_System SHALL use the built-in footer within the login component instead of the global footer

### Requirement 5: Validation dữ liệu đăng nhập

**User Story:** As a user, I want to receive immediate feedback when I enter invalid data in the login form, so that I can correct my input before submitting.

#### Acceptance Criteria

1. WHEN a user submits the login form with an empty email field THEN the Auth_System SHALL display an error message "Email không được để trống"
2. WHEN a user submits the login form with an invalid email format THEN the Auth_System SHALL display an error message "Email không hợp lệ"
3. WHEN a user submits the login form with an empty password field THEN the Auth_System SHALL display an error message "Mật khẩu không được để trống"
4. WHEN a user submits the login form with a password shorter than 6 characters THEN the Auth_System SHALL display an error message "Mật khẩu phải có ít nhất 6 ký tự"
5. WHEN all validation passes THEN the Auth_System SHALL enable the submit button and allow form submission

### Requirement 6: Validation dữ liệu đăng ký

**User Story:** As a user, I want to receive immediate feedback when I enter invalid data in the registration form, so that I can correct my input before submitting.

#### Acceptance Criteria

1. WHEN a user submits the register form with an empty first name field THEN the Auth_System SHALL display an error message "Họ không được để trống"
2. WHEN a user submits the register form with an empty last name field THEN the Auth_System SHALL display an error message "Tên không được để trống"
3. WHEN a user submits the register form with an empty username field THEN the Auth_System SHALL display an error message "Tên đăng nhập không được để trống"
4. WHEN a user submits the register form with a username shorter than 3 characters THEN the Auth_System SHALL display an error message "Tên đăng nhập phải có ít nhất 3 ký tự"
5. WHEN a user submits the register form with an empty email field THEN the Auth_System SHALL display an error message "Email không được để trống"
6. WHEN a user submits the register form with an invalid email format THEN the Auth_System SHALL display an error message "Email không hợp lệ"
7. WHEN a user submits the register form with a password shorter than 8 characters THEN the Auth_System SHALL display an error message "Mật khẩu phải có ít nhất 8 ký tự"
8. WHEN a user submits the register form with non-matching passwords THEN the Auth_System SHALL display an error message "Mật khẩu xác nhận không khớp"
9. WHEN a user submits the register form with an empty phone number THEN the Auth_System SHALL display an error message "Số điện thoại không được để trống"
10. WHEN a user submits the register form with an invalid phone number format THEN the Auth_System SHALL display an error message "Số điện thoại không hợp lệ"
11. WHEN all validation passes THEN the Auth_System SHALL enable the submit button and allow form submission

### Requirement 7: Tuân thủ kiến trúc và code quality

**User Story:** As a developer, I want the code to follow existing architecture patterns and be maintainable, so that future development is easier.

#### Acceptance Criteria

1. WHEN implementing validation THEN the Auth_System SHALL use Angular Reactive Forms for form handling
2. WHEN implementing routing THEN the Auth_System SHALL use Angular Router with routerLink directive
3. WHEN implementing components THEN the Auth_System SHALL follow the existing standalone component pattern
4. WHEN implementing styles THEN the Auth_System SHALL use Tailwind CSS classes consistent with the existing design system
5. WHEN implementing error messages THEN the Auth_System SHALL display them inline below the respective input fields

# Implementation Plan

## 1. Setup và cấu hình cơ bản

- [x] 1.1 Cập nhật AppComponent để conditional render header/footer
  - Inject Router vào AppComponent
  - Tạo getter `showHeaderFooter` kiểm tra current route
  - Cập nhật template với `*ngIf` cho header và footer
  - _Requirements: 3.1, 3.2, 4.1, 4.2_

- [x] 1.2 Cài đặt fast-check cho property-based testing
  - Chạy `npm install --save-dev fast-check`
  - _Requirements: 7.1_

## 2. Fix CSS bugs và routing cho LoginComponent

- [x] 2.1 Sửa lỗi nền xanh nhạt đè lên form input trong LoginComponent
  - Thêm CSS rules cho autofill background override
  - Đảm bảo input có background transparent
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 2.2 Cập nhật routing links trong LoginComponent
  - Thêm RouterLink import
  - Đổi logo href="#" thành routerLink="/"
  - Đổi "Tạo tài khoản ngay" href="#" thành routerLink="/register"
  - _Requirements: 1.1, 1.3_

- [x] 2.3 Implement Reactive Forms validation cho LoginComponent
  - Import ReactiveFormsModule
  - Tạo FormGroup với email và password controls
  - Thêm validators: required, email pattern, minLength(6)
  - Tạo methods getEmailError() và getPasswordError()
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 7.1_

- [x] 2.4 Cập nhật LoginComponent template với validation
  - Bind form controls với formControlName
  - Hiển thị error messages inline
  - Disable submit button khi form invalid
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 7.5_

- [x] 2.5 Write property tests cho Login validation
  - **Property 1: Empty field validation** - Test empty/whitespace email và password
  - **Property 2: Email format validation** - Test invalid email formats
  - **Property 3: Minimum length validation** - Test password < 6 chars
  - **Property 6: Valid form enables submission** - Test valid form data
  - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

## 3. Fix CSS bugs và routing cho RegisterComponent

- [x] 3.1 Cập nhật RegisterComponent layout với header và footer
  - Thêm wrapper div với full page layout
  - Thêm header section với SpringFood logo
  - Thêm footer section
  - _Requirements: 3.3, 3.4_

- [x] 3.2 Sửa lỗi nền xanh nhạt đè lên form input trong RegisterComponent
  - Thêm CSS rules cho autofill background override (giống LoginComponent)
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 3.3 Cập nhật routing links trong RegisterComponent
  - Thêm RouterLink import
  - Đổi logo href="#" thành routerLink="/"
  - Đổi "Đăng nhập" href="#" thành routerLink="/login"
  - _Requirements: 1.2, 1.4_

- [x] 3.4 Implement Reactive Forms validation cho RegisterComponent
  - Import ReactiveFormsModule
  - Tạo FormGroup với tất cả form controls
  - Thêm validators cho từng field
  - Tạo custom validator cho password matching
  - Tạo method getFieldError(fieldName)
  - _Requirements: 6.1-6.11, 7.1_

- [x] 3.5 Cập nhật RegisterComponent template với validation
  - Bind form controls với formControlName
  - Hiển thị error messages inline cho từng field
  - Disable submit button khi form invalid
  - _Requirements: 6.1-6.11, 7.5_

- [x] 3.6 Write property tests cho Register validation
  - **Property 1: Empty field validation** - Test empty/whitespace cho tất cả required fields
  - **Property 2: Email format validation** - Test invalid email formats
  - **Property 3: Minimum length validation** - Test username < 3 chars, password < 8 chars
  - **Property 4: Password confirmation matching** - Test mismatched passwords
  - **Property 5: Phone number format validation** - Test invalid phone formats
  - **Property 6: Valid form enables submission** - Test valid form data
  - **Validates: Requirements 6.1-6.11**

## 4. Checkpoint - Đảm bảo tất cả tests pass

- [x] 4. Checkpoint







  - Ensure all tests pass, ask the user if questions arise.

## 5. Final integration và cleanup

- [x] 5.1 Verify routing hoạt động đúng
  - Test navigation từ login → register
  - Test navigation từ register → login
  - Test navigation từ logo → home
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 5.2 Verify header/footer conditional rendering
  - Test header/footer ẩn trên /login
  - Test header/footer ẩn trên /register
  - Test header/footer hiện trên / và /store/:id
  - _Requirements: 3.1, 3.2, 4.1, 4.2_

- [x] 5.3 Write unit tests cho AppComponent conditional rendering
  - Test showHeaderFooter returns false cho auth routes
  - Test showHeaderFooter returns true cho other routes
  - _Requirements: 3.1, 3.2_

## 6. Final Checkpoint - Đảm bảo tất cả tests pass
-


- [x] 6. Final Checkpoint




  - Ensure all tests pass, ask the user if questions arise.

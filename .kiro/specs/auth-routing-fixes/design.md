# Design Document: Auth Routing Fixes

## Overview

Tài liệu này mô tả thiết kế kỹ thuật để cải thiện hệ thống xác thực và routing của ứng dụng SpringFood. Các cải tiến bao gồm:
- Thiết lập routing giữa các màn hình auth
- Sửa lỗi CSS nền xanh nhạt đè lên form input
- Loại bỏ header/footer trùng lặp trên trang auth
- Thêm validation dữ liệu người dùng với Angular Reactive Forms

## Architecture

### Component Structure

```
src/app/
├── app.component.ts          # Main app - conditional header/footer
├── app.routes.ts             # Route configuration
├── components/
│   └── login/
│       ├── login.component.ts
│       ├── login.component.html
│       └── login.component.css
└── pages/
    └── register/
        ├── register.component.ts
        ├── register.component.html
        └── register.component.css
```

### Routing Strategy

Sử dụng Angular Router với `routerLink` directive để navigation giữa các trang:
- `/` → HomeComponent
- `/login` → LoginComponent
- `/register` → RegisterComponent
- `/store/:id` → StoreDetailComponent

### Layout Strategy

Để ẩn header/footer trên trang auth, sử dụng một trong hai cách:
1. **Route-based conditional rendering** (Recommended): Kiểm tra current route trong `app.component.ts` để ẩn/hiện header và footer
2. **Separate layout components**: Tạo AuthLayoutComponent riêng (phức tạp hơn)

Chọn cách 1 vì đơn giản và phù hợp với kiến trúc hiện tại.

## Components and Interfaces

### AppComponent Updates

```typescript
// app.component.ts
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, CommonModule],
  templateUrl: './app.component.html'
})
export class AppComponent {
  private router = inject(Router);
  
  // Routes that should hide header/footer
  authRoutes = ['/login', '/register'];
  
  get showHeaderFooter(): boolean {
    return !this.authRoutes.includes(this.router.url);
  }
}
```

### LoginComponent Updates

```typescript
// login.component.ts
interface LoginForm {
  email: FormControl<string>;
  password: FormControl<string>;
  rememberMe: FormControl<boolean>;
}

@Component({...})
export class LoginComponent {
  loginForm: FormGroup<LoginForm>;
  
  // Validation error messages
  getEmailError(): string | null;
  getPasswordError(): string | null;
  onSubmit(): void;
}
```

### RegisterComponent Updates

```typescript
// register.component.ts
interface RegisterForm {
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  username: FormControl<string>;
  email: FormControl<string>;
  password: FormControl<string>;
  confirmPassword: FormControl<string>;
  gender: FormControl<string>;
  countryCode: FormControl<string>;
  phone: FormControl<string>;
}

@Component({...})
export class RegisterComponent {
  registerForm: FormGroup<RegisterForm>;
  
  // Validation methods
  getFieldError(fieldName: string): string | null;
  onSubmit(): void;
}
```

## Data Models

### Validation Rules

```typescript
// validators/auth.validators.ts
export const AUTH_VALIDATION = {
  email: {
    required: 'Email không được để trống',
    pattern: 'Email không hợp lệ'
  },
  password: {
    required: 'Mật khẩu không được để trống',
    minLength: 'Mật khẩu phải có ít nhất {0} ký tự'
  },
  firstName: {
    required: 'Họ không được để trống'
  },
  lastName: {
    required: 'Tên không được để trống'
  },
  username: {
    required: 'Tên đăng nhập không được để trống',
    minLength: 'Tên đăng nhập phải có ít nhất 3 ký tự'
  },
  confirmPassword: {
    required: 'Xác nhận mật khẩu không được để trống',
    mismatch: 'Mật khẩu xác nhận không khớp'
  },
  phone: {
    required: 'Số điện thoại không được để trống',
    pattern: 'Số điện thoại không hợp lệ'
  }
};
```

### Form Validation Patterns

```typescript
// Regex patterns
export const VALIDATION_PATTERNS = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  phone: /^[0-9]{9,11}$/
};
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the prework analysis, the following correctness properties have been identified:

### Property 1: Empty field validation
*For any* form field that is required, if the input value is empty or contains only whitespace characters, the validation system SHALL return an error message indicating the field cannot be empty.
**Validates: Requirements 5.1, 5.3, 6.1, 6.2, 6.3, 6.5, 6.9**

### Property 2: Email format validation
*For any* string input in an email field, if the string does not match the email regex pattern `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`, the validation system SHALL return an error message "Email không hợp lệ".
**Validates: Requirements 5.2, 6.6**

### Property 3: Minimum length validation
*For any* string input in a field with minimum length requirement, if the string length is less than the required minimum, the validation system SHALL return an appropriate error message.
**Validates: Requirements 5.4, 6.4, 6.7**

### Property 4: Password confirmation matching
*For any* two password inputs (password and confirmPassword), if the values are not identical, the validation system SHALL return an error message "Mật khẩu xác nhận không khớp".
**Validates: Requirements 6.8**

### Property 5: Phone number format validation
*For any* string input in a phone field, if the string does not match the phone regex pattern `^[0-9]{9,11}$`, the validation system SHALL return an error message "Số điện thoại không hợp lệ".
**Validates: Requirements 6.10**

### Property 6: Valid form enables submission
*For any* form where all fields pass their respective validations, the form SHALL be marked as valid and the submit button SHALL be enabled.
**Validates: Requirements 5.5, 6.11**

## Error Handling

### Validation Error Display

- Error messages hiển thị inline ngay dưới input field tương ứng
- Sử dụng class `text-red-600 dark:text-red-500` cho error text
- Error chỉ hiển thị sau khi user đã touch field hoặc submit form

### CSS Fix for Autofill Background

```css
/* Fix browser autofill background color */
.inner-form-content input:-webkit-autofill,
.inner-form-content input:-webkit-autofill:hover,
.inner-form-content input:-webkit-autofill:focus,
.inner-form-content input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 30px #f5f5f7 inset !important;
  -webkit-text-fill-color: #171717 !important;
  transition: background-color 5000s ease-in-out 0s;
}

.dark .inner-form-content input:-webkit-autofill,
.dark .inner-form-content input:-webkit-autofill:hover,
.dark .inner-form-content input:-webkit-autofill:focus,
.dark .inner-form-content input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 30px #28282b inset !important;
  -webkit-text-fill-color: #ffffff !important;
}
```

## Testing Strategy

### Dual Testing Approach

Sử dụng cả Unit Tests và Property-Based Tests để đảm bảo coverage toàn diện.

### Unit Tests

- Test navigation giữa các routes
- Test conditional rendering của header/footer
- Test form initialization
- Test error message display

### Property-Based Testing

Sử dụng **fast-check** library cho property-based testing trong TypeScript/Angular.

```typescript
import * as fc from 'fast-check';
```

**Property tests sẽ cover:**

1. **Empty field validation property**: Generate random whitespace strings, verify error message
2. **Email format validation property**: Generate random strings, verify email validation
3. **Minimum length validation property**: Generate strings of various lengths, verify length validation
4. **Password matching property**: Generate random string pairs, verify matching logic
5. **Phone format validation property**: Generate random strings, verify phone validation
6. **Valid form submission property**: Generate valid form data, verify form is submittable

### Test File Structure

```
src/app/
├── components/login/
│   ├── login.component.spec.ts      # Unit tests
│   └── login.validation.spec.ts     # Property-based tests
└── pages/register/
    ├── register.component.spec.ts   # Unit tests
    └── register.validation.spec.ts  # Property-based tests
```

### Test Configuration

Property-based tests sẽ chạy với minimum 100 iterations để đảm bảo coverage:

```typescript
fc.assert(
  fc.property(/* ... */),
  { numRuns: 100 }
);
```

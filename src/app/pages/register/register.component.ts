import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { AuthService, RegisterRequest } from '../../services/auth.service';

// Validation patterns
export const EMAIL_PATTERN =
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const PHONE_PATTERN = /^[0-9]{9,11}$/;
// Password must contain at least one digit, one lowercase, one uppercase, one special character
export const PASSWORD_PATTERN = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=])(?=\S+$).{8,}$/;

// Validation error messages
export const REGISTER_VALIDATION_MESSAGES: Record<
  string,
  Record<string, string>
> = {
  firstName: {
    required: 'Họ không được để trống',
  },
  lastName: {
    required: 'Tên không được để trống',
  },
  username: {
    required: 'Tên đăng nhập không được để trống',
    minlength: 'Tên đăng nhập phải có ít nhất 3 ký tự',
  },
  email: {
    required: 'Email không được để trống',
    pattern: 'Email không hợp lệ',
  },
  password: {
    required: 'Mật khẩu không được để trống',
    minlength: 'Mật khẩu phải có ít nhất 8 ký tự',
    pattern: 'Mật khẩu phải chứa chữ hoa, chữ thường, số và ký tự đặc biệt',
  },
  confirmPassword: {
    required: 'Xác nhận mật khẩu không được để trống',
    mismatch: 'Mật khẩu xác nhận không khớp',
  },
  phone: {
    required: 'Số điện thoại không được để trống',
    pattern: 'Số điện thoại không hợp lệ',
  },
};

// Custom validator for password matching
export function passwordMatchValidator(
  control: AbstractControl
): ValidationErrors | null {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  if (
    password &&
    confirmPassword &&
    password.value !== confirmPassword.value
  ) {
    confirmPassword.setErrors({ mismatch: true });
    return { mismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  // Angular 19: Use inject() instead of constructor injection
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  // Angular 19: Use signals for reactive state
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');

  registerForm: FormGroup;

  constructor() {
    this.registerForm = this.fb.group(
      {
        firstName: ['', [Validators.required]],
        lastName: ['', [Validators.required]],
        username: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.pattern(EMAIL_PATTERN)]],
        password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(PASSWORD_PATTERN)]],
        confirmPassword: ['', [Validators.required]],
        gender: ['MALE'],
        countryCode: ['+84'],
        phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
      },
      { validators: passwordMatchValidator }
    );
  }

  getFieldError(fieldName: string): string | null {
    const control = this.registerForm.get(fieldName);
    if (control?.touched && control?.errors) {
      const messages = REGISTER_VALIDATION_MESSAGES[fieldName];
      if (messages) {
        for (const errorKey of Object.keys(control.errors)) {
          if (messages[errorKey]) {
            return messages[errorKey];
          }
        }
      }
    }
    return null;
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update(v => !v);
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set('');

      const formValue = this.registerForm.value;
      
      // Prepare register request matching backend UserRequest DTO
      const registerData: RegisterRequest = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        username: formValue.username,
        password: formValue.password,
        email: formValue.email,
        gender: formValue.gender,
        phone: formValue.phone, // Send phone without country code prefix
        address: '' // Optional field
      };

      this.authService.register(registerData).subscribe({
        next: (response) => {
          console.log('Registration successful:', response);
          // Redirect to home after successful registration
          this.router.navigate(['/']);
        },
        error: (error) => {
          console.error('Registration failed:', error);
          this.isLoading.set(false);
          this.errorMessage.set(error.error?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
        }
      });
    } else {
      // Mark all fields as touched to show errors
      Object.keys(this.registerForm.controls).forEach((key) => {
        this.registerForm.get(key)?.markAsTouched();
      });
    }
  }
}

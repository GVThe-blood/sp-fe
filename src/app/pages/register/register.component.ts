import { Component } from '@angular/core';
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

// Validation patterns
export const EMAIL_PATTERN =
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const PHONE_PATTERN = /^[0-9]{9,11}$/;

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
  registerForm: FormGroup;
  showPassword = false;
  showConfirmPassword = false;

  constructor(private fb: FormBuilder, private router: Router) {
    this.registerForm = this.fb.group(
      {
        firstName: ['', [Validators.required]],
        lastName: ['', [Validators.required]],
        username: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.pattern(EMAIL_PATTERN)]],
        password: ['', [Validators.required, Validators.minLength(8)]],
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
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      // TODO: Implement actual registration logic
      console.log('Register form submitted:', this.registerForm.value);
      this.router.navigate(['/login']);
    } else {
      // Mark all fields as touched to show errors
      Object.keys(this.registerForm.controls).forEach((key) => {
        this.registerForm.get(key)?.markAsTouched();
      });
    }
  }
}

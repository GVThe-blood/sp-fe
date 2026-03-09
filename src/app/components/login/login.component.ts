import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CartService, MergeCartResponse, AdjustedItem } from '../../services/cart.service';

// Validation patterns
export const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Validation error messages
export const LOGIN_VALIDATION_MESSAGES = {
  email: {
    required: 'Email không được để trống',
    pattern: 'Email không hợp lệ'
  },
  password: {
    required: 'Mật khẩu không được để trống',
    minlength: 'Mật khẩu phải có ít nhất 6 ký tự'
  }
};

// Merge notification messages
export const MERGE_NOTIFICATION_MESSAGES = {
  adjustedItems: 'Một số sản phẩm đã được điều chỉnh số lượng do hết hàng',
  mergeError: 'Không thể hợp nhất giỏ hàng, vui lòng thử lại sau'
};

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm: FormGroup;
  showMergeNotification = false;
  mergeNotificationMessage = '';
  adjustedItems: AdjustedItem[] = [];
  isLoading = false;

  constructor(
    private fb: FormBuilder, 
    private router: Router,
    private cartService: CartService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.pattern(EMAIL_PATTERN)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  getEmailError(): string | null {
    const control = this.loginForm.get('email');
    if (control?.touched && control?.errors) {
      if (control.errors['required']) {
        return LOGIN_VALIDATION_MESSAGES.email.required;
      }
      if (control.errors['pattern']) {
        return LOGIN_VALIDATION_MESSAGES.email.pattern;
      }
    }
    return null;
  }

  getPasswordError(): string | null {
    const control = this.loginForm.get('password');
    if (control?.touched && control?.errors) {
      if (control.errors['required']) {
        return LOGIN_VALIDATION_MESSAGES.password.required;
      }
      if (control.errors['minlength']) {
        return LOGIN_VALIDATION_MESSAGES.password.minlength;
      }
    }
    return null;
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      // TODO: Implement actual login API call
      console.log('Login form submitted:', this.loginForm.value);
      
      // Simulate successful login (in real app, this would be after receiving JWT token)
      // After receiving JWT token, call mergeGuestCart (Requirement 3.1)
      this.performCartMergeAndRedirect();
    } else {
      // Mark all fields as touched to show errors
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }

  /**
   * Perform cart merge after successful login and then redirect
   * Requirements: 3.1, 3.4
   */
  private performCartMergeAndRedirect(): void {
    this.cartService.mergeGuestCart().subscribe({
      next: (response: MergeCartResponse) => {
        this.handleMergeResponse(response);
        this.completeLoginFlow();
      },
      error: (error) => {
        // Log error but don't block login flow (Requirement 3.4)
        console.error('Cart merge failed:', error);
        this.completeLoginFlow();
      }
    });
  }

  /**
   * Handle merge response and show notification if items were adjusted
   * Requirements: 4.1, 4.2, 4.3
   */
  private handleMergeResponse(response: MergeCartResponse): void {
    // Check for adjustedItems in merge response (Requirement 4.1)
    if (response.adjustedItems && response.adjustedItems.length > 0) {
      this.adjustedItems = response.adjustedItems;
      this.mergeNotificationMessage = MERGE_NOTIFICATION_MESSAGES.adjustedItems;
      this.showMergeNotification = true;
      
      // Log adjusted items for debugging
      console.log('Cart items adjusted during merge:', response.adjustedItems);
    }
    // If no adjustments, don't show notification (Requirement 4.3)
  }

  /**
   * Complete the login flow by redirecting to home
   */
  private completeLoginFlow(): void {
    this.isLoading = false;
    
    // If notification is shown, delay redirect to allow user to see it
    if (this.showMergeNotification) {
      setTimeout(() => {
        this.router.navigate(['/']);
      }, 3000); // 3 second delay to show notification
    } else {
      this.router.navigate(['/']);
    }
  }

  /**
   * Dismiss the merge notification manually
   */
  dismissNotification(): void {
    this.showMergeNotification = false;
    this.router.navigate(['/']);
  }
}

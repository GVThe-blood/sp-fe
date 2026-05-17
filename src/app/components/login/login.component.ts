import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';

// TODO: Implement cart merge feature
// export interface MergeCartResponse {
//   adjustedItems: AdjustedItem[];
// }
// export interface AdjustedItem {
//   productId: string;
//   requestedQuantity: number;
//   adjustedQuantity: number;
// }

// Validation patterns
export const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Validation error messages
export const LOGIN_VALIDATION_MESSAGES = {
  username: {
    required: 'Tên đăng nhập không được để trống',
    minlength: 'Tên đăng nhập phải có ít nhất 3 ký tự'
  },
  password: {
    required: 'Mật khẩu không được để trống',
    minlength: 'Mật khẩu phải có ít nhất 8 ký tự'
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
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cartService = inject(CartService);
  private authService = inject(AuthService);

  loginForm: FormGroup;
  // TODO: Implement cart merge feature
  // showMergeNotification = false;
  // mergeNotificationMessage = '';
  // adjustedItems: AdjustedItem[] = [];
  isLoading = false;
  errorMessage = '';

  constructor() {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      rememberMe: [false]
    });
  }

  getUsernameError(): string | null {
    const control = this.loginForm.get('username');
    if (control?.touched && control?.errors) {
      if (control.errors['required']) {
        return LOGIN_VALIDATION_MESSAGES.username.required;
      }
      if (control.errors['minlength']) {
        return LOGIN_VALIDATION_MESSAGES.username.minlength;
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
      this.errorMessage = '';
      
      const { username, password } = this.loginForm.value;
      
      this.authService.login({ username, password }).subscribe({
        next: (response) => {
          console.log('Login successful:', response);
          // TODO: Implement cart merge after login
          // this.performCartMergeAndRedirect();
          this.completeLoginFlow();
        },
        error: (error: any) => {
          console.error('Login failed:', error);
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
        }
      });
    } else {
      // Mark all fields as touched to show errors
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }

  /**
   * TODO: Implement cart merge feature
   * Perform cart merge after successful login and then redirect
   * Requirements: 3.1, 3.4
   */
  // private performCartMergeAndRedirect(): void {
  //   this.cartService.mergeGuestCart().subscribe({
  //     next: (response: MergeCartResponse) => {
  //       this.handleMergeResponse(response);
  //       this.completeLoginFlow();
  //     },
  //     error: (error: any) => {
  //       // Log error but don't block login flow (Requirement 3.4)
  //       console.error('Cart merge failed:', error);
  //       this.completeLoginFlow();
  //     }
  //   });
  // }

  /**
   * TODO: Implement cart merge feature
   * Handle merge response and show notification if items were adjusted
   * Requirements: 4.1, 4.2, 4.3
   */
  // private handleMergeResponse(response: MergeCartResponse): void {
  //   // Check for adjustedItems in merge response (Requirement 4.1)
  //   if (response.adjustedItems && response.adjustedItems.length > 0) {
  //     this.adjustedItems = response.adjustedItems;
  //     this.mergeNotificationMessage = MERGE_NOTIFICATION_MESSAGES.adjustedItems;
  //     this.showMergeNotification = true;
  //     
  //     // Log adjusted items for debugging
  //     console.log('Cart items adjusted during merge:', response.adjustedItems);
  //   }
  //   // If no adjustments, don't show notification (Requirement 4.3)
  // }

  /**
   * Complete the login flow by redirecting to home (or returnUrl if any).
   *
   * Khi login thành công với role ADMIN và không có returnUrl chỉ định, ta đẩy
   * về `/role-select` để admin chủ động chọn vào trang quản trị hay duyệt như
   * khách hàng. Nếu user có returnUrl (vì bị guard chặn trước đó) thì tôn
   * trọng returnUrl. Customer/Shop owner vẫn về home như cũ.
   */
  private completeLoginFlow(): void {
    this.isLoading = false;

    const queryReturnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    let returnUrl = queryReturnUrl;
    if (!returnUrl) {
      returnUrl = this.authService.isAdmin() ? '/role-select' : '/';
    }
    this.router.navigateByUrl(returnUrl);
  }

  /**
   * TODO: Implement cart merge notification
   * Dismiss the merge notification manually
   */
  // dismissNotification(): void {
  //   this.showMergeNotification = false;
  //   this.router.navigate(['/']);
  // }
}

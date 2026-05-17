import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';

/**
 * Sau khi admin login thành công, thay vì redirect thẳng vào `/admin`, ta đẩy
 * về trang này để admin có thể chọn:
 *  - "Vào trang quản trị" → `/admin`
 *  - "Tiếp tục đến website" → `/`
 *
 * User non-admin không bao giờ thấy trang này (đã được {@code adminGuard} chặn).
 *
 * Trang dùng route public {@code /role-select} nhưng tự enforce phải đăng nhập
 * + có role ADMIN; nếu không thì redirect ngay trong constructor.
 */
@Component({
  selector: 'app-role-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './role-select.component.html',
  styleUrl: './role-select.component.css',
})
export class RoleSelectComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  /** Tránh người dùng spam click 2 nút khi đang chờ navigate. */
  protected readonly navigating = signal(false);

  /** Hiển thị "Xin chào, <username>!" nếu có; nếu không thì just "Xin chào!". */
  protected readonly greetingName = computed(() => {
    const name = this.auth.currentUser()?.username;
    return name ? `, ${name}` : '';
  });

  constructor() {
    // Hard guard: nếu không đăng nhập hoặc không phải admin, đá đi luôn.
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    if (!this.auth.isAdmin()) {
      this.router.navigate(['/']);
    }
  }

  protected goAdmin(): void {
    this.navigating.set(true);
    this.router.navigate(['/admin']);
  }

  protected goSite(): void {
    this.navigating.set(true);
    this.router.navigate(['/']);
  }

  protected logout(): void {
    this.navigating.set(true);
    this.auth.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }
}

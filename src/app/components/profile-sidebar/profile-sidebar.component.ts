import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HotToastService } from '@ngxpert/hot-toast';

import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { CartApiService } from '../../services/cart-api.service';

export interface MenuItem {
  /** Stable id used by template @for tracking. */
  id: string;
  label: string;
  icon: string;
  route: string;
  /** UI flag: highlight the item with the gradient sale style. */
  isSpecial?: boolean;
  /** Friendly label shown next to the sale badge (e.g. "20/05"). */
  saleEventName?: string;
}

export interface SaleEvent {
  id: string;
  name: string;
  isActive: boolean;
  startDate: Date;
  endDate: Date;
}

@Component({
  selector: 'app-profile-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile-sidebar.component.html',
  styleUrl: './profile-sidebar.component.css',
})
export class ProfileSidebarComponent {
  @Input() activeRoute: string = '/profile';
  @Output() avatarEditClick = new EventEmitter<void>();

  userService = inject(UserService);
  private authService = inject(AuthService);
  private toast = inject(HotToastService);
  private cartApi = inject(CartApiService);
  user = this.userService.currentUser;

  /**
   * Sale event derived từ ngày hiện tại — label dạng `dd/MM` (ví dụ
   * `20/05` cho 20 tháng 5). Mục đích: thay vì hardcode `12/12` mãi
   * không thay đổi, mỗi ngày user vào sẽ thấy "Sale của hôm nay".
   *
   * Logic active/end-date đơn giản: sale chạy 24h trong ngày hiện tại.
   * Khi BE expose API `/sales/active`, có thể swap signal này bằng
   * dữ liệu thật mà không đổi template.
   */
  saleEvent = signal<SaleEvent>(buildTodaySale());

  /** Cart badge: số lượng item từ CartApiService signal. Hiển thị bên
   *  cạnh label như đơn hàng pattern, không có popover. */
  cartCount = computed(() => this.cartApi.itemCount());

  menuItems = computed<MenuItem[]>(() => {
    const event = this.saleEvent();
    const saleLabel = event.isActive ? event.name : 'Sale';
    return [
      {
        id: 'sale',
        label: saleLabel,
        icon: 'local_fire_department',
        route: '/sale',
        isSpecial: true,
        saleEventName: event.isActive ? event.name : undefined,
      },
      { id: 'profile', label: 'Thông tin cá nhân', icon: 'person', route: '/profile' },
      // Cart navigates sang trang /cart đầy đủ — giống pattern "Đơn hàng".
      // Trước đây từng dùng popover inline nhưng UX bí khi cart có nhiều
      // item, scroll/checkout/qty-stepper bị giới hạn trong khung popover.
      { id: 'cart', label: 'Giỏ hàng của tôi', icon: 'shopping_cart', route: '/cart' },
      { id: 'favorites', label: 'Sản phẩm yêu thích', icon: 'favorite', route: '/favorites' },
      { id: 'vouchers', label: 'Vouchers', icon: 'confirmation_number', route: '/vouchers' },
      { id: 'orders', label: 'Đơn hàng', icon: 'receipt_long', route: '/orders' },
      { id: 'my-store', label: 'Cửa hàng của tôi', icon: 'storefront', route: '/my-store' },
    ];
  });

  isActive(route: string | undefined): boolean {
    return route !== undefined && this.activeRoute === route;
  }

  logout(): void {
    if (!confirm('Bạn có chắc muốn đăng xuất?')) return;

    this.authService.logout().subscribe({
      next: () => {
        // user state is derived from auth/shop services; both are reset above
        this.toast.success('Đã đăng xuất');
      },
      error: () => {
        // AuthService đã clear local state + navigate dù API fail
        this.toast.warning('Đăng xuất offline (server không phản hồi)');
      },
    });
  }

  onAvatarEditClick(): void {
    this.avatarEditClick.emit();
  }
}

/**
 * Tạo SaleEvent rolling theo ngày hiện tại — replace cho hardcode `12/12`.
 * Khi BE có API sale, swap bằng dữ liệu thật mà không phải đổi template.
 */
function buildTodaySale(): SaleEvent {
  const now = new Date();
  const day = now.getDate().toString().padStart(2, '0');
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return {
    id: `daily-${start.getTime()}`,
    name: `${day}/${month}`,
    isActive: true,
    startDate: start,
    endDate: end,
  };
}

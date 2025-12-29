import { Component, Input, Output, EventEmitter, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService, User } from '../../services/user.service';

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  isSpecial?: boolean;
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
  styleUrl: './profile-sidebar.component.css'
})
export class ProfileSidebarComponent {
  @Input() activeRoute: string = '/profile';
  @Output() avatarEditClick = new EventEmitter<void>();
  
  userService = inject(UserService);
  user = this.userService.currentUser;

  // Mock sale event - can be fetched from API later
  saleEvent = signal<SaleEvent | null>({
    id: '1',
    name: '12/12',
    isActive: true,
    startDate: new Date('2025-12-01'),
    endDate: new Date('2025-12-15')
  });

  menuItems = computed<MenuItem[]>(() => {
    const event = this.saleEvent();
    return [
      {
        id: 'sale',
        label: event?.isActive ? event.name : 'Sale',
        icon: 'local_fire_department',
        route: '/sale',
        isSpecial: true,
        saleEventName: event?.isActive ? event.name : undefined
      },
      { id: 'profile', label: 'Thông tin cá nhân', icon: 'person', route: '/profile' },
      { id: 'cart', label: 'Giỏ hàng của tôi', icon: 'shopping_cart', route: '/cart' },
      { id: 'favorites', label: 'Sản phẩm yêu thích', icon: 'favorite', route: '/favorites' },
      { id: 'vouchers', label: 'Vouchers', icon: 'confirmation_number', route: '/vouchers' },
      { id: 'orders', label: 'Đơn hàng', icon: 'receipt_long', route: '/orders' },
      { id: 'my-store', label: 'Cửa hàng của tôi', icon: 'storefront', route: '/my-store' }
    ];
  });

  isActive(route: string): boolean {
    return this.activeRoute === route;
  }

  logout() {
    this.userService.currentUser.set(null);
  }

  onAvatarEditClick() {
    this.avatarEditClick.emit();
  }
}

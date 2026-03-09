import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '../../services/user.service';

export interface StoreMenuItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  section: 'operations' | 'analytics' | 'management';
}

@Component({
  selector: 'app-store-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './store-sidebar.component.html',
  styleUrl: './store-sidebar.component.css'
})
export class StoreSidebarComponent {
  @Input() activeRoute: string = '/my-store';
  
  userService = inject(UserService);
  user = this.userService.currentUser;

  // Menu structure with sections
  menuItems: StoreMenuItem[] = [
    // HOẠT ĐỘNG
    { id: 'shipping', label: 'Vận chuyển', icon: 'local_shipping', route: '/my-store/shipping', section: 'operations' },
    { id: 'orders', label: 'Quản lý Đơn hàng', icon: 'receipt_long', route: '/my-store/orders', section: 'operations' },
    { id: 'products', label: 'Quản lý Sản phẩm', icon: 'inventory_2', route: '/my-store/products', section: 'operations' },
    
    // PHÂN TÍCH & TĂNG TRƯỞNG
    { id: 'analytics', label: 'Thống kê', icon: 'bar_chart', route: '/my-store/analytics', section: 'analytics' },
    { id: 'revenue', label: 'Doanh thu', icon: 'payments', route: '/my-store/revenue', section: 'analytics' },
    { id: 'growth', label: 'Phát triển', icon: 'trending_up', route: '/my-store/growth', section: 'analytics' },
    { id: 'customer-care', label: 'Chăm sóc Khách hàng', icon: 'support_agent', route: '/my-store/customer-care', section: 'analytics' },
    
    // QUẢN TRỊ
    { id: 'settings', label: 'Cài đặt Cửa hàng', icon: 'settings', route: '/my-store/settings', section: 'management' },
    { id: 'resources', label: 'Nguồn lực', icon: 'folder_open', route: '/my-store/resources', section: 'management' }
  ];

  // Group menu items by section
  get operationsItems(): StoreMenuItem[] {
    return this.menuItems.filter(item => item.section === 'operations');
  }

  get analyticsItems(): StoreMenuItem[] {
    return this.menuItems.filter(item => item.section === 'analytics');
  }

  get managementItems(): StoreMenuItem[] {
    return this.menuItems.filter(item => item.section === 'management');
  }

  isActive(route: string): boolean {
    return this.activeRoute === route;
  }
}

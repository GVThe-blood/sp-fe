import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface AdminMenuItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  /** When true the link is rendered as static text — for routes not yet implemented. */
  disabled?: boolean;
  /** routerLinkActiveOptions exact flag — true cho /admin (overview) only. */
  exact?: boolean;
  /** Optional small badge (vd số đơn đăng ký pending). */
  badge?: number | string;
}

interface AdminMenuSection {
  title: string;
  items: AdminMenuItem[];
}

/**
 * Sidebar cho admin shell. Định nghĩa cấu trúc menu hard-coded ở đây vì admin
 * sitemap thay đổi rất chậm; nếu sau này cần dynamic (theo permission từng
 * admin) thì refactor thành signal-based input.
 *
 * Một số mục được mark {@code disabled: true} cho Phase 1 — UI sẽ render
 * dạng static label "Sắp có" để báo trước cho user.
 */
@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.css',
})
export class AdminSidebarComponent {
  /** Phát signal lên parent layout để đóng drawer trên mobile sau khi click. */
  readonly linkClicked = output<void>();

  protected readonly menu: AdminMenuSection[] = [
    {
      title: 'Tổng quan',
      items: [
        { id: 'overview', label: 'Bảng điều khiển', icon: 'dashboard', route: '/admin', exact: true },
      ],
    },
    {
      title: 'Quản lý Shop',
      items: [
        { id: 'shops', label: 'Danh sách Shop', icon: 'storefront', route: '/admin/shops' },
        {
          id: 'shop-registrations',
          label: 'Đơn đăng ký Shop',
          icon: 'how_to_reg',
          route: '/admin/shop-registrations',
        },
      ],
    },
    {
      title: 'Người dùng',
      items: [
        { id: 'users', label: 'Quản lý người dùng', icon: 'group', route: '/admin/users' },
      ],
    },
    {
      title: 'Sản phẩm & Danh mục',
      items: [
        { id: 'products', label: 'Sản phẩm', icon: 'inventory_2', route: '/admin/products' },
        { id: 'categories', label: 'Danh mục', icon: 'category', route: '/admin/categories' },
      ],
    },
    {
      title: 'Đơn hàng & Vận chuyển',
      items: [
        { id: 'orders', label: 'Đơn hàng', icon: 'receipt_long', route: '/admin/orders' },
        { id: 'shipping', label: 'Quản lý giao vận', icon: 'local_shipping', route: '/admin/shipping' },
      ],
    },
    {
      title: 'Tài chính',
      items: [
        { id: 'revenue', label: 'Doanh thu nền tảng', icon: 'payments', route: '/admin/revenue' },
        {
          id: 'commission',
          label: 'Cấu hình hoa hồng',
          icon: 'percent',
          route: '/admin/commission-config',
        },
        { id: 'payouts', label: 'Thanh toán cho Shop', icon: 'account_balance', route: '/admin/payouts', disabled: true },
      ],
    },
    {
      title: 'Khuyến mãi',
      items: [
        { id: 'sales', label: 'Chương trình Sale', icon: 'local_offer', route: '/admin/sales' },
      ],
    },
    {
      title: 'Tài nguyên AI',
      items: [
        { id: 'ai-knowledge', label: 'Knowledge base', icon: 'menu_book', route: '/admin/ai-knowledge' },
      ],
    },
    {
      title: 'Hệ thống',
      items: [
        { id: 'audit', label: 'Audit log', icon: 'history', route: '/admin/audit-log', disabled: true },
        { id: 'settings', label: 'Cài đặt nền tảng', icon: 'settings', route: '/admin/settings', disabled: true },
      ],
    },
  ];
}

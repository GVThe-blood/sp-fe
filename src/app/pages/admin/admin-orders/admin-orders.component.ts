import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { HotToastService } from '@ngxpert/hot-toast';

import { environment } from '../../../../environments/environment';
import {
  AdminOrderItem,
  AdminOrderListPage,
  AdminOrderRow,
  AdminOrderService,
  OrderStatusValue,
} from '../../../services/admin-order.service';

const PAGE_SIZE = 20;

const ALL_STATUSES: OrderStatusValue[] = [
  'PENDING_PAYMENT',
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'READY_FOR_PICKUP',
  'SHIPPING',
  'COMPLETED',
  'CANCELLED',
  'ORDER_RETURN',
  'FAILED',
  'DELETED',
];

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: 'Chờ thanh toán',
  PENDING: 'Chờ duyệt',
  CONFIRMED: 'Đã xác nhận',
  PROCESSING: 'Đang xử lý',
  READY_FOR_PICKUP: 'Sẵn sàng giao',
  SHIPPING: 'Đang giao',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã huỷ',
  ORDER_RETURN: 'Trả hàng',
  FAILED: 'Thất bại',
  DELETED: 'Đã xoá',
};

const STATUS_CLASS: Record<string, string> = {
  PENDING_PAYMENT: 'pending_payment',
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  READY_FOR_PICKUP: 'ready_for_pickup',
  SHIPPING: 'shipping',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  ORDER_RETURN: 'order_return',
  FAILED: 'failed',
  DELETED: 'deleted',
};

/**
 * Admin Orders — list cross-shop với rich filters + force status update.
 *
 * <p>Khác store-analytics (per-shop) ở chỗ admin xem mọi đơn của mọi shop.
 * Filter mạnh: status, shop, user, date range, search free-text. Detail modal
 * hiển thị items + totals + cho phép force status update bypass state machine.</p>
 */
@Component({
  selector: 'app-admin-orders',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './admin-orders.component.html',
  styleUrl: './admin-orders.component.css',
})
export class AdminOrdersComponent {
  private api = inject(AdminOrderService);
  private toast = inject(HotToastService);

  protected readonly placeholderShop = environment.placeholders.shop;
  protected readonly allStatuses: ReadonlyArray<OrderStatusValue> = ALL_STATUSES;

  // -----------------------------------------------------------------
  // Filters
  // -----------------------------------------------------------------
  protected readonly statusFilter = signal<'all' | OrderStatusValue>('all');
  protected readonly search = signal<string>('');
  protected readonly fromDate = signal<string>('');
  protected readonly toDate = signal<string>('');
  protected readonly page = signal<number>(0);

  protected readonly hasActiveFilters = computed(
    () =>
      this.statusFilter() !== 'all'
      || this.search() !== ''
      || this.fromDate() !== ''
      || this.toDate() !== '',
  );

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  protected onSearchChange(value: string): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.search.set(value);
      this.page.set(0);
    }, 300);
  }

  protected onStatusChange(v: 'all' | OrderStatusValue): void {
    this.statusFilter.set(v);
    this.page.set(0);
  }

  protected clearFilters(): void {
    this.statusFilter.set('all');
    this.search.set('');
    this.fromDate.set('');
    this.toDate.set('');
    this.page.set(0);
  }

  // -----------------------------------------------------------------
  // Resources
  // -----------------------------------------------------------------
  private readonly orders = rxResource<
    AdminOrderListPage,
    {
      status: 'all' | OrderStatusValue;
      search: string;
      fromDate: string;
      toDate: string;
      page: number;
    }
  >({
    request: () => ({
      status: this.statusFilter(),
      search: this.search(),
      fromDate: this.fromDate(),
      toDate: this.toDate(),
      page: this.page(),
    }),
    loader: ({ request }) =>
      this.api.list({
        status: request.status,
        search: request.search,
        // BE chấp nhận ISO datetime; convert date-only → start of day / end of day.
        fromDate: request.fromDate ? `${request.fromDate}T00:00:00` : undefined,
        toDate: request.toDate ? `${request.toDate}T23:59:59` : undefined,
        page: request.page,
        size: PAGE_SIZE,
      }),
  });

  private readonly statsResource = rxResource({
    request: () => ({}),
    loader: () => this.api.getStats(),
  });

  protected readonly stats = computed(() => this.statsResource.value() ?? null);
  protected readonly isLoading = computed(() => this.orders.isLoading());

  protected readonly errorMessage = computed(() => {
    const e1 = this.orders.error() as { status?: number; message?: string } | undefined;
    const e2 = this.statsResource.error() as { status?: number; message?: string } | undefined;
    const err = e1 ?? e2;
    if (!err) return null;
    if (err.status === 401 || err.status === 403) {
      return 'Bạn cần quyền ADMIN để xem trang này.';
    }
    return err.message ?? 'Không tải được danh sách đơn hàng.';
  });

  protected readonly orderRows = computed<AdminOrderRow[]>(() => this.orders.value()?.items ?? []);
  protected readonly totalItems = computed(() => this.orders.value()?.totalItems ?? 0);
  protected readonly totalPages = computed(() => this.orders.value()?.totalPages ?? 0);
  protected readonly rangeFrom = computed(() =>
    this.totalItems() === 0 ? 0 : this.page() * PAGE_SIZE + 1,
  );
  protected readonly rangeTo = computed(() =>
    Math.min((this.page() + 1) * PAGE_SIZE, this.totalItems()),
  );

  protected reload(): void {
    this.orders.reload();
    this.statsResource.reload();
  }

  protected prevPage(): void {
    if (this.page() > 0) this.page.update((p) => p - 1);
  }
  protected nextPage(): void {
    if (this.page() + 1 < this.totalPages()) this.page.update((p) => p + 1);
  }

  // -----------------------------------------------------------------
  // Detail modal
  // -----------------------------------------------------------------
  protected readonly detailModal = signal<AdminOrderRow | null>(null);
  protected readonly orderItems = signal<AdminOrderItem[]>([]);

  protected readonly loadingItems = signal<boolean>(false);
  protected readonly newStatus = signal<string>('');
  protected readonly busyId = signal<string | null>(null);

  protected openDetail(order: AdminOrderRow): void {
    this.detailModal.set(order);
    this.newStatus.set('');
    this.orderItems.set([]);
    this.loadingItems.set(true);
    this.api.getItems(order.orderId).subscribe({
      next: (its) => {
        this.orderItems.set(its);
        this.loadingItems.set(false);
      },
      error: () => {
        this.loadingItems.set(false);
      },
    });
  }

  protected closeDetail(): void {
    if (this.busyId()) return;
    this.detailModal.set(null);
  }

  protected applyForceStatus(): void {
    const order = this.detailModal();
    if (!order) return;
    const target = this.newStatus() as OrderStatusValue;
    if (!target || target === order.orderStatus) return;

    const ok = confirm(
      `Force chuyển đơn ${order.orderId.slice(0, 8)} từ "${this.statusLabel(order.orderStatus)}" → "${this.statusLabel(target)}"?`,
    );
    if (!ok) return;

    this.busyId.set(order.orderId);
    this.api.forceUpdateStatus(order.orderId, target).subscribe({
      next: (updated) => {
        this.busyId.set(null);
        this.toast.success(`Đã đổi sang ${this.statusLabel(target)}`);
        this.detailModal.set(updated);
        this.newStatus.set('');
        this.reload();
      },
      error: (err) => {
        this.busyId.set(null);
        this.toast.error(this.extractMessage(err, 'Không thể đổi trạng thái.'));
      },
    });
  }

  // -----------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------
  protected statusLabel(status: string | null | undefined): string {
    if (!status) return '—';
    return STATUS_LABEL[status.toUpperCase()] ?? status;
  }

  protected statusClass(status: string | null | undefined): string {
    if (!status) return '';
    return STATUS_CLASS[status.toUpperCase()] ?? '';
  }

  protected formatDate(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  protected formatNumber(n: number | null | undefined): string {
    return new Intl.NumberFormat('vi-VN').format(Number(n) || 0);
  }

  protected formatVnd(n: number | null | undefined): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(Number(n) || 0);
  }

  protected formatVndShort(n: number | null | undefined): string {
    const v = Number(n) || 0;
    if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B ₫`;
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}tr ₫`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k ₫`;
    return `${v.toLocaleString('vi-VN')} ₫`;
  }

  protected onLogoError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = this.placeholderShop;
  }

  private extractMessage(err: unknown, fallback: string): string {
    if (err && typeof err === 'object') {
      const e = err as { error?: { message?: string }; message?: string; status?: number };
      if (e.status === 401 || e.status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
      if (e.error?.message) return e.error.message;
      if (e.message) return e.message;
    }
    return fallback;
  }
}

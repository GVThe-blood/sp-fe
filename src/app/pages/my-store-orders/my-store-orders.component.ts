import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { HotToastService } from '@ngxpert/hot-toast';
import { firstValueFrom } from 'rxjs';
import { StoreSidebarComponent } from '../../components/store-sidebar/store-sidebar.component';
import {
  ALLOWED_TRANSITIONS,
  OrderDetail,
  OrderPage,
  ORDER_STATUS_LABEL,
  OrderService,
  OrderStatus,
} from '../../services/order.service';

interface OrdersRequest {
  page: number;
  size: number;
  refreshSeq: number;
}

const VND = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const STATUS_TONE: Record<OrderStatus, 'ok' | 'warn' | 'error' | 'neutral' | 'info'> = {
  PENDING: 'warn',
  PENDING_PAYMENT: 'warn',
  CONFIRMED: 'info',
  PROCESSING: 'info',
  READY_FOR_PICKUP: 'info',
  SHIPPING: 'info',
  COMPLETED: 'ok',
  ORDER_RETURN: 'warn',
  FAILED: 'error',
  DELETED: 'neutral',
};

@Component({
  selector: 'app-my-store-orders',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, StoreSidebarComponent],
  templateUrl: './my-store-orders.component.html',
  styleUrl: './my-store-orders.component.css',
})
export class MyStoreOrdersComponent {
  private orderService = inject(OrderService);
  private toast = inject(HotToastService);

  // Pagination
  protected page = signal(0);
  protected size = signal(10);
  private refreshSeq = signal(0);

  protected orders = rxResource<OrderPage, OrdersRequest>({
    request: () => ({ page: this.page(), size: this.size(), refreshSeq: this.refreshSeq() }),
    loader: ({ request }) =>
      this.orderService.listShopOrders(request.page, request.size, 'orderDate,DESC'),
  });

  protected items = computed<OrderDetail[]>(() => this.orders.value()?.content ?? []);
  protected totalElements = computed<number>(() => this.orders.value()?.totalElements ?? 0);
  protected totalPages = computed<number>(() => this.orders.value()?.totalPages ?? 0);

  protected errorMessage = computed(() => {
    const err = this.orders.error() as { error?: { message?: string }; message?: string; status?: number } | undefined;
    if (!err) return '';
    if (err.status === 401 || err.status === 403) {
      return 'Bạn cần đăng nhập với tài khoản chủ shop để xem đơn hàng.';
    }
    return err.error?.message ?? err.message ?? 'Không tải được đơn hàng.';
  });

  protected statusFilter = signal<OrderStatus | 'ALL'>('ALL');
  protected filteredItems = computed<OrderDetail[]>(() => {
    const f = this.statusFilter();
    if (f === 'ALL') return this.items();
    return this.items().filter((o) => o.orderStatus === f);
  });

  /** Available status filter chips. */
  protected readonly statusFilterOptions: ReadonlyArray<{ value: OrderStatus | 'ALL'; label: string }> = [
    { value: 'ALL', label: 'Tất cả' },
    { value: 'PENDING', label: ORDER_STATUS_LABEL.PENDING },
    { value: 'CONFIRMED', label: ORDER_STATUS_LABEL.CONFIRMED },
    { value: 'PROCESSING', label: ORDER_STATUS_LABEL.PROCESSING },
    { value: 'SHIPPING', label: ORDER_STATUS_LABEL.SHIPPING },
    { value: 'COMPLETED', label: ORDER_STATUS_LABEL.COMPLETED },
    { value: 'FAILED', label: ORDER_STATUS_LABEL.FAILED },
  ];

  // Detail modal
  protected showDetail = signal(false);
  protected detail = signal<OrderDetail | null>(null);
  protected updating = signal(false);

  // -------------------------------------------------------------------------
  // Pagination
  // -------------------------------------------------------------------------
  protected nextPage(): void {
    if (this.page() + 1 < this.totalPages()) this.page.update((p) => p + 1);
  }
  protected prevPage(): void {
    if (this.page() > 0) this.page.update((p) => p - 1);
  }
  protected reload(): void {
    this.refreshSeq.update((s) => s + 1);
  }

  protected setStatusFilter(v: OrderStatus | 'ALL'): void {
    this.statusFilter.set(v);
  }

  // -------------------------------------------------------------------------
  // Detail modal
  // -------------------------------------------------------------------------
  protected async openDetail(order: OrderDetail): Promise<void> {
    this.showDetail.set(true);
    this.detail.set(order);
    // Re-fetch to get fresh items (list endpoint may return slimmer payload).
    try {
      const fresh = await firstValueFrom(this.orderService.getShopOrderDetail(order.orderId));
      this.detail.set(fresh);
    } catch {
      // keep the partially-cached value if the refresh fails
    }
  }

  protected closeDetail(): void {
    this.showDetail.set(false);
    this.detail.set(null);
  }

  // -------------------------------------------------------------------------
  // Status transition
  // -------------------------------------------------------------------------
  protected nextActions(order: OrderDetail | null): OrderStatus[] {
    if (!order) return [];
    return ALLOWED_TRANSITIONS[order.orderStatus] ?? [];
  }

  protected statusLabel(status: OrderStatus): string {
    return ORDER_STATUS_LABEL[status] ?? status;
  }

  protected statusTone(status: OrderStatus): string {
    return STATUS_TONE[status] ?? 'neutral';
  }

  protected async transitionTo(target: OrderStatus): Promise<void> {
    const order = this.detail();
    if (!order) return;
    let reason: string | undefined;
    if (target === 'FAILED') {
      const r = window.prompt('Lý do hủy/thất bại đơn (tùy chọn):') ?? '';
      reason = r.trim() || undefined;
    }

    this.updating.set(true);
    try {
      const updated = await firstValueFrom(
        this.orderService.updateStatus(order.orderId, target, reason)
      );
      this.detail.set(updated);
      this.toast.success(`Đã chuyển sang "${this.statusLabel(target)}"`);
      this.reload();
    } catch (err: any) {
      this.toast.error(err?.error?.message ?? 'Không thể cập nhật trạng thái');
    } finally {
      this.updating.set(false);
    }
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------
  protected formatPrice(value: number | null | undefined): string {
    if (value == null) return '—';
    return VND.format(Number(value));
  }

  protected formatDate(value: string | null | undefined): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  protected shortId(id: string): string {
    return id.slice(0, 8).toUpperCase();
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HotToastService } from '@ngxpert/hot-toast';

import { OrderApiService } from '../../../services/order-api.service';
import { OrderDetailResponse } from '../../../models/order.model';
import { RealtimeNotificationService } from '../../../services/realtime-notification.service';
import { StoreSidebarComponent } from '../../../components/store-sidebar/store-sidebar.component';

/**
 * MyStoreOrdersComponent — Trang `/my-store/orders` cho shop owner.
 *
 * - List tất cả đơn hàng của shop (qua /api/v1/order/shop).
 * - Highlight đơn được trỏ tới qua `?highlight={orderId}` (từ click thông báo).
 * - Auto-refresh khi nhận được realtime notification ORDER_CREATED /
 *   ORDER_STATUS_CHANGED.
 * - Nút "Phê duyệt" chỉ hiển thị khi orderStatus thuộc nhóm chưa-duyệt.
 */
@Component({
  selector: 'app-my-store-orders',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DatePipe,
    RouterModule,
    StoreSidebarComponent
  ],
  template: `
    <main class="min-h-screen bg-[#f7fafc]">
      <div class="max-w-screen-2xl mx-auto px-4 py-6 grid grid-cols-12 gap-6">
        <aside class="col-span-12 md:col-span-3 lg:col-span-2">
          <app-store-sidebar activeRoute="/my-store/orders" />
        </aside>

        <section class="col-span-12 md:col-span-9 lg:col-span-10">
          <header class="flex items-center justify-between mb-6">
            <div>
              <h1 class="text-2xl font-bold text-[#181c1e]">
                Quản lý đơn hàng
              </h1>
              <p class="text-sm text-[#41493a] mt-1">
                Tổng cộng {{ totalElements() }} đơn ·
                <span class="text-orange-600 font-semibold">
                  {{ pendingCount() }} cần duyệt
                </span>
              </p>
            </div>
            <button
              type="button"
              class="px-4 py-2 rounded-xl border border-[#e1e6e1] hover:bg-white"
              (click)="refresh()"
            >
              Tải lại
            </button>
          </header>

          @if (loading()) {
            <div
              class="bg-white rounded-2xl p-12 text-center text-[#41493a]
                     shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
            >
              Đang tải đơn hàng…
            </div>
          } @else if (orders().length === 0) {
            <div
              class="bg-white rounded-2xl p-12 text-center text-[#41493a]
                     shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
            >
              <span class="material-symbols-outlined text-5xl text-[#bbb] mb-2">
                receipt_long
              </span>
              <p>Chưa có đơn hàng nào.</p>
            </div>
          } @else {
            <div class="space-y-3">
              @for (order of orders(); track order.orderId) {
                <article
                  class="rounded-2xl border bg-white p-4 transition flex items-start gap-4
                         shadow-[0_2px_10px_rgba(0,0,0,0.04)]"
                  [class.border-orange-400]="needsApproval(order)"
                  [class.bg-orange-50]="
                    needsApproval(order) || isHighlighted(order.orderId)
                  "
                  [class.ring-2]="isHighlighted(order.orderId)"
                  [class.ring-orange-400]="isHighlighted(order.orderId)"
                  [class.border-[#eef0f1]]="
                    !needsApproval(order) && !isHighlighted(order.orderId)
                  "
                >
                  <div class="flex-1 min-w-0">
                    <div class="flex flex-wrap items-center gap-2 mb-1">
                      <span class="text-sm font-semibold text-[#181c1e]">
                        Đơn #{{ shortId(order.orderId) }}
                      </span>
                      <span
                        class="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                        [ngClass]="statusClass(order.orderStatus)"
                      >
                        {{ statusLabel(order.orderStatus) }}
                      </span>
                      @if (needsApproval(order)) {
                        <span
                          class="text-[11px] px-2 py-0.5 rounded-full bg-orange-500
                                 text-white font-semibold"
                        >
                          Cần duyệt
                        </span>
                      }
                    </div>
                    <p class="text-xs text-[#41493a] mb-1">
                      {{ order.orderDate | date:'medium':'+0700' }}
                    </p>
                    <div
                      class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#181c1e]"
                    >
                      <span>
                        Tổng:
                        <span class="font-semibold">
                          {{ formatVND(order.finalPrice) }}
                        </span>
                      </span>
                      <span>
                        Phí ship: {{ formatVND(order.shippingFee) }}
                      </span>
                      <span>Thanh toán: {{ order.paymentMethod }}</span>
                    </div>
                  </div>

                  <div class="flex flex-col gap-2 flex-shrink-0">
                    @if (needsApproval(order)) {
                      <button
                        type="button"
                        class="px-4 py-2 rounded-xl bg-orange-500 text-white
                               font-semibold hover:bg-orange-600 transition"
                        [disabled]="approving() === order.orderId"
                        (click)="approve(order)"
                      >
                        @if (approving() === order.orderId) {
                          Đang duyệt…
                        } @else {
                          Phê duyệt
                        }
                      </button>
                    }
                  </div>
                </article>
              }
            </div>

            @if (totalPages() > 1) {
              <footer class="flex items-center justify-center gap-2 mt-6">
                <button
                  type="button"
                  class="px-3 py-1 rounded border"
                  [disabled]="page() === 0"
                  (click)="goToPage(page() - 1)"
                >
                  ‹
                </button>
                <span class="text-sm">
                  Trang {{ page() + 1 }} / {{ totalPages() }}
                </span>
                <button
                  type="button"
                  class="px-3 py-1 rounded border"
                  [disabled]="page() + 1 >= totalPages()"
                  (click)="goToPage(page() + 1)"
                >
                  ›
                </button>
              </footer>
            }
          }
        </section>
      </div>
    </main>
  `
})
export class MyStoreOrdersComponent implements OnInit {
  private orderApi = inject(OrderApiService);
  private realtime = inject(RealtimeNotificationService);
  private route = inject(ActivatedRoute);
  private toast = inject(HotToastService);

  loading = signal(false);
  approving = signal<string | null>(null);

  orders = signal<OrderDetailResponse[]>([]);
  page = signal(0);
  totalPages = signal(1);
  totalElements = signal(0);

  pendingCount = computed(
    () => this.orders().filter(o => this.needsApproval(o)).length
  );

  highlightOrderId = signal<string | null>(null);

  private readonly PAGE_SIZE = 20;

  /**
   * Auto-refresh khi nhận realtime notif ORDER_CREATED hoặc
   * ORDER_STATUS_CHANGED. Sử dụng signal `latestEvent` của service.
   */
  constructor() {
    effect(() => {
      const latest = this.realtime.latestEvent();
      if (!latest) return;
      if (latest.type === 'ORDER_CREATED' || latest.type === 'ORDER_STATUS_CHANGED') {
        this.load();
      }
    });
  }

  ngOnInit(): void {
    // Đọc query param highlight để focus 1 đơn cụ thể (sau khi click thông báo)
    const qp = this.route.snapshot.queryParamMap.get('highlight');
    if (qp) this.highlightOrderId.set(qp);

    // Đảm bảo realtime đang connect (header bell cũng đã connect, idempotent)
    this.realtime.connect();
    this.load();
  }

  refresh(): void {
    this.load();
  }

  goToPage(p: number): void {
    if (p < 0 || p >= this.totalPages()) return;
    this.page.set(p);
    this.load();
  }

  approve(order: OrderDetailResponse): void {
    if (this.approving() !== null) return;
    this.approving.set(order.orderId);
    this.orderApi.approveOrder(order.orderId).subscribe({
      next: updated => {
        this.toast.success('Đã phê duyệt đơn hàng');
        this.orders.update(list =>
          list.map(o => (o.orderId === order.orderId ? updated : o))
        );
        this.approving.set(null);
      },
      error: () => {
        this.approving.set(null);
      }
    });
  }

  // ============= UI helpers =============

  isHighlighted(orderId: string): boolean {
    return this.highlightOrderId() === orderId;
  }

  needsApproval(order: OrderDetailResponse): boolean {
    return (
      order.orderStatus === 'PENDING' ||
      order.orderStatus === 'PENDING_PAYMENT' ||
      order.orderStatus === 'PROCESSING'
    );
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'Chờ xử lý',
      PENDING_PAYMENT: 'Chờ thanh toán',
      PROCESSING: 'Đang xử lý',
      CONFIRMED: 'Đã xác nhận',
      READY_FOR_PICKUP: 'Sẵn sàng giao',
      SHIPPING: 'Đang giao',
      COMPLETED: 'Hoàn tất',
      ORDER_RETURN: 'Đơn trả',
      FAILED: 'Thất bại',
      DELETED: 'Đã xoá'
    };
    return map[status] ?? status;
  }

  statusClass(status: string): string {
    switch (status) {
      case 'PENDING':
      case 'PENDING_PAYMENT':
      case 'PROCESSING':
        return 'bg-orange-100 text-orange-700';
      case 'CONFIRMED':
      case 'READY_FOR_PICKUP':
      case 'SHIPPING':
        return 'bg-blue-100 text-blue-700';
      case 'COMPLETED':
        return 'bg-green-100 text-green-700';
      case 'FAILED':
      case 'DELETED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  shortId(id: string | undefined): string {
    return id ? id.slice(0, 8) : '----';
  }

  formatVND(v: number | undefined): string {
    if (v === undefined || v === null) return '0đ';
    return Number(v).toLocaleString('vi-VN') + 'đ';
  }

  // ============= internal =============

  private load(): void {
    this.loading.set(true);
    this.orderApi.getShopOrders(this.page(), this.PAGE_SIZE).subscribe({
      next: res => {
        this.orders.set(res.content ?? []);
        this.totalPages.set(res.totalPages ?? 1);
        this.totalElements.set(res.totalElements ?? 0);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HotToastService } from '@ngxpert/hot-toast';

import { OrderApiService } from '../../services/order-api.service';
import { OrderDetailResponse } from '../../models/order.model';
import { PaymentApiService } from '../../services/payment-api.service';
import { RealtimeNotificationService } from '../../services/realtime-notification.service';

/**
 * OrderHistoryComponent — Trang `/order-history` (lịch sử đơn của user hiện tại).
 *
 * - Load page bằng `/api/v1/order/history?page=&size=`.
 * - Auto-refresh khi nhận realtime ORDER_APPROVED (tới qua /user/queue/order-events).
 * - Highlight đơn được trỏ qua query param `?orderId=...`.
 */
@Component({
  selector: 'app-order-history',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DatePipe, RouterModule],
  template: `
    <main class="min-h-screen bg-[#f7fafc] py-8">
      <div class="max-w-screen-lg mx-auto px-4">
        <header class="mb-6 flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-[#181c1e]">Đơn hàng của tôi</h1>
            <p class="text-sm text-[#41493a] mt-1">
              Tổng cộng {{ totalElements() }} đơn
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
            Đang tải lịch sử đơn hàng…
          </div>
        } @else if (orders().length === 0) {
          <div
            class="bg-white rounded-2xl p-12 text-center text-[#41493a]
                   shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
          >
            <span class="material-symbols-outlined text-5xl text-[#bbb] mb-2">
              receipt
            </span>
            <p>Bạn chưa có đơn hàng nào.</p>
            <a
              routerLink="/"
              class="inline-block mt-4 px-4 py-2 rounded-xl bg-primary text-white
                     font-semibold hover:opacity-90 transition"
            >
              Tiếp tục mua sắm
            </a>
          </div>
        } @else {
          <div class="space-y-3">
            @for (order of orders(); track order.orderId) {
              <article
                class="rounded-2xl bg-white p-4 transition border
                       shadow-[0_2px_10px_rgba(0,0,0,0.04)]"
                [class.ring-2]="isHighlighted(order.orderId)"
                [class.ring-green-400]="isHighlighted(order.orderId)"
                [class.border-green-200]="isHighlighted(order.orderId)"
                [class.border-[#eef0f1]]="!isHighlighted(order.orderId)"
              >
                <div class="flex flex-wrap items-center gap-2 mb-2">
                  <span class="text-sm font-semibold text-[#181c1e]">
                    Đơn #{{ shortId(order.orderId) }}
                  </span>
                  <span
                    class="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                    [ngClass]="statusClass(order.orderStatus)"
                  >
                    {{ statusLabel(order.orderStatus) }}
                  </span>
                  <span
                    *ngIf="order.paymentStatus === 'PAID'"
                    class="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-700"
                  >
                    Đã thanh toán
                  </span>
                  <span
                    *ngIf="order.paymentStatus === 'REFUNDED'"
                    class="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-purple-100 text-purple-700"
                  >
                    Đã hoàn tiền
                  </span>
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
                  <span>Phí ship: {{ formatVND(order.shippingFee) }}</span>
                  <span>Thanh toán: {{ order.paymentMethod }}</span>
                </div>

                <!-- Refund button: chỉ với đơn VNPAY đã PAID và chưa giao xong -->
                <div
                  *ngIf="canRefund(order)"
                  class="mt-3 flex items-center gap-2"
                >
                  <button
                    type="button"
                    class="px-4 py-2 rounded-xl border border-orange-400 text-orange-600
                           font-semibold text-sm hover:bg-orange-50 transition disabled:opacity-50
                           disabled:cursor-not-allowed"
                    [disabled]="refunding() === order.orderId"
                    (click)="onRefund(order)"
                  >
                    @if (refunding() === order.orderId) {
                      Đang hoàn tiền…
                    } @else {
                      <span class="flex items-center gap-1">
                        <span class="material-symbols-outlined text-base">currency_exchange</span>
                        Yêu cầu hoàn tiền
                      </span>
                    }
                  </button>
                  <span class="text-xs text-[#888]">
                    Hoàn tiền VNPay về tài khoản gốc trong 5–7 ngày làm việc
                  </span>
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
      </div>
    </main>
  `
})
export class OrderHistoryComponent implements OnInit {
  private orderApi = inject(OrderApiService);
  private paymentApi = inject(PaymentApiService);
  private realtime = inject(RealtimeNotificationService);
  private route = inject(ActivatedRoute);
  private toast = inject(HotToastService);

  loading = signal(false);
  refunding = signal<string | null>(null);
  orders = signal<OrderDetailResponse[]>([]);
  page = signal(0);
  totalPages = signal(1);
  totalElements = signal(0);
  highlightOrderId = signal<string | null>(null);

  private readonly PAGE_SIZE = 10;

  constructor() {
    // Auto-refresh khi shop duyệt đơn
    effect(() => {
      const latest = this.realtime.latestEvent();
      if (!latest) return;
      if (latest.type === 'ORDER_APPROVED') {
        const oid = latest.payload?.['orderId'] as string | undefined;
        if (oid) this.highlightOrderId.set(oid);
        this.load();
      }
    });
  }

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParamMap.get('orderId');
    if (qp) this.highlightOrderId.set(qp);

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

  /**
   * Cho phép yêu cầu hoàn tiền nếu:
   *  - Phương thức thanh toán = VNPAY (sandbox không support refund COD).
   *  - Đã thanh toán thành công (paymentStatus = PAID).
   *  - Đơn hàng chưa hoàn tất (chưa COMPLETED) — đã giao thì coi như xong.
   *  - Chưa từng được hoàn tiền (paymentStatus !== REFUNDED).
   */
  canRefund(order: OrderDetailResponse): boolean {
    const method = (order.paymentMethod ?? '').toUpperCase();
    if (method !== 'VNPAY') return false;
    if (order.paymentStatus !== 'PAID') return false;
    if (order.orderStatus === 'COMPLETED') return false;
    return true;
  }

  onRefund(order: OrderDetailResponse): void {
    if (this.refunding() !== null) return;
    const ok = window.confirm(
      `Bạn chắc chắn muốn hoàn tiền cho đơn #${this.shortId(order.orderId)} ` +
        `(${this.formatVND(order.finalPrice)})?\n\n` +
        'Sau khi hoàn tiền, đơn hàng sẽ bị huỷ. Tiền sẽ về tài khoản gốc trong 5–7 ngày làm việc.'
    );
    if (!ok) return;

    this.refunding.set(order.orderId);
    this.paymentApi.refundOrder(order.orderId).subscribe({
      next: msg => {
        this.refunding.set(null);
        // Message từ BE đã là tiếng Việt (xem VNPayServiceImpl#handlePaymentRefund)
        if (msg && msg.toLowerCase().includes('thành công')) {
          this.toast.success(msg, { duration: 6000 });
          // Optimistic update: đánh dấu đơn đã refund
          this.orders.update(list =>
            list.map(o =>
              o.orderId === order.orderId
                ? { ...o, paymentStatus: 'REFUNDED' as const }
                : o
            )
          );
          // Reload sau 1s để chắc chắn data sync với BE
          setTimeout(() => this.load(), 1000);
        } else {
          this.toast.warning(msg || 'Không hoàn tiền được, vui lòng thử lại.', {
            duration: 6000
          });
        }
      },
      error: () => {
        this.refunding.set(null);
      }
    });
  }

  // ============= UI helpers =============

  isHighlighted(id: string): boolean {
    return this.highlightOrderId() === id;
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
    this.orderApi.getOrderHistory(this.page(), this.PAGE_SIZE).subscribe({
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

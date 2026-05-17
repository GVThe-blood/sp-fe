import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Router } from '@angular/router';

import { ProfileSidebarComponent } from '../../components/profile-sidebar/profile-sidebar.component';
import { OrderApiService } from '../../services/order-api.service';
import { OrderDetailResponse, OrderStatus } from '../../models/order.model';

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  PREPARING: 'Đang chuẩn bị',
  SHIPPING: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã huỷ',
  REFUNDED: 'Đã hoàn tiền'
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING:   'bg-[#ffdcc6] text-[#642f00]',
  CONFIRMED: 'bg-[#d9e3f9] text-[#2f394a]',
  PREPARING: 'bg-[#d9e3f9] text-[#2f394a]',
  SHIPPING:  'bg-[#fff4cc] text-[#5a4500]',
  DELIVERED: 'bg-[#c4e8a0] text-[#1a4100]',
  CANCELLED: 'bg-[#ffdad6] text-[#93000a]',
  REFUNDED:  'bg-[#e0e3e5] text-[#41493a]'
};

/**
 * OrdersComponent — Trang lịch sử đơn hàng.
 * Route: `/orders` (lazy load + authGuard).
 * Endpoint BE: GET /api/v1/order/history?page=&size=
 */
@Component({
  selector: 'app-orders',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CurrencyPipe, DatePipe, ProfileSidebarComponent],
  styleUrl: '../profile/profile.component.css',
  template: `
    <main class="profile-page">
      <app-profile-sidebar [activeRoute]="'/orders'" />

      <div class="profile-content">
        <div class="content-card">
          <header class="content-header">
            <div class="header-text">
              <h1 class="content-title">Đơn hàng của tôi</h1>
              <p class="content-subtitle">Tổng: {{ totalElements() }} đơn</p>
            </div>
          </header>

          @if (loading() && !items().length) {
            <div class="text-center py-12 text-[#41493a]">Đang tải lịch sử đơn hàng...</div>
          }

          @else if (!items().length) {
            <section class="empty-state">
              <span class="material-symbols-outlined">receipt_long</span>
              <p>Bạn chưa có đơn hàng nào</p>
              <button class="btn-add-empty" (click)="goShopping()">
                Mua sắm ngay
              </button>
            </section>
          }

          @else {
            <ul class="space-y-4">
              @for (order of items(); track order.orderId) {
                <li
                  class="border border-[#e0e3e5] rounded-2xl p-5
                         hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-shadow cursor-pointer"
                  (click)="goToDetail(order.orderId)"
                >
                  <div class="flex items-start justify-between flex-wrap gap-3">
                    <div>
                      <div class="flex items-center gap-3 flex-wrap">
                        <span class="text-sm font-semibold text-[#181c1e]">
                          Mã đơn: #{{ order.orderId.slice(0, 8) }}
                        </span>
                        <span
                          class="text-xs px-2 py-0.5 rounded-full font-semibold"
                          [class]="statusClass(order.orderStatus)"
                        >
                          {{ statusLabel(order.orderStatus) }}
                        </span>
                      </div>
                      <p class="text-xs text-[#41493a] mt-1">
                        Ngày đặt: {{ order.orderDate | date: 'dd/MM/yyyy HH:mm' }}
                      </p>
                    </div>
                    <div class="text-right">
                      <p class="text-xs text-[#41493a]">Tổng</p>
                      <p class="text-lg font-bold text-[#306c00]">
                        {{ order.finalPrice | currency: 'VND' : 'symbol' : '1.0-0' }}
                      </p>
                    </div>
                  </div>

                  @if (order.items.length) {
                    <div class="mt-3 pt-3 border-t border-[#e0e3e5]">
                      <p class="text-xs text-[#717a68] mb-2">
                        {{ order.items.length }} sản phẩm
                      </p>
                      <ul class="space-y-1">
                        @for (item of order.items.slice(0, 3); track $index) {
                          <li class="text-sm text-[#181c1e] truncate">
                            • {{ item.productName ?? 'Sản phẩm' }}
                            @if (item.quantity) {
                              <span class="text-[#41493a]"> × {{ item.quantity }}</span>
                            }
                          </li>
                        }
                      </ul>
                      @if (order.items.length > 3) {
                        <p class="text-xs text-[#717a68] mt-1">
                          ... và {{ order.items.length - 3 }} sản phẩm khác
                        </p>
                      }
                    </div>
                  }
                </li>
              }
            </ul>

            <!-- Pagination -->
            @if (totalPages() > 1) {
              <nav class="flex justify-center items-center gap-2 mt-6">
                <button
                  type="button"
                  (click)="prev()"
                  [disabled]="currentPage() === 0"
                  class="px-3 py-1 rounded-lg border border-[#c1cab5] disabled:opacity-40"
                >
                  ←
                </button>
                <span class="text-sm text-[#41493a]">
                  Trang {{ currentPage() + 1 }} / {{ totalPages() }}
                </span>
                <button
                  type="button"
                  (click)="next()"
                  [disabled]="currentPage() + 1 >= totalPages()"
                  class="px-3 py-1 rounded-lg border border-[#c1cab5] disabled:opacity-40"
                >
                  →
                </button>
              </nav>
            }
          }
        </div>
      </div>
    </main>
  `,
  styles: [``]
})
export class OrdersComponent implements OnInit {
  private orderApi = inject(OrderApiService);
  private router = inject(Router);

  readonly PAGE_SIZE = 10;
  protected currentPage = signal(0);

  items = computed<OrderDetailResponse[]>(() => this.orderApi.history()?.content ?? []);
  totalElements = computed(() => this.orderApi.history()?.totalElements ?? 0);
  totalPages = computed(() => this.orderApi.history()?.totalPages ?? 0);
  loading = this.orderApi.loading;

  ngOnInit(): void {
    this.load(0);
  }

  private load(page: number): void {
    this.currentPage.set(page);
    this.orderApi.loadHistory(page, this.PAGE_SIZE).subscribe({ error: () => {} });
  }

  next(): void {
    if (this.currentPage() + 1 < this.totalPages()) {
      this.load(this.currentPage() + 1);
    }
  }

  prev(): void {
    if (this.currentPage() > 0) {
      this.load(this.currentPage() - 1);
    }
  }

  goToDetail(orderId: string): void {
    this.router.navigate(['/orders', orderId]);
  }

  goShopping(): void {
    this.router.navigate(['/']);
  }

  statusLabel(s: OrderStatus): string {
    return STATUS_LABELS[s] ?? s;
  }

  statusClass(s: OrderStatus): string {
    return STATUS_COLORS[s] ?? 'bg-[#e0e3e5] text-[#41493a]';
  }
}

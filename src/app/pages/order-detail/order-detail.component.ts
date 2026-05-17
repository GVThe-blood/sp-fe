import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Router } from '@angular/router';

import { OrderApiService } from '../../services/order-api.service';
import { OrderDetailResponse, OrderStatus } from '../../models/order.model';
import { ProfileSidebarComponent } from '../../components/profile-sidebar/profile-sidebar.component';

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  PREPARING: 'Đang chuẩn bị',
  SHIPPING: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã huỷ',
  REFUNDED: 'Đã hoàn tiền'
};

/**
 * OrderDetailComponent — Chi tiết 1 đơn hàng.
 * Route: `/orders/:orderId`. Param `orderId` bind tự động qua `withComponentInputBinding`.
 */
@Component({
  selector: 'app-order-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CurrencyPipe, DatePipe, ProfileSidebarComponent],
  styleUrl: '../profile/profile.component.css',
  template: `
    <main class="profile-page">
      <app-profile-sidebar [activeRoute]="'/orders'" />

      <div class="profile-content">
        <div class="content-card">
          <button
            type="button"
            (click)="goBack()"
            class="text-sm text-[#41493a] hover:text-[#6db33f] mb-4 inline-flex items-center gap-1"
          >
            ← Quay lại lịch sử đơn hàng
          </button>

          @if (loading()) {
            <div class="text-center py-12 text-[#41493a]">Đang tải chi tiết...</div>
          }

          @else if (!order()) {
            <div class="text-center py-12 text-[#ba1a1a]">Không tìm thấy đơn hàng.</div>
          }

          @else if (order()) {
            @let o = order()!;
            <header class="mb-6 pb-4 border-b border-[#e0e3e5]">
              <div class="flex items-baseline justify-between flex-wrap gap-2">
                <h1 class="text-2xl font-bold text-[#181c1e]">
                  Đơn hàng #{{ o.orderId.slice(0, 8) }}
                </h1>
                <span class="text-xs px-3 py-1 rounded-full font-semibold bg-[#d9e3f9] text-[#2f394a]">
                  {{ statusLabel(o.orderStatus) }}
                </span>
              </div>
              <p class="text-sm text-[#41493a] mt-1">
                Đặt lúc: {{ o.orderDate | date: 'EEEE, dd/MM/yyyy HH:mm' }}
              </p>
              @if (o.deliveredAt) {
                <p class="text-sm text-[#306c00] mt-1">
                  Giao lúc: {{ o.deliveredAt | date: 'dd/MM/yyyy HH:mm' }}
                </p>
              }
            </header>

            <!-- Items -->
            <section class="mb-6">
              <h2 class="text-base font-semibold text-[#181c1e] mb-3">Sản phẩm ({{ o.items.length }})</h2>
              <ul class="divide-y divide-[#e0e3e5]">
                @for (item of o.items; track $index) {
                  <li class="py-3 flex items-center gap-3">
                    @if (item.productImage) {
                      <img
                        [src]="item.productImage"
                        [alt]="item.productName"
                        class="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                      />
                    }
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-semibold text-[#181c1e] truncate">
                        {{ item.productName ?? 'Sản phẩm' }}
                      </p>
                      @if (item.variantName) {
                        <p class="text-xs text-[#41493a]">{{ item.variantName }}</p>
                      }
                      <p class="text-xs text-[#41493a]">
                        SL: {{ item.quantity ?? 1 }}
                        @if (item.price != null) {
                          × {{ item.price | currency: 'VND' : 'symbol' : '1.0-0' }}
                        }
                      </p>
                    </div>
                    @if (item.total != null) {
                      <span class="text-sm font-bold text-[#181c1e]">
                        {{ item.total | currency: 'VND' : 'symbol' : '1.0-0' }}
                      </span>
                    }
                  </li>
                }
              </ul>
            </section>

            <!-- Shipping -->
            @if (o.shippingAddress) {
              <section class="mb-6">
                <h2 class="text-base font-semibold text-[#181c1e] mb-2">Địa chỉ giao hàng</h2>
                <p class="text-sm text-[#41493a]">{{ o.shippingAddress }}</p>
              </section>
            }

            <!-- Summary -->
            <section class="bg-[#f1f4f6] rounded-2xl p-5 space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-[#41493a]">Tạm tính</span>
                <span class="text-[#181c1e]">
                  {{ o.subtotalAmount | currency: 'VND' : 'symbol' : '1.0-0' }}
                </span>
              </div>
              @if (o.shippingFee != null) {
                <div class="flex justify-between">
                  <span class="text-[#41493a]">Phí vận chuyển</span>
                  <span class="text-[#181c1e]">
                    {{ o.shippingFee | currency: 'VND' : 'symbol' : '1.0-0' }}
                  </span>
                </div>
              }
              @if (o.discount && o.discount > 0) {
                <div class="flex justify-between">
                  <span class="text-[#41493a]">Giảm giá</span>
                  <span class="text-[#306c00]">
                    -{{ o.discount | currency: 'VND' : 'symbol' : '1.0-0' }}
                  </span>
                </div>
              }
              <div class="flex justify-between border-t border-[#c1cab5] pt-2 mt-2">
                <span class="font-semibold text-[#181c1e]">Tổng cộng</span>
                <span class="text-lg font-bold text-[#306c00]">
                  {{ o.finalPrice | currency: 'VND' : 'symbol' : '1.0-0' }}
                </span>
              </div>
              @if (o.paymentMethod || o.paymentStatus) {
                <div class="flex justify-between text-xs text-[#717a68] pt-2">
                  @if (o.paymentMethod) {
                    <span>Phương thức: {{ o.paymentMethod }}</span>
                  }
                  @if (o.paymentStatus) {
                    <span>Trạng thái: {{ o.paymentStatus }}</span>
                  }
                </div>
              }
            </section>
          }
        </div>
      </div>
    </main>
  `,
  styles: [``]
})
export class OrderDetailComponent implements OnInit {
  private orderApi = inject(OrderApiService);
  private router = inject(Router);

  /** Bind từ route param `:orderId` qua withComponentInputBinding. */
  orderId = input.required<string>();

  protected loading = signal(true);
  protected order = signal<OrderDetailResponse | null>(null);

  ngOnInit(): void {
    this.orderApi.getOrderDetail(this.orderId()).subscribe({
      next: (data) => {
        this.order.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  goBack(): void {
    this.router.navigate(['/orders']);
  }

  statusLabel(s: OrderStatus): string {
    return STATUS_LABELS[s] ?? s;
  }
}

import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

import { CartResponse } from '../../../models/cart.model';

/**
 * CartSummaryComponent — Sticky summary panel hiển thị tạm tính + CTA checkout.
 *
 * Outputs:
 *  - checkout : user nhấn "Thanh toán" → parent navigate /order
 *  - clearAll : user nhấn "Xoá tất cả" (đã confirm sẵn ở parent)
 */
@Component({
  selector: 'app-cart-summary',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe],
  template: `
    <aside
      class="bg-white rounded-3xl p-6
             shadow-[0_4px_20px_rgba(0,0,0,0.06)]
             lg:sticky lg:top-24"
    >
      <h2 class="text-xl font-bold text-[#181c1e] mb-4">Tóm tắt đơn hàng</h2>

      <dl class="space-y-3 text-sm">
        <div class="flex justify-between items-baseline">
          <dt class="text-[#41493a]">Tổng số sản phẩm</dt>
          <dd class="font-semibold text-[#181c1e]">{{ cart().totalItems }}</dd>
        </div>
        <div class="flex justify-between items-baseline">
          <dt class="text-[#41493a]">Đã chọn</dt>
          <dd class="font-semibold text-[#181c1e]">{{ cart().selectedItems }}</dd>
        </div>

        <div class="border-t border-[#e0e3e5] pt-3 flex justify-between items-baseline">
          <dt class="text-base text-[#181c1e] font-semibold">Tạm tính</dt>
          <dd class="text-2xl font-bold text-[#306c00]">
            {{ cart().selectedTotal | currency: 'VND' : 'symbol' : '1.0-0' }}
          </dd>
        </div>
      </dl>

      @if (cart().warnings && cart().warnings.length > 0) {
        <ul class="mt-4 space-y-1">
          @for (w of cart().warnings; track w) {
            <li class="text-xs text-[#964900]">⚠️ {{ w }}</li>
          }
        </ul>
      }

      <button
        type="button"
        (click)="checkout.emit()"
        [disabled]="!cart().canCheckout"
        class="w-full mt-6 py-3.5 rounded-xl font-bold text-white
               bg-[#ff8928] hover:bg-[#ffb786]
               transition-all duration-300 shadow-sm
               disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Thanh toán
        @if (cart().selectedItems > 0) {
          <span class="ml-1">({{ cart().selectedItems }})</span>
        }
      </button>

      <button
        type="button"
        (click)="clearAll.emit()"
        [disabled]="cart().totalItems === 0"
        class="w-full mt-3 py-2.5 rounded-xl font-medium
               text-[#41493a] hover:text-[#ba1a1a]
               border border-[#c1cab5] hover:border-[#ba1a1a]
               transition-colors duration-300
               disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Xoá tất cả
      </button>
    </aside>
  `
})
export class CartSummaryComponent {
  cart = input.required<CartResponse>();

  checkout = output<void>();
  clearAll = output<void>();
}

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output
} from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';

import { CartItemResponse } from '../../../models/cart.model';
import { environment } from '../../../../environments/environment';

/**
 * CartItemRowComponent — Hiển thị 1 dòng item trong cart.
 *
 * Inputs: item (signal-based, required).
 * Outputs:
 *  - toggle(boolean)    : check/uncheck item
 *  - qtyChange(number)  : đổi số lượng (>=1). Khi user nhấn "-" lúc qty=1 → emit `remove` thay vì qtyChange(0).
 *  - remove()           : xoá item
 */
@Component({
  selector: 'app-cart-item-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, DecimalPipe],
  template: `
    <article
      class="flex items-start gap-4 py-4 border-b border-[#e0e3e5] last:border-b-0
             transition-opacity"
      [class.opacity-50]="isUnavailable()"
    >
      <!-- Checkbox -->
      <label class="flex items-center pt-10 cursor-pointer select-none">
        <input
          type="checkbox"
          [checked]="item().selected"
          [disabled]="isUnavailable()"
          (change)="onToggle($event)"
          class="w-5 h-5 rounded-md accent-[#6db33f] cursor-pointer"
          aria-label="Chọn sản phẩm"
        />
      </label>

      <!-- Image -->
      <div
        class="w-24 h-24 rounded-2xl overflow-hidden bg-[#f1f4f6] flex-shrink-0"
      >
        <img
          [src]="item().productImage || placeholder"
          [alt]="item().productName"
          class="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      <!-- Info -->
      <div class="flex-1 min-w-0">
        <h3
          class="text-base font-semibold text-[#181c1e] line-clamp-2 mb-1"
        >
          {{ item().productName }}
        </h3>

        @if (item().variantName) {
          <p class="text-sm text-[#41493a] mb-1">{{ item().variantName }}</p>
        }

        @if (item().promotionName) {
          <span
            class="inline-block text-xs px-2 py-0.5 rounded-full
                   bg-[#ffdcc6] text-[#642f00] font-semibold mb-2"
          >
            {{ item().promotionName }}
          </span>
        }

        <!-- Pricing -->
        <div class="flex items-center gap-2 flex-wrap">
          @if (showOriginalPrice()) {
            <span class="text-sm text-[#717a68] line-through">
              {{ item().originalPrice | currency: 'VND' : 'symbol' : '1.0-0' }}
            </span>
          }
          <span class="text-base font-bold text-[#306c00]">
            {{ unitPrice() | currency: 'VND' : 'symbol' : '1.0-0' }}
          </span>
          @if (discountPercent() > 0) {
            <span
              class="text-xs px-2 py-0.5 rounded-full
                     bg-[#ffdcc6] text-[#642f00] font-bold"
            >
              -{{ discountPercent() }}%
            </span>
          }
        </div>

        <!-- Stock / unavailable badge -->
        @if (isUnavailable()) {
          <p class="text-xs text-[#ba1a1a] font-semibold mt-2">
            ⚠️
            {{
              item().unavailableMessage ||
                item().unavailableReason ||
                'Sản phẩm tạm hết hàng'
            }}
          </p>
        } @else if (showStockWarning()) {
          <p class="text-xs text-[#964900] font-semibold mt-2">
            ⚠️ Vượt quá tồn kho (còn
            {{ item().availableStock | number }})
          </p>
        }
      </div>

      <!-- Qty stepper -->
      <div class="flex items-center gap-2 pt-9">
        <button
          type="button"
          (click)="decrement()"
          [disabled]="isUnavailable()"
          class="w-8 h-8 rounded-full border border-[#c1cab5]
                 flex items-center justify-center
                 hover:border-[#6db33f] hover:text-[#6db33f]
                 disabled:opacity-40 disabled:cursor-not-allowed
                 transition-colors"
          aria-label="Giảm số lượng"
        >
          <span class="text-lg leading-none">−</span>
        </button>

        <span
          class="min-w-[2.5rem] text-center font-semibold text-[#181c1e]"
          aria-live="polite"
        >
          {{ item().quantity }}
        </span>

        <button
          type="button"
          (click)="increment()"
          [disabled]="isUnavailable()"
          class="w-8 h-8 rounded-full border border-[#c1cab5]
                 flex items-center justify-center
                 hover:border-[#6db33f] hover:text-[#6db33f]
                 disabled:opacity-40 disabled:cursor-not-allowed
                 transition-colors"
          aria-label="Tăng số lượng"
        >
          <span class="text-lg leading-none">+</span>
        </button>
      </div>

      <!-- Total + remove -->
      <div class="flex flex-col items-end gap-3 pt-9 min-w-[100px]">
        <span class="text-base font-bold text-[#181c1e]">
          {{ rowTotal() | currency: 'VND' : 'symbol' : '1.0-0' }}
        </span>
        <button
          type="button"
          (click)="remove.emit()"
          class="text-[#717a68] hover:text-[#ba1a1a] transition-colors"
          aria-label="Xoá sản phẩm"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
            />
          </svg>
        </button>
      </div>
    </article>
  `
})
export class CartItemRowComponent {
  item = input.required<CartItemResponse>();

  toggle = output<boolean>();
  qtyChange = output<number>();
  remove = output<void>();

  readonly placeholder = environment.placeholders?.product;

  isUnavailable = computed(() => this.item().isAvailable === false);

  unitPrice = computed(() => {
    const it = this.item();
    return it.price ?? it.originalPrice ?? 0;
  });

  rowTotal = computed(() => {
    const it = this.item();
    if (it.finalPrice != null) return it.finalPrice;
    return this.unitPrice() * it.quantity;
  });

  showOriginalPrice = computed(() => {
    const it = this.item();
    return (
      it.originalPrice != null &&
      it.price != null &&
      it.originalPrice > it.price
    );
  });

  discountPercent = computed(() => {
    const it = this.item();
    if (it.discountPercent != null) return it.discountPercent;
    if (
      it.originalPrice != null &&
      it.price != null &&
      it.originalPrice > 0 &&
      it.originalPrice > it.price
    ) {
      return Math.round(((it.originalPrice - it.price) / it.originalPrice) * 100);
    }
    return 0;
  });

  showStockWarning = computed(() => {
    const it = this.item();
    return (
      it.availableStock != null &&
      it.quantity > it.availableStock &&
      it.isAvailable !== false
    );
  });

  onToggle(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.toggle.emit(checked);
  }

  increment(): void {
    this.qtyChange.emit(this.item().quantity + 1);
  }

  decrement(): void {
    const current = this.item().quantity;
    if (current <= 1) {
      this.remove.emit();
    } else {
      this.qtyChange.emit(current - 1);
    }
  }
}

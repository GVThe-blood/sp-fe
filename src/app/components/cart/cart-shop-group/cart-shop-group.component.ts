import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

import { ShopCartGroup } from '../../../models/cart.model';
import { CartItemRowComponent } from '../cart-item-row/cart-item-row.component';

/**
 * CartShopGroupComponent — Group items theo shop với header + total.
 *
 * Outputs forward từ child rows để parent (CartComponent) gọi API.
 */
@Component({
  selector: 'app-cart-shop-group',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, CartItemRowComponent],
  template: `
    <section
      class="bg-white rounded-3xl p-6
             shadow-[0_4px_20px_rgba(0,0,0,0.06)]
             hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]
             transition-shadow duration-300"
    >
      <!-- Header -->
      <header class="flex items-center justify-between gap-4 pb-4 border-b border-[#e0e3e5]">
        <label class="flex items-center gap-3 cursor-pointer select-none flex-1 min-w-0">
          <input
            type="checkbox"
            [checked]="group().allSelected"
            (change)="onToggleShop($event)"
            class="w-5 h-5 rounded-md accent-[#6db33f] flex-shrink-0"
            aria-label="Chọn tất cả sản phẩm của shop"
          />
          <div class="flex items-center gap-2 min-w-0">
            @if (group().shopAvatar) {
              <img
                [src]="group().shopAvatar"
                [alt]="group().shopName || 'Shop'"
                class="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
            }
            <h2 class="text-lg font-semibold text-[#181c1e] truncate">
              {{ group().shopName || 'Shop' }}
            </h2>
            @if (group().hasUnavailableItems) {
              <span
                class="text-xs px-2 py-0.5 rounded-full
                       bg-[#ffdad6] text-[#93000a] font-semibold flex-shrink-0"
              >
                Có sản phẩm hết hàng
              </span>
            }
          </div>
        </label>

        <span class="text-sm text-[#41493a] flex-shrink-0">
          Đã chọn
          <strong class="text-[#181c1e]">{{ group().selectedCount }}</strong>
          /{{ group().itemCount }}
        </span>
      </header>

      <!-- Items list -->
      <div>
        @for (item of group().items; track item.sku) {
          <app-cart-item-row
            [item]="item"
            (toggle)="onToggleItem(item.sku, $event)"
            (qtyChange)="onQtyChange(item.sku, $event)"
            (remove)="remove.emit(item.sku)"
          />
        }
      </div>

      <!-- Footer total -->
      <footer class="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-[#e0e3e5]">
        <span class="text-sm text-[#41493a]">Tổng shop:</span>
        <span class="text-lg font-bold text-[#306c00]">
          {{ group().selectedTotal | currency: 'VND' : 'symbol' : '1.0-0' }}
        </span>
      </footer>
    </section>
  `
})
export class CartShopGroupComponent {
  group = input.required<ShopCartGroup>();

  toggleShop = output<boolean>();
  toggleItem = output<{ sku: string; selected: boolean }>();
  qtyChange = output<{ sku: string; qty: number }>();
  remove = output<string>();

  onToggleShop(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.toggleShop.emit(checked);
  }

  onToggleItem(sku: string, selected: boolean): void {
    this.toggleItem.emit({ sku, selected });
  }

  onQtyChange(sku: string, qty: number): void {
    this.qtyChange.emit({ sku, qty });
  }
}

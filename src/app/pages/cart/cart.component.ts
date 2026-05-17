import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit
} from '@angular/core';
import { Router } from '@angular/router';

import { CartApiService } from '../../services/cart-api.service';
import { CartEmptyComponent } from '../../components/cart/cart-empty/cart-empty.component';
import { CartShopGroupComponent } from '../../components/cart/cart-shop-group/cart-shop-group.component';
import { CartSummaryComponent } from '../../components/cart/cart-summary/cart-summary.component';

/**
 * CartComponent — Page container cho route `/cart`.
 *
 * Source of truth là `CartApiService` (signal-based). Page này chỉ render UI và
 * forward events tới service. Pessimistic update — đợi response BE mới cập nhật UI
 * (optimistic là phase 2 theo design.md §10).
 */
@Component({
  selector: 'app-cart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CartEmptyComponent, CartShopGroupComponent, CartSummaryComponent],
  template: `
    <main class="min-h-screen bg-[#f7fafc] py-8">
      <div class="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <header class="mb-6">
          <h1 class="text-3xl font-bold text-[#181c1e]">
            Giỏ hàng
            @if (cart()) {
              <span class="text-base font-normal text-[#41493a]">
                ({{ cart()!.totalItems }} sản phẩm)
              </span>
            }
          </h1>
        </header>

        @if (showSkeleton()) {
          <div
            class="bg-white rounded-3xl p-12 text-center text-[#41493a]
                   shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
          >
            Đang tải giỏ hàng...
          </div>
        } @else if (cartApi.isEmpty()) {
          <app-cart-empty />
        } @else if (cart()) {
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Shop groups -->
            <div class="lg:col-span-2 space-y-4">
              @for (group of cart()!.shopGroups; track group.shopId || group.shopName) {
                <app-cart-shop-group
                  [group]="group"
                  (toggleShop)="onToggleShop(group.shopId, $event)"
                  (toggleItem)="onToggleItem($event)"
                  (qtyChange)="onQtyChange($event)"
                  (remove)="onRemove($event)"
                />
              }
            </div>

            <!-- Summary -->
            <div>
              <app-cart-summary
                [cart]="cart()!"
                (checkout)="onCheckout()"
                (clearAll)="onClearAll()"
              />
            </div>
          </div>
        }
      </div>
    </main>
  `
})
export class CartComponent implements OnInit {
  protected cartApi = inject(CartApiService);
  private router = inject(Router);

  cart = this.cartApi.cart;

  /** Hiện skeleton khi đang loading lần đầu (chưa có cache). */
  showSkeleton = computed(
    () => this.cartApi.loading() && !this.cartApi.cart()
  );

  ngOnInit(): void {
    this.cartApi.loadCart().subscribe({
      error: () => {
        // CartApiService đã toast lỗi rồi, không cần làm thêm
      }
    });
  }

  // ============= Event handlers =============

  onToggleShop(shopId: string | undefined, selected: boolean): void {
    if (!shopId) return;
    this.cartApi.toggleSelection({ shopId, selected }).subscribe({ error: () => {} });
  }

  onToggleItem(payload: { sku: string; selected: boolean }): void {
    this.cartApi
      .toggleSelection({ items: [payload] })
      .subscribe({ error: () => {} });
  }

  onQtyChange(payload: { sku: string; qty: number }): void {
    this.cartApi
      .updateQuantity(payload.sku, payload.qty)
      .subscribe({ error: () => {} });
  }

  onRemove(sku: string): void {
    if (!confirm('Bạn có chắc muốn xoá sản phẩm này khỏi giỏ?')) return;
    this.cartApi.removeItem(sku).subscribe({ error: () => {} });
  }

  onClearAll(): void {
    if (!confirm('Xoá toàn bộ giỏ hàng? Hành động này không thể hoàn tác.')) {
      return;
    }
    this.cartApi.clearCart().subscribe({ error: () => {} });
  }

  onCheckout(): void {
    this.router.navigate(['/order']);
  }
}

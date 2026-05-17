import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { HotToastService } from '@ngxpert/hot-toast';

import { ProfileSidebarComponent } from '../../components/profile-sidebar/profile-sidebar.component';
import { WishlistApiService } from '../../services/wishlist-api.service';
import { CartApiService } from '../../services/cart-api.service';
import { environment } from '../../../environments/environment';

/**
 * FavoritesComponent — Trang sản phẩm yêu thích.
 * Route: `/favorites` (lazy load + authGuard).
 */
@Component({
  selector: 'app-favorites',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CurrencyPipe, DatePipe, ProfileSidebarComponent],
  styleUrl: '../profile/profile.component.css',
  template: `
    <main class="profile-page">
      <app-profile-sidebar [activeRoute]="'/favorites'" />

      <div class="profile-content">
        <div class="content-card">
          <header class="content-header">
            <div class="header-text">
              <h1 class="content-title">Sản phẩm yêu thích</h1>
              <p class="content-subtitle">
                {{ countLabel() }}
              </p>
            </div>
            @if (!wishlistApi.isEmpty()) {
              <button
                type="button"
                (click)="onClearAll()"
                class="px-4 py-2 rounded-lg border border-[#c1cab5] text-[#41493a]
                       hover:border-[#ba1a1a] hover:text-[#ba1a1a]
                       transition-colors"
              >
                Xoá tất cả
              </button>
            }
          </header>

          @if (wishlistApi.loading() && !wishlistApi.items()) {
            <div class="text-center py-12 text-[#41493a]">Đang tải...</div>
          }

          @else if (wishlistApi.isEmpty()) {
            <section class="empty-state">
              <span class="material-symbols-outlined">favorite</span>
              <p>Bạn chưa có sản phẩm yêu thích nào</p>
              <button class="btn-add-empty" (click)="goShopping()">
                Khám phá ngay
              </button>
            </section>
          }

          @else {
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              @for (item of items(); track item.wishlistId) {
                <article
                  class="bg-white rounded-2xl overflow-hidden border border-[#e0e3e5]
                         hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-shadow flex flex-col"
                >
                  <button
                    type="button"
                    (click)="goToProduct(item.productId)"
                    class="aspect-square w-full bg-[#f1f4f6] overflow-hidden"
                  >
                    <img
                      [src]="item.productImage || placeholder"
                      [alt]="item.productName"
                      class="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </button>

                  <div class="p-4 flex-1 flex flex-col gap-2">
                    <h3
                      class="text-base font-semibold text-[#181c1e] line-clamp-2 cursor-pointer hover:text-[#6db33f]"
                      (click)="goToProduct(item.productId)"
                    >
                      {{ item.productName || 'Sản phẩm' }}
                    </h3>

                    <div class="flex items-center gap-2 flex-wrap">
                      @if (item.productPrice != null) {
                        <span class="text-base font-bold text-[#306c00]">
                          {{ item.productPrice | currency: 'VND' : 'symbol' : '1.0-0' }}
                        </span>
                      }
                      @if (item.productOriginalPrice && item.productOriginalPrice > (item.productPrice ?? 0)) {
                        <span class="text-xs text-[#717a68] line-through">
                          {{ item.productOriginalPrice | currency: 'VND' : 'symbol' : '1.0-0' }}
                        </span>
                      }
                    </div>

                    @if (item.isAvailable === false) {
                      <span class="inline-block text-xs px-2 py-0.5 rounded-full bg-[#ffdad6] text-[#93000a] font-semibold w-fit">
                        Hết hàng
                      </span>
                    }

                    @if (item.note) {
                      <p class="text-xs text-[#41493a] italic">{{ item.note }}</p>
                    }

                    <p class="text-xs text-[#717a68] mt-auto">
                      Thêm: {{ item.createdAt | date: 'dd/MM/yyyy' }}
                    </p>

                    <div class="flex gap-2 mt-2">
                      <button
                        type="button"
                        (click)="onAddToCart(item)"
                        [disabled]="item.isAvailable === false"
                        class="flex-1 px-3 py-2 rounded-lg bg-[#ff8928] hover:bg-[#ffb786]
                               text-white text-sm font-semibold transition-colors
                               disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Thêm vào giỏ
                      </button>
                      <button
                        type="button"
                        (click)="onRemove(item.productId)"
                        class="px-3 py-2 rounded-lg border border-[#c1cab5] text-[#41493a]
                               hover:border-[#ba1a1a] hover:text-[#ba1a1a] transition-colors"
                        aria-label="Xoá khỏi yêu thích"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </article>
              }
            </div>
          }
        </div>
      </div>
    </main>
  `
})
export class FavoritesComponent implements OnInit {
  protected wishlistApi = inject(WishlistApiService);
  private cartApi = inject(CartApiService);
  private toast = inject(HotToastService);
  private router = inject(Router);

  readonly placeholder = environment.placeholders?.product;

  items = computed(() => this.wishlistApi.items()?.content ?? []);
  countLabel = computed(() => {
    const n = this.wishlistApi.count();
    return n > 0 ? `${n} sản phẩm bạn đã yêu thích` : 'Bạn chưa có sản phẩm yêu thích nào';
  });

  ngOnInit(): void {
    this.wishlistApi.loadWishlist().subscribe({ error: () => {} });
  }

  onRemove(productId: string): void {
    if (!confirm('Xoá sản phẩm này khỏi danh sách yêu thích?')) return;
    this.wishlistApi.remove(productId).subscribe({ error: () => {} });
  }

  onClearAll(): void {
    if (!confirm('Xoá toàn bộ danh sách yêu thích? Không thể hoàn tác.')) return;
    this.wishlistApi.clearAll().subscribe({ error: () => {} });
  }

  onAddToCart(item: ReturnType<typeof this.items> extends Array<infer T> ? T : never): void {
    if (!item) return;
    this.cartApi.addItem({
      productId: item.productId,
      productName: item.productName ?? 'Sản phẩm',
      productImage: item.productImage,
      price: item.productPrice,
      originalPrice: item.productOriginalPrice,
      quantity: 1
    }).subscribe({
      next: () => this.toast.success('Đã thêm vào giỏ hàng'),
      error: () => {} // service đã toast
    });
  }

  goToProduct(productId: string): void {
    // Hiện chưa có route product detail riêng — fallback về home + future enhancement
    this.router.navigate(['/'], { queryParams: { productId } });
  }

  goShopping(): void {
    this.router.navigate(['/']);
  }
}

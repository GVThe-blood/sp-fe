import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { SaleApiService, SaleResponse } from '../../services/sale-api.service';

/**
 * SalePage — landing page cho mục "Sale" trong profile sidebar.
 *
 * Phụ trách:
 * - Hiển thị danh sách sale đang active (BE: GET /sales/active)
 * - Mỗi card có countdown end-time + ảnh banner + CTA "Xem sản phẩm"
 * - Empty state khi không có sale nào đang chạy
 *
 * Note: BE chưa expose route public cho từng sale detail page. Khi click
 * "Xem sản phẩm" tao tạm filter by category trong trang home; future-work
 * sẽ build /sale/:id riêng khi BE confirm pattern URL.
 */
@Component({
  selector: 'app-sale',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DatePipe, DecimalPipe, RouterLink],
  template: `
    <main class="min-h-screen bg-[#fff7ed] py-10 px-4 sm:px-6 lg:px-8">
      <div class="max-w-screen-xl mx-auto">
        <header class="mb-8">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full
                      bg-orange-100 text-orange-700 text-sm font-semibold mb-3">
            <span class="material-symbols-outlined text-base">local_fire_department</span>
            Khuyến mãi đang diễn ra
          </div>
          <h1 class="text-3xl md:text-4xl font-bold text-[#181c1e]">
            Sale {{ todayLabel() }}
          </h1>
          <p class="text-base text-[#41493a] mt-2">
            Săn deal nóng hổi mỗi ngày — số lượng có hạn, kết thúc khi hết hàng.
          </p>
        </header>

        @if (loading()) {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (_ of skeletonSlots; track $index) {
              <div class="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
                <div class="h-44 bg-orange-100"></div>
                <div class="p-4 space-y-3">
                  <div class="h-5 bg-orange-100 rounded w-3/4"></div>
                  <div class="h-3 bg-orange-100 rounded w-1/2"></div>
                </div>
              </div>
            }
          </div>
        } @else if (error()) {
          <div class="bg-white rounded-2xl p-12 text-center text-[#41493a] shadow-sm">
            <span class="material-symbols-outlined text-4xl text-orange-400 mb-3">error</span>
            <p class="font-semibold">{{ error() }}</p>
            <button class="mt-4 px-4 py-2 rounded-lg bg-orange-500 text-white font-semibold
                           hover:bg-orange-600 transition"
                    (click)="reload()">Thử lại</button>
          </div>
        } @else if (sales().length === 0) {
          <div class="bg-white rounded-2xl p-12 text-center text-[#41493a] shadow-sm">
            <span class="material-symbols-outlined text-4xl text-orange-300 mb-3">
              inventory_2
            </span>
            <p class="text-lg font-semibold mb-1">Chưa có sale nào đang diễn ra</p>
            <p class="text-sm text-[#7a8478]">
              Quay lại sau, các chương trình mới sẽ được cập nhật mỗi ngày.
            </p>
            <a routerLink="/"
               class="mt-5 inline-flex px-5 py-2.5 rounded-lg bg-[#6db33f] text-white
                      font-semibold hover:bg-[#90d960] transition">
              Về trang chủ
            </a>
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (sale of sales(); track sale.id) {
              <article class="group bg-white rounded-2xl overflow-hidden shadow-sm
                              hover:shadow-lg transition-all duration-300">
                <!-- Banner -->
                <div class="relative h-44 overflow-hidden bg-gradient-to-br from-orange-200 to-pink-200">
                  @if (sale.bannerImage) {
                    <img [src]="sale.bannerImage" [alt]="sale.name"
                         class="w-full h-full object-cover
                                group-hover:scale-105 transition-transform duration-500"
                         (error)="onBannerError($event)">
                  } @else {
                    <div class="absolute inset-0 flex items-center justify-center">
                      <span class="text-5xl">🎉</span>
                    </div>
                  }
                  @if (sale.discountPercent) {
                    <div class="absolute top-3 left-3 px-2.5 py-1 rounded-full
                                bg-red-500 text-white text-xs font-bold shadow">
                      -{{ sale.discountPercent }}%
                    </div>
                  }
                  <div class="absolute bottom-3 right-3 px-2.5 py-1 rounded-full
                              bg-black/60 text-white text-xs font-medium">
                    Kết thúc {{ sale.endTime | date: 'dd/MM HH:mm' }}
                  </div>
                </div>

                <div class="p-4">
                  <h2 class="font-bold text-[#181c1e] line-clamp-1">{{ sale.name }}</h2>
                  @if (sale.description) {
                    <p class="text-sm text-[#41493a] mt-1 line-clamp-2">{{ sale.description }}</p>
                  }
                  <div class="mt-3 flex items-center justify-between text-xs text-[#7a8478]">
                    <span>{{ (sale.productCount ?? 0) | number }} sản phẩm</span>
                    <span class="text-orange-600 font-semibold">
                      Còn {{ remainingHours(sale.endTime) }}h
                    </span>
                  </div>
                  <button (click)="goToSale(sale)"
                          class="mt-4 w-full py-2.5 rounded-lg bg-orange-500
                                 hover:bg-orange-600 text-white font-semibold
                                 transition-colors">
                    Xem sản phẩm
                  </button>
                </div>
              </article>
            }
          </div>
        }
      </div>
    </main>
  `,
  styles: [
    `:host { display: block; }`,
    `.line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }`,
    `.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }`,
  ],
})
export class SaleComponent implements OnInit {
  private saleApi = inject(SaleApiService);
  private router = inject(Router);

  /** Sale events đang active. */
  sales = signal<SaleResponse[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  /** 6 skeleton placeholder lúc loading. */
  protected readonly skeletonSlots = Array.from({ length: 6 });

  todayLabel = computed(() => {
    const today = new Date();
    return `${pad(today.getDate())}/${pad(today.getMonth() + 1)}`;
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.saleApi.getActiveSales().subscribe({
      next: (data) => {
        this.sales.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('[SalePage] load active sales failed', err);
        this.error.set('Không tải được danh sách khuyến mãi. Vui lòng thử lại.');
        this.loading.set(false);
      },
    });
  }

  protected reload(): void {
    this.load();
  }

  /** Approximate hours remaining until sale endTime. */
  protected remainingHours(endIso: string): number {
    const ms = new Date(endIso).getTime() - Date.now();
    if (Number.isNaN(ms)) return 0;
    return Math.max(0, Math.floor(ms / 3_600_000));
  }

  /**
   * Click handler — until BE exposes a /sale/:id detail page, we deep-link
   * to the home product list filtered by the sale id via query param.
   * Home component can listen for `?sale=<id>` and apply the filter.
   */
  protected goToSale(sale: SaleResponse): void {
    this.router.navigate(['/'], { queryParams: { sale: sale.id } });
  }

  protected onBannerError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img && !img.dataset['fallback']) {
      img.dataset['fallback'] = '1';
      img.style.display = 'none';
    }
  }
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

/**
 * CartEmptyComponent — Hiển thị state khi giỏ hàng rỗng.
 * Static, không nhận input/output, click button "Tiếp tục mua sắm" → navigate về home.
 */
@Component({
  selector: 'app-cart-empty',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.06)]
             flex flex-col items-center justify-center text-center py-16 px-8"
    >
      <div
        class="w-24 h-24 rounded-full bg-[#ebeef0] flex items-center justify-center mb-6"
        aria-hidden="true"
      >
        <svg
          class="w-12 h-12 text-[#717a68]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          stroke-width="1.5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
          />
        </svg>
      </div>

      <h2 class="text-2xl font-bold text-[#181c1e] mb-2">Giỏ hàng trống</h2>
      <p class="text-base text-[#41493a] max-w-md mb-8">
        Bạn chưa có sản phẩm nào trong giỏ. Khám phá các món ngon và thêm vào giỏ
        ngay nhé.
      </p>

      <button
        type="button"
        (click)="goShopping()"
        class="px-8 py-3 rounded-xl bg-[#6db33f] hover:bg-[#90d960]
               text-white font-semibold transition-all duration-300
               shadow-sm hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
      >
        Tiếp tục mua sắm
      </button>
    </section>
  `
})
export class CartEmptyComponent {
  private router = inject(Router);

  goShopping(): void {
    this.router.navigate(['/']);
  }
}

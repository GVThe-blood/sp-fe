import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HotToastService } from '@ngxpert/hot-toast';

import { PaymentApiService } from '../../services/payment-api.service';

/**
 * OrderResultComponent — dùng cho 2 route:
 *   1. /order-success     → sau khi đặt COD thành công
 *   2. /payment/vnpay-return → VNPay redirect về sau thanh toán
 *
 * Hiển thị status (success / failed / pending) dựa trên query params.
 * VNPay trả về `vnp_ResponseCode` (00 = success) và `vnp_TxnRef`.
 */
@Component({
  selector: 'app-order-result',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  template: `
    <main
      class="min-h-screen flex items-center justify-center bg-[#f7fafc] py-12 px-4"
    >
      <div
        class="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] max-w-md w-full p-8 text-center"
      >
        @if (status() === 'success') {
          <div
            class="w-16 h-16 rounded-full bg-green-100 mx-auto mb-4 flex items-center justify-center"
          >
            <span class="material-symbols-outlined text-green-600 text-4xl">
              check_circle
            </span>
          </div>
          <h1 class="text-2xl font-bold text-[#181c1e] mb-2">
            Đặt hàng thành công!
          </h1>
          <p class="text-[#41493a] mb-6">{{ message() }}</p>
        } @else if (status() === 'failed') {
          <div
            class="w-16 h-16 rounded-full bg-red-100 mx-auto mb-4 flex items-center justify-center"
          >
            <span class="material-symbols-outlined text-red-600 text-4xl">
              error
            </span>
          </div>
          <h1 class="text-2xl font-bold text-[#181c1e] mb-2">
            Thanh toán không thành công
          </h1>
          <p class="text-[#41493a] mb-6">{{ message() }}</p>
        } @else {
          <div
            class="w-16 h-16 rounded-full bg-yellow-100 mx-auto mb-4 flex items-center justify-center"
          >
            <span class="material-symbols-outlined text-yellow-600 text-4xl">
              hourglass_empty
            </span>
          </div>
          <h1 class="text-2xl font-bold text-[#181c1e] mb-2">
            Đang xử lý đơn hàng…
          </h1>
          <p class="text-[#41493a] mb-6">{{ message() }}</p>
        }

        @if (referenceId()) {
          <p class="text-xs text-[#888] mb-4">
            Mã giao dịch: <span class="font-mono">{{ referenceId() }}</span>
          </p>
        }

        @if (status() === 'success' && autoRedirectIn() > 0) {
          <p class="text-xs text-[#888] mb-3">
            Đang chuyển về lịch sử đơn hàng trong
            <span class="font-semibold">{{ autoRedirectIn() }}s</span>…
          </p>
        }

        <div class="flex flex-col gap-2">
          <a
            routerLink="/order-history"
            class="block w-full py-3 rounded-xl bg-primary text-white font-semibold hover:opacity-90 transition"
          >
            Xem đơn hàng của tôi
          </a>
          <a
            routerLink="/"
            class="block w-full py-3 rounded-xl border border-[#e1e6e1] text-[#181c1e] font-semibold hover:bg-[#f7fafc] transition"
          >
            Tiếp tục mua sắm
          </a>
        </div>
      </div>
    </main>
  `
})
export class OrderResultComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private paymentApi = inject(PaymentApiService);
  private toast = inject(HotToastService);
  private destroyRef = inject(DestroyRef);

  status = signal<'success' | 'failed' | 'pending'>('pending');
  message = signal<string>('');
  referenceId = signal<string | null>(null);

  /** Đếm ngược giây trước khi auto redirect về /order-history. */
  autoRedirectIn = signal<number>(0);
  private redirectTimer: ReturnType<typeof setInterval> | null = null;

  isVnpayReturn = computed(() =>
    this.router.url.startsWith('/payment/vnpay-return')
  );

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParamMap;

    // Case 1: COD success — query param từ orderComponent
    const codRefId = qp.get('referenceId');
    const codMethod = qp.get('method');
    if (codRefId && !this.isVnpayReturn()) {
      this.referenceId.set(codRefId);
      this.status.set('success');
      this.message.set(
        codMethod === 'COD'
          ? 'Đơn hàng đã được tạo. Bạn sẽ thanh toán khi nhận hàng.'
          : 'Đơn hàng đã được tạo thành công.'
      );
      this.scheduleAutoRedirect();
      return;
    }

    // Case 2: VNPay return
    const vnpResponseCode = qp.get('vnp_ResponseCode');
    const vnpTxnRef = qp.get('vnp_TxnRef');
    const vnpAmount = qp.get('vnp_Amount');

    if (vnpTxnRef) this.referenceId.set(vnpTxnRef);

    if (!vnpResponseCode) {
      this.status.set('pending');
      this.message.set('Không có thông tin trạng thái thanh toán.');
      return;
    }

    if (vnpResponseCode === '00') {
      this.status.set('success');
      const amountVnd = vnpAmount
        ? (Number(vnpAmount) / 100).toLocaleString('vi-VN') + 'đ'
        : '';
      this.message.set(
        amountVnd
          ? `Bạn đã thanh toán thành công ${amountVnd}.`
          : 'Thanh toán VNPay thành công.'
      );

      // Optional: query thêm BE để xác nhận status (best effort)
      if (vnpTxnRef) {
        this.paymentApi.getPaymentStatus(vnpTxnRef).subscribe({
          next: () => {},
          error: () => {}
        });
      }
      this.scheduleAutoRedirect(vnpTxnRef ?? undefined);
      return;
    }

    this.status.set('failed');
    this.message.set(
      this.mapVnpayErrorCode(vnpResponseCode) ??
        'Giao dịch VNPay không thành công.'
    );
  }

  /**
   * Hiển thị toast success + đếm ngược 5s rồi tự navigate về /order-history.
   * User vẫn có thể bấm nút trong page để chuyển ngay lập tức.
   */
  private scheduleAutoRedirect(orderHistoryHighlightId?: string): void {
    this.toast.success(this.message() || 'Thanh toán thành công!', {
      duration: 5000,
      position: 'top-right'
    });

    let remaining = 5;
    this.autoRedirectIn.set(remaining);
    this.redirectTimer = setInterval(() => {
      remaining -= 1;
      this.autoRedirectIn.set(remaining);
      if (remaining <= 0) {
        this.clearTimer();
        const queryParams = orderHistoryHighlightId
          ? { orderId: orderHistoryHighlightId }
          : undefined;
        this.router.navigate(['/order-history'], { queryParams });
      }
    }, 1000);

    // Cleanup khi component destroy (user navigate manual)
    this.destroyRef.onDestroy(() => this.clearTimer());
  }

  private clearTimer(): void {
    if (this.redirectTimer) {
      clearInterval(this.redirectTimer);
      this.redirectTimer = null;
    }
  }

  /**
   * Mapping mã lỗi VNPay phổ biến → message tiếng Việt.
   * Nguồn: tài liệu VNPay sandbox.
   */
  private mapVnpayErrorCode(code: string): string | null {
    const map: Record<string, string> = {
      '00': 'Giao dịch thành công',
      '07': 'Giao dịch bị nghi ngờ gian lận',
      '09': 'Thẻ/Tài khoản chưa đăng ký Internet Banking',
      '10': 'Xác thực thông tin sai quá 3 lần',
      '11': 'Đã hết hạn chờ thanh toán',
      '12': 'Thẻ bị khoá',
      '13': 'Sai mật khẩu OTP',
      '24': 'Khách hàng huỷ giao dịch',
      '51': 'Tài khoản không đủ số dư',
      '65': 'Vượt hạn mức giao dịch trong ngày',
      '75': 'Ngân hàng đang bảo trì',
      '79': 'Sai mật khẩu thanh toán quá nhiều lần',
      '99': 'Lỗi không xác định'
    };
    return map[code] ?? null;
  }
}

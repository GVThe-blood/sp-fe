import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { HotToastService } from '@ngxpert/hot-toast';

import { environment } from '../../environments/environment';
import { VNPayPaymentRequest } from '../models/order.model';

interface ApiEnvelope<T> {
  appStatus?: number;
  status?: number;
  message: string;
  data: T;
}

/**
 * PaymentApiService — gọi payment-service qua API Gateway.
 *
 * Endpoint reference:
 *   - POST /api/v1/payment/create-payment    → tạo URL VNPay
 *   - GET  /api/v1/payment/vnpay/status/{id} → query trạng thái
 */
@Injectable({ providedIn: 'root' })
export class PaymentApiService {
  private http = inject(HttpClient);
  private toast = inject(HotToastService);

  private readonly BASE = `${environment.apiUrl}/payment`;

  /**
   * Tạo URL VNPay để FE redirect user tới.
   * Trả về object { paymentUrl: string }.
   *
   * Lưu ý: order-service đã trả `paymentUrl` ngay trong /order/checkout response
   * (do BE chủ động build URL khi paymentMethod=VNPAY). Endpoint này chỉ dùng
   * khi muốn re-create URL độc lập (chuyển từ COD sang VNPAY chẳng hạn).
   */
  createPaymentUrl(
    payload: VNPayPaymentRequest
  ): Observable<{ paymentUrl: string }> {
    return this.http
      .post<{ paymentUrl: string }>(
        `${this.BASE}/create-payment`,
        payload,
        { withCredentials: true }
      )
      .pipe(
        catchError(err => this.handleError(err, 'Không tạo được URL thanh toán'))
      );
  }

  /** Query trạng thái thanh toán theo PaymentTransaction id. */
  getPaymentStatus(paymentTransactionId: string): Observable<string> {
    return this.http
      .get<ApiEnvelope<string>>(
        `${this.BASE}/vnpay/status/${encodeURIComponent(paymentTransactionId)}`,
        { withCredentials: true }
      )
      .pipe(
        map(res => res.data),
        catchError(err => this.handleError(err, 'Không tra được trạng thái thanh toán'))
      );
  }

  /**
   * Tạo URL VNPay cho 1 PaymentTransaction đã tồn tại (sau khi /order/checkout
   * trả referenceId). Dùng thay cho /payment/create-payment khi FE không cần
   * tự build VNPayPaymentRequest đầy đủ.
   */
  createPaymentUrlByReference(
    paymentTransactionId: string
  ): Observable<{ paymentUrl: string; paymentTransactionId: string; amount: number }> {
    return this.http
      .post<ApiEnvelope<{ paymentUrl: string; paymentTransactionId: string; amount: number }>>(
        `${this.BASE}/vnpay/from-reference/${encodeURIComponent(paymentTransactionId)}`,
        null,
        { withCredentials: true }
      )
      .pipe(
        map(res => res.data),
        catchError(err => this.handleError(err, 'Không lấy được URL thanh toán VNPay'))
      );
  }

  /**
   * Yêu cầu hoàn tiền VNPay cho 1 đơn hàng. BE sẽ tìm PaymentTransaction PAID
   * đầu tiên có reference_id = orderId, tạo PaymentTransaction REFUND mới,
   * gọi VNPay sandbox `refund`, và update status. Trả về message tiếng Việt.
   *
   * Endpoint: POST /api/v1/payment/vnpay/refund/{referenceId}
   * (referenceId trong URL chính là orderId — xem
   *  payment-service/.../service/impl/VNPayServiceImpl#handlePaymentRefund)
   */
  refundOrder(orderId: string): Observable<string> {
    return this.http
      .post<ApiEnvelope<string>>(
        `${this.BASE}/vnpay/refund/${encodeURIComponent(orderId)}`,
        null,
        { withCredentials: true }
      )
      .pipe(
        map(res => res.data),
        catchError(err => this.handleError(err, 'Không thực hiện được hoàn tiền'))
      );
  }

  // ============= helpers =============

  private handleError(err: unknown, fallback: string): Observable<never> {
    const msg = this.extractErrorMessage(err) ?? fallback;
    this.toast.error(msg);
    console.error('[PaymentApiService]', err);
    return throwError(() => err);
  }

  private extractErrorMessage(err: unknown): string | null {
    if (typeof err === 'object' && err !== null) {
      const e = err as { error?: { message?: string }; message?: string };
      return e.error?.message ?? e.message ?? null;
    }
    return null;
  }
}

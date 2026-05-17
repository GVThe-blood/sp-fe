import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, tap, throwError } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  OrderCheckoutRequest,
  OrderDetailResponse,
  OrderPaymentResponse,
  SpringPage
} from '../models/order.model';

interface ApiEnvelope<T> {
  appStatus?: number;
  status?: number;
  message: string;
  data: T;
}

/**
 * OrderApiService — Lịch sử đơn hàng của user (gọi order-service qua Gateway).
 *
 * Endpoints:
 *  - GET /api/v1/order/history?page=&size=
 *  - GET /api/v1/order/history/{id}
 */
@Injectable({ providedIn: 'root' })
export class OrderApiService {
  private http = inject(HttpClient);
  private readonly BASE = `${environment.apiUrl}/order`;

  // ============= State =============
  private _history = signal<SpringPage<OrderDetailResponse> | null>(null);
  history = this._history.asReadonly();

  loading = signal(false);
  error = signal<string | null>(null);

  // ============= Methods =============

  /** Load 1 page lịch sử đơn hàng. Mặc định page 0, 10 items. */
  loadHistory(page: number = 0, size: number = 10): Observable<SpringPage<OrderDetailResponse>> {
    this.loading.set(true);
    this.error.set(null);
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http
      .get<ApiEnvelope<SpringPage<OrderDetailResponse>>>(`${this.BASE}/history`, {
        params,
        withCredentials: true
      })
      .pipe(
        map(res => res.data),
        tap(p => this._history.set(p)),
        catchError(err => this.silentFail<SpringPage<OrderDetailResponse>>(err, 'Không tải được lịch sử đơn hàng')),
        tap({ finalize: () => this.loading.set(false) })
      );
  }

  /** Load chi tiết 1 đơn. */
  getOrderDetail(orderId: string): Observable<OrderDetailResponse> {
    return this.http
      .get<ApiEnvelope<OrderDetailResponse>>(
        `${this.BASE}/history/${encodeURIComponent(orderId)}`,
        { withCredentials: true }
      )
      .pipe(
        map(res => res.data),
        catchError(err => this.silentFail<OrderDetailResponse>(err, 'Không tải được chi tiết đơn hàng'))
      );
  }

  /**
   * Checkout giỏ hàng → tạo order(s).
   * Endpoint: POST /api/v1/order/checkout
   */
  checkout(payload: OrderCheckoutRequest): Observable<OrderPaymentResponse> {
    return this.http
      .post<ApiEnvelope<OrderPaymentResponse>>(`${this.BASE}/checkout`, payload, {
        withCredentials: true
      })
      .pipe(
        map(res => res.data),
        catchError(err => {
          const msg = this.extractErrorMessage(err) ?? 'Đặt hàng thất bại';
          this.error.set(msg);
          console.error('[OrderApiService.checkout]', msg, err);
          return throwError(() => err);
        })
      );
  }

  resetCache(): void {
    this._history.set(null);
    this.loading.set(false);
    this.error.set(null);
  }

  // ============= Internal =============
  private silentFail<T>(err: unknown, fallback: string): Observable<T> {
    const msg = this.extractErrorMessage(err) ?? fallback;
    this.error.set(msg);
    console.warn('[OrderApiService]', msg, err);
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

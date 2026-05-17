import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, finalize, map, share, tap, throwError } from 'rxjs';
import { HotToastService } from '@ngxpert/hot-toast';

import { environment } from '../../environments/environment';
import {
  AddToCartRequest,
  CartApiResponse,
  CartResponse,
  SelectionUpdateRequest
} from '../models/cart.model';

/**
 * CartApiService — Server-side cart cho user đã đăng nhập.
 *
 * Source of truth: cart-service Redis qua REST API.
 * Đường đi: FE → API Gateway (port 8080) → cart-service.
 *
 * Khác với `cart.service.ts` cũ (localStorage-only, dùng cho preview ở
 * ProductDetailModal/FloatingCartButton). Hai service tồn tại song song.
 */
@Injectable({ providedIn: 'root' })
export class CartApiService {
  private http = inject(HttpClient);
  private toast = inject(HotToastService);

  private readonly BASE = `${environment.apiUrl}/cart`;

  // ============= State (signals) =============
  private _cart = signal<CartResponse | null>(null);
  cart = this._cart.asReadonly();

  loading = signal(false);
  error = signal<string | null>(null);

  // In-flight dedup so concurrent loadCart() callers (header effect, cart
  // page, checkout init) all share a single network call.
  private loadCartInFlight$: Observable<CartResponse> | null = null;

  // ============= Computed helpers =============
  itemCount = computed(() => this._cart()?.totalItems ?? 0);
  selectedCount = computed(() => this._cart()?.selectedItems ?? 0);
  selectedTotal = computed(() => this._cart()?.selectedTotal ?? 0);
  totalPrice = computed(() => this._cart()?.totalPrice ?? 0);
  isEmpty = computed(() => (this._cart()?.totalItems ?? 0) === 0);
  canCheckout = computed(() => !!this._cart()?.canCheckout);

  // ============= Methods =============

  loadCart(): Observable<CartResponse> {
    // Share single in-flight call across concurrent subscribers (header +
    // cart page + checkout effect can all fire near-simultaneously at boot).
    if (this.loadCartInFlight$) {
      return this.loadCartInFlight$;
    }

    this.loading.set(true);
    this.error.set(null);

    this.loadCartInFlight$ = this.http
      .get<CartApiResponse<CartResponse>>(this.BASE, { withCredentials: true })
      .pipe(
        map(res => res.data),
        tap(cart => this._cart.set(cart)),
        // GET /cart fail (401/500) lúc init/logout không nên spam toast — chỉ log + set error signal
        catchError(err => this.handleSilentError(err, 'Không tải được giỏ hàng')),
        finalize(() => {
          this.loading.set(false);
          this.loadCartInFlight$ = null;
        }),
        share()
      );

    return this.loadCartInFlight$;
  }

  addItem(req: AddToCartRequest): Observable<CartResponse> {
    return this.http
      .post<CartApiResponse<CartResponse>>(`${this.BASE}/items`, req, {
        withCredentials: true
      })
      .pipe(
        map(res => res.data),
        tap(cart => this._cart.set(cart)),
        catchError(err => this.handleError(err, 'Không thêm được vào giỏ'))
      );
  }

  updateQuantity(sku: string, quantity: number): Observable<CartResponse> {
    const params = new HttpParams().set('quantity', quantity.toString());
    return this.http
      .put<CartApiResponse<CartResponse>>(
        `${this.BASE}/items/${encodeURIComponent(sku)}/quantity`,
        null,
        { params, withCredentials: true }
      )
      .pipe(
        map(res => res.data),
        tap(cart => this._cart.set(cart)),
        catchError(err => this.handleError(err, 'Không cập nhật được số lượng'))
      );
  }

  removeItem(sku: string): Observable<CartResponse> {
    return this.http
      .delete<CartApiResponse<CartResponse>>(
        `${this.BASE}/items/${encodeURIComponent(sku)}`,
        { withCredentials: true }
      )
      .pipe(
        map(res => res.data),
        tap(cart => this._cart.set(cart)),
        catchError(err => this.handleError(err, 'Không xoá được sản phẩm'))
      );
  }

  clearCart(): Observable<void> {
    return this.http
      .delete<CartApiResponse<void>>(this.BASE, { withCredentials: true })
      .pipe(
        map(() => void 0),
        tap(() => {
          // Reset cache về cart rỗng để UI cập nhật ngay
          const current = this._cart();
          this._cart.set({
            userId: current?.userId ?? '',
            totalPrice: 0,
            selectedTotal: 0,
            totalItems: 0,
            selectedItems: 0,
            shopGroups: [],
            warnings: [],
            canCheckout: false,
            hasUnavailableItems: false
          });
        }),
        catchError(err => this.handleError(err, 'Không xoá được giỏ hàng'))
      );
  }

  toggleSelection(req: SelectionUpdateRequest): Observable<CartResponse> {
    return this.http
      .patch<CartApiResponse<CartResponse>>(
        `${this.BASE}/items/select`,
        req,
        { withCredentials: true }
      )
      .pipe(
        map(res => res.data),
        tap(cart => this._cart.set(cart)),
        catchError(err => this.handleError(err, 'Không cập nhật được lựa chọn'))
      );
  }

  /**
   * Reset cart cache về null + clear loading/error.
   * Gọi khi user logout để badge ở header tự ẩn và tránh lộ data cart cũ
   * cho user mới (nếu cùng browser).
   */
  resetCache(): void {
    this._cart.set(null);
    this.loading.set(false);
    this.error.set(null);
  }

  // ============= Helpers =============
  private handleError(err: unknown, fallback: string): Observable<never> {
    const message = this.extractErrorMessage(err) ?? fallback;
    this.error.set(message);
    this.toast.error(message);
    console.error('[CartApiService]', err);
    return throwError(() => err);
  }

  /**
   * Tương tự `handleError` nhưng không spam toast. Dùng cho `loadCart()` —
   * nếu lúc init/logout cart-service trả 401/500, ta chỉ log và set signal
   * `error`, không hiển thị toast vì thường user chưa thao tác gì.
   */
  private handleSilentError(err: unknown, fallback: string): Observable<never> {
    const message = this.extractErrorMessage(err) ?? fallback;
    this.error.set(message);
    console.warn('[CartApiService]', message, err);
    return throwError(() => err);
  }

  private extractErrorMessage(err: unknown): string | null {
    if (typeof err === 'object' && err !== null) {
      const anyErr = err as { error?: { message?: string }; message?: string };
      return anyErr.error?.message ?? anyErr.message ?? null;
    }
    return null;
  }
}

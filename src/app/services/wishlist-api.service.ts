import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { HotToastService } from '@ngxpert/hot-toast';

import { environment } from '../../environments/environment';
import { SpringPage } from '../models/order.model';
import {
  WishlistAddRequest,
  WishlistItemResponse
} from '../models/wishlist.model';

interface ApiEnvelope<T> {
  appStatus?: number;
  status?: number;
  message: string;
  data: T;
}

/**
 * WishlistApiService — Sản phẩm yêu thích (gọi product-service qua Gateway).
 *
 * Endpoints:
 *  - GET    /api/v1/wishlist?page=&size=
 *  - GET    /api/v1/wishlist/count
 *  - GET    /api/v1/wishlist/check/{productId}
 *  - POST   /api/v1/wishlist
 *  - DELETE /api/v1/wishlist/{productId}
 *  - DELETE /api/v1/wishlist
 */
@Injectable({ providedIn: 'root' })
export class WishlistApiService {
  private http = inject(HttpClient);
  private toast = inject(HotToastService);
  private readonly BASE = `${environment.apiUrl}/wishlist`;

  // ============= State =============
  private _items = signal<SpringPage<WishlistItemResponse> | null>(null);
  items = this._items.asReadonly();

  /** Set chứa productId của các item đã wishlist — dùng cho icon trái tim. */
  private _favoriteSet = signal<Set<string>>(new Set());
  favoriteSet = this._favoriteSet.asReadonly();

  loading = signal(false);
  error = signal<string | null>(null);

  count = computed(() => this._items()?.totalElements ?? this._favoriteSet().size);
  isEmpty = computed(() => (this._items()?.totalElements ?? 0) === 0);

  // ============= Methods =============

  loadWishlist(page: number = 0, size: number = 20): Observable<SpringPage<WishlistItemResponse>> {
    this.loading.set(true);
    this.error.set(null);
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http
      .get<ApiEnvelope<SpringPage<WishlistItemResponse>>>(this.BASE, {
        params,
        withCredentials: true
      })
      .pipe(
        map(res => res.data),
        tap(p => {
          this._items.set(p);
          // Cập nhật favoriteSet để icon trái tim sync
          const ids = new Set(p.content.map(i => i.productId));
          this._favoriteSet.set(ids);
        }),
        catchError(err => this.silentFail<SpringPage<WishlistItemResponse>>(err, 'Không tải được danh sách yêu thích')),
        tap({ finalize: () => this.loading.set(false) })
      );
  }

  /** Check 1 product có trong wishlist không (real-time, không qua cache). */
  checkProduct(productId: string): Observable<boolean> {
    return this.http
      .get<ApiEnvelope<boolean>>(`${this.BASE}/check/${encodeURIComponent(productId)}`, {
        withCredentials: true
      })
      .pipe(
        map(res => res.data),
        catchError(() => throwError(() => new Error('check failed')))
      );
  }

  add(payload: WishlistAddRequest): Observable<WishlistItemResponse> {
    return this.http
      .post<ApiEnvelope<WishlistItemResponse>>(this.BASE, payload, {
        withCredentials: true
      })
      .pipe(
        map(res => res.data),
        tap(item => {
          this._favoriteSet.update(s => new Set(s).add(item.productId));
          this.toast.success('Đã thêm vào yêu thích');
        }),
        catchError(err => this.failWithThrow<WishlistItemResponse>(err, 'Thêm vào yêu thích thất bại'))
      );
  }

  remove(productId: string): Observable<void> {
    return this.http
      .delete<ApiEnvelope<void>>(`${this.BASE}/${encodeURIComponent(productId)}`, {
        withCredentials: true
      })
      .pipe(
        map(() => void 0 as void),
        tap(() => {
          this._favoriteSet.update(s => {
            const next = new Set(s);
            next.delete(productId);
            return next;
          });
          // Remove khỏi cache page hiện tại
          this._items.update(p => {
            if (!p) return p;
            return {
              ...p,
              content: p.content.filter(i => i.productId !== productId),
              totalElements: Math.max(0, p.totalElements - 1)
            };
          });
          this.toast.success('Đã xoá khỏi yêu thích');
        }),
        catchError(err => this.failWithThrow<void>(err, 'Xoá yêu thích thất bại'))
      );
  }

  clearAll(): Observable<void> {
    return this.http
      .delete<ApiEnvelope<void>>(this.BASE, { withCredentials: true })
      .pipe(
        map(() => void 0 as void),
        tap(() => {
          this._favoriteSet.set(new Set());
          this._items.set(null);
          this.toast.success('Đã xoá toàn bộ danh sách yêu thích');
        }),
        catchError(err => this.failWithThrow<void>(err, 'Xoá danh sách yêu thích thất bại'))
      );
  }

  /** Toggle wishlist (icon trái tim). Optimistic update. */
  toggle(productId: string): Observable<boolean> {
    const isCurrent = this._favoriteSet().has(productId);
    if (isCurrent) {
      return this.remove(productId).pipe(map(() => false));
    }
    return this.add({ productId }).pipe(map(() => true));
  }

  isFavorite(productId: string): boolean {
    return this._favoriteSet().has(productId);
  }

  resetCache(): void {
    this._items.set(null);
    this._favoriteSet.set(new Set());
    this.loading.set(false);
    this.error.set(null);
  }

  // ============= Internal =============
  private silentFail<T>(err: unknown, fallback: string): Observable<T> {
    const msg = this.extractErrorMessage(err) ?? fallback;
    this.error.set(msg);
    console.warn('[WishlistApiService]', msg, err);
    return throwError(() => err);
  }

  private failWithThrow<T>(err: unknown, fallback: string): Observable<T> {
    const msg = this.extractErrorMessage(err) ?? fallback;
    this.error.set(msg);
    this.toast.error(msg);
    console.error('[WishlistApiService]', msg, err);
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

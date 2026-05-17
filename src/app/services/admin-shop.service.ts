import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export type ShopStatusValue =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'BANNED'
  | 'CLOSED'
  | 'PENDING_APPROVAL';

export interface AdminShopRow {
  shopId: string;
  shopName: string | null;
  logoUrl: string | null;
  shopStatus: ShopStatusValue | string;
  email: string | null;
  phoneNumber: string | null;
  city: string | null;
  province: string | null;
  shopType: string | null;
  businessType: string | null;
  ownerId: string | null;
  avgStar: number | null;
  totalFeedback: number | null;
  shopLevel: number | null;
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  bannedReason: string | null;
  bannedAt: string | null;
  bannedBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AdminShopStats {
  totalShops: number;
  activeShops: number;
  inactiveShops: number;
  bannedShops: number;
  closedShops: number;
  pendingShops: number;
  totalGmv: number;
  newShopsLast30: number;
}

export interface AdminShopUpdatePayload {
  shopName?: string;
  logo?: string;
  introduction?: string;
  shopType?: string;
  businessType?: string;
  email?: string;
  phoneNumber?: string;
  taxId?: string;
  shopAddress?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  activeHours?: string;
}

export interface AdminShopListPage {
  items: AdminShopRow[];
  totalItems: number;
  totalPages: number;
  page: number;
  pageSize: number;
}

interface ApiResponse<T> {
  appStatus?: number;
  code?: number;
  message: string;
  data: T;
}

interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

/**
 * HTTP client cho `/api/v1/shop/admin/**`.
 *
 * <p>BE tự enforce ADMIN role qua {@code @PreAuthorize}. FE chỉ cần
 * {@code withCredentials} để cookie HttpOnly đi kèm.</p>
 */
@Injectable({ providedIn: 'root' })
export class AdminShopService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/shop/admin`;

  getStats(): Observable<AdminShopStats> {
    return this.http
      .get<ApiResponse<AdminShopStats>>(`${this.base}/stats`, { withCredentials: true })
      .pipe(map((r) => r.data));
  }

  list(params: {
    status?: 'all' | ShopStatusValue;
    search?: string;
    page?: number;
    size?: number;
  } = {}): Observable<AdminShopListPage> {
    let p = new HttpParams();
    if (params.status && params.status !== 'all') p = p.set('status', params.status);
    if (params.search?.trim()) p = p.set('search', params.search.trim());
    p = p.set('page', String(params.page ?? 0));
    p = p.set('size', String(params.size ?? 20));

    return this.http
      .get<ApiResponse<SpringPage<AdminShopRow>>>(this.base, { params: p, withCredentials: true })
      .pipe(
        map((r) => ({
          items: r.data?.content ?? [],
          totalItems: r.data?.totalElements ?? 0,
          totalPages: r.data?.totalPages ?? 0,
          page: r.data?.number ?? 0,
          pageSize: r.data?.size ?? 20,
        })),
      );
  }

  get(shopId: string): Observable<AdminShopRow> {
    return this.http
      .get<ApiResponse<AdminShopRow>>(`${this.base}/${shopId}`, { withCredentials: true })
      .pipe(map((r) => r.data));
  }

  update(shopId: string, payload: AdminShopUpdatePayload): Observable<AdminShopRow> {
    return this.http
      .put<ApiResponse<AdminShopRow>>(`${this.base}/${shopId}`, payload, { withCredentials: true })
      .pipe(map((r) => r.data));
  }

  changeStatus(shopId: string, value: ShopStatusValue): Observable<AdminShopRow> {
    return this.http
      .patch<ApiResponse<AdminShopRow>>(
        `${this.base}/${shopId}/status?value=${value}`,
        {},
        { withCredentials: true },
      )
      .pipe(map((r) => r.data));
  }

  ban(shopId: string, reason: string): Observable<AdminShopRow> {
    return this.http
      .post<ApiResponse<AdminShopRow>>(
        `${this.base}/${shopId}/ban`,
        { reason },
        { withCredentials: true },
      )
      .pipe(map((r) => r.data));
  }

  unban(shopId: string): Observable<AdminShopRow> {
    return this.http
      .post<ApiResponse<AdminShopRow>>(
        `${this.base}/${shopId}/unban`,
        {},
        { withCredentials: true },
      )
      .pipe(map((r) => r.data));
  }

  remove(shopId: string): Observable<void> {
    return this.http
      .delete<void>(`${this.base}/${shopId}`, { withCredentials: true })
      .pipe(map(() => undefined));
  }
}

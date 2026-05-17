import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export type ProductStatusValue = 'AVAILABLE' | 'OUT_OF_STOCK' | 'UNLISTED' | 'DISCONTINUED';

export interface AdminProductRow {
  productId: string;
  shopId: string | null;
  shopName: string | null;
  name: string;
  sku: string | null;
  description: string | null;
  productStatus: ProductStatusValue | string;
  price: number | null;
  wholesalePrice: number | null;
  quantity: number | null;
  averageRating: number | null;
  totalFeedbacks: number | null;
  thumbnailUrl: string | null;
  totalSold: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AdminProductStats {
  totalProducts: number;
  availableProducts: number;
  outOfStockProducts: number;
  unlistedProducts: number;
  discontinuedProducts: number;
  totalShops: number;
  totalInventoryValue: number;
  productsWithFeedback: number;
  newProductsLast30: number;
}

export interface AdminProductListPage {
  items: AdminProductRow[];
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

@Injectable({ providedIn: 'root' })
export class AdminProductService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/products/admin`;

  getStats(): Observable<AdminProductStats> {
    return this.http
      .get<ApiResponse<AdminProductStats>>(`${this.base}/stats`, { withCredentials: true })
      .pipe(map((r) => r.data));
  }

  list(params: {
    status?: 'all' | ProductStatusValue;
    shopId?: string;
    keyword?: string;
    page?: number;
    size?: number;
  } = {}): Observable<AdminProductListPage> {
    let p = new HttpParams();
    if (params.status && params.status !== 'all') p = p.set('status', params.status);
    if (params.shopId) p = p.set('shopId', params.shopId);
    if (params.keyword?.trim()) p = p.set('keyword', params.keyword.trim());
    p = p.set('page', String(params.page ?? 0));
    p = p.set('size', String(params.size ?? 20));

    return this.http
      .get<ApiResponse<SpringPage<AdminProductRow>>>(this.base, {
        params: p,
        withCredentials: true,
      })
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

  get(productId: string): Observable<AdminProductRow> {
    return this.http
      .get<ApiResponse<AdminProductRow>>(`${this.base}/${productId}`, { withCredentials: true })
      .pipe(map((r) => r.data));
  }

  changeStatus(productId: string, value: ProductStatusValue): Observable<AdminProductRow> {
    return this.http
      .patch<ApiResponse<AdminProductRow>>(
        `${this.base}/${productId}/status?value=${value}`,
        {},
        { withCredentials: true },
      )
      .pipe(map((r) => r.data));
  }

  remove(productId: string): Observable<void> {
    return this.http
      .delete<void>(`${this.base}/${productId}`, { withCredentials: true })
      .pipe(map(() => undefined));
  }
}

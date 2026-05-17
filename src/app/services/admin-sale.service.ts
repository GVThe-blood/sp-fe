import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SaleResponse {
  id: string;
  title: string;
  description: string | null;
  discountPercentage: number;
  conditions: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  active: boolean | null;
  productIds: string[] | null;
}

export interface SaleUpsertRequest {
  title: string;
  description?: string;
  discountPercentage: number;
  conditions?: string;
  startDate?: string;
  endDate?: string;
  productIds?: string[];
}

export interface SaleListPage {
  items: SaleResponse[];
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
 * HTTP client cho Sales (chương trình khuyến mãi). Endpoint base
 * {@code /api/v1/sales/**} — gateway đã có route {@code product-service-sales}
 * trỏ vào product-service. BE controller cho phép GET public + admin/shop_owner
 * cho mutations.
 */
@Injectable({ providedIn: 'root' })
export class AdminSaleService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/sales`;

  list(params: {
    keyword?: string;
    page?: number;
    size?: number;
  } = {}): Observable<SaleListPage> {
    let p = new HttpParams();
    if (params.keyword?.trim()) p = p.set('keyword', params.keyword.trim());
    p = p.set('page', String(params.page ?? 0));
    p = p.set('size', String(params.size ?? 20));
    return this.http
      .get<ApiResponse<SpringPage<SaleResponse>>>(this.base, { params: p, withCredentials: true })
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

  /** All currently active sales (lifetime, không paginate). */
  listActive(): Observable<SaleResponse[]> {
    return this.http
      .get<ApiResponse<SaleResponse[]>>(`${this.base}/active`, { withCredentials: true })
      .pipe(map((r) => r.data ?? []));
  }

  get(id: string): Observable<SaleResponse> {
    return this.http
      .get<ApiResponse<SaleResponse>>(`${this.base}/${id}`, { withCredentials: true })
      .pipe(map((r) => r.data));
  }

  /** Mảng productId đang được apply trong sale này. */
  getProducts(id: string): Observable<string[]> {
    return this.http
      .get<ApiResponse<string[]>>(`${this.base}/${id}/products`, { withCredentials: true })
      .pipe(map((r) => r.data ?? []));
  }

  create(payload: SaleUpsertRequest): Observable<SaleResponse> {
    return this.http
      .post<ApiResponse<SaleResponse>>(this.base, payload, { withCredentials: true })
      .pipe(map((r) => r.data));
  }

  update(id: string, payload: SaleUpsertRequest): Observable<SaleResponse> {
    return this.http
      .put<ApiResponse<SaleResponse>>(`${this.base}/${id}`, payload, { withCredentials: true })
      .pipe(map((r) => r.data));
  }

  remove(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.base}/${id}`, { withCredentials: true })
      .pipe(map(() => undefined));
  }

  addProducts(id: string, productIds: string[]): Observable<SaleResponse> {
    return this.http
      .post<ApiResponse<SaleResponse>>(`${this.base}/${id}/products`, productIds, {
        withCredentials: true,
      })
      .pipe(map((r) => r.data));
  }

  removeProducts(id: string, productIds: string[]): Observable<SaleResponse> {
    return this.http
      .request<ApiResponse<SaleResponse>>('DELETE', `${this.base}/${id}/products`, {
        body: productIds,
        withCredentials: true,
      })
      .pipe(map((r) => r.data));
  }
}

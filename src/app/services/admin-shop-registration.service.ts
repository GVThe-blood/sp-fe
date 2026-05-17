import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AdminShopRegistrationView {
  requestId: string;
  userId: string;
  shopName: string | null;
  logoMediaId: string | null;
  introduction: string | null;
  shopType: string | null;
  businessType: string | null;
  email: string | null;
  phoneNumber: string | null;
  shopAddress: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  nationId: string | null;
  activeHours: string | null;
  taxId: string | null;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  rejectReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  shopId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface RegistrationStatusFilter {
  status?: 'all' | 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
  search?: string;
  page?: number;
  size?: number;
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
  number: number; // current page index
  size: number;
}

export interface AdminRegistrationPage {
  items: AdminShopRegistrationView[];
  totalItems: number;
  totalPages: number;
  page: number;
  pageSize: number;
}

/**
 * HTTP client cho `/api/v1/shop-registration/admin/**`. BE tự enforce ADMIN
 * role; FE chỉ hỗ trợ list/approve/reject.
 */
@Injectable({ providedIn: 'root' })
export class AdminShopRegistrationService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/shop-registration/admin`;

  list(filter: RegistrationStatusFilter = {}): Observable<AdminRegistrationPage> {
    let params = new HttpParams();
    if (filter.status && filter.status !== 'all') params = params.set('status', filter.status);
    if (filter.search?.trim()) params = params.set('search', filter.search.trim());
    params = params.set('page', String(filter.page ?? 0));
    params = params.set('size', String(filter.size ?? 20));
    return this.http
      .get<ApiResponse<SpringPage<AdminShopRegistrationView>>>(this.base, {
        params,
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

  get(requestId: string): Observable<AdminShopRegistrationView> {
    return this.http
      .get<ApiResponse<AdminShopRegistrationView>>(`${this.base}/${requestId}`, {
        withCredentials: true,
      })
      .pipe(map((r) => r.data));
  }

  approve(requestId: string): Observable<AdminShopRegistrationView> {
    return this.http
      .post<ApiResponse<AdminShopRegistrationView>>(
        `${this.base}/${requestId}/approve`,
        {},
        { withCredentials: true },
      )
      .pipe(map((r) => r.data));
  }

  reject(requestId: string, reason: string): Observable<AdminShopRegistrationView> {
    return this.http
      .post<ApiResponse<AdminShopRegistrationView>>(
        `${this.base}/${requestId}/reject`,
        { reason },
        { withCredentials: true },
      )
      .pipe(map((r) => r.data));
  }
}

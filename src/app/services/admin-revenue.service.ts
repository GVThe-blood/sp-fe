import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/** ----- Response types — match backend DTOs trong statistical-report. ----- */

export interface AdminRevenueStats {
  totalGmv: number;
  totalCommission: number;
  gmvLast30: number;
  gmvPrev30: number;
  ordersLast30: number;
  ordersPrev30: number;
  avgOrderValue: number;
  activeShops: number;
  totalShippingFee: number;
  totalDiscount: number;
}

export interface RevenueDailyPoint {
  date: string; // ISO yyyy-MM-dd
  revenue: number;
  commission: number;
  orderCount: number;
}

export interface RevenueByPayment {
  paymentMethod: string;
  revenue: number;
  orderCount: number;
  percentage: number;
}

export interface RevenueByShop {
  shopId: string;
  shopName: string;
  logoUrl: string | null;
  totalRevenue: number;
  totalOrders: number;
  totalCommission: number;
  avgOrderValue: number;
}

/** Spring Page<T> — chỉ giữ field cần. */
export interface PageResp<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // current page index
  size: number;
}

/**
 * Service gọi `/statistical-reports/admin/revenue/**`. Tương ứng với
 * {@code AdminRevenueResources} ở BE.
 */
@Injectable({ providedIn: 'root' })
export class AdminRevenueService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/statistical-reports/admin/revenue`;

  getStats(): Observable<AdminRevenueStats> {
    return this.http.get<AdminRevenueStats>(`${this.base}/stats`, {
      withCredentials: true,
    });
  }

  getDaily(start?: string, end?: string): Observable<RevenueDailyPoint[]> {
    let params = new HttpParams();
    if (start) params = params.set('start', start);
    if (end) params = params.set('end', end);
    return this.http.get<RevenueDailyPoint[]>(`${this.base}/daily`, {
      params,
      withCredentials: true,
    });
  }

  getByPayment(start?: string, end?: string): Observable<RevenueByPayment[]> {
    let params = new HttpParams();
    if (start) params = params.set('start', start);
    if (end) params = params.set('end', end);
    return this.http.get<RevenueByPayment[]>(`${this.base}/by-payment`, {
      params,
      withCredentials: true,
    });
  }

  getByShop(opts: {
    start?: string;
    end?: string;
    search?: string;
    page?: number;
    size?: number;
  }): Observable<PageResp<RevenueByShop>> {
    let params = new HttpParams()
      .set('page', String(opts.page ?? 0))
      .set('size', String(opts.size ?? 20));
    if (opts.start) params = params.set('start', opts.start);
    if (opts.end) params = params.set('end', opts.end);
    if (opts.search) params = params.set('search', opts.search);
    return this.http.get<PageResp<RevenueByShop>>(`${this.base}/by-shop`, {
      params,
      withCredentials: true,
    });
  }
}

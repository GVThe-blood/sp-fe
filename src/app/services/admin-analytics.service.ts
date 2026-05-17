import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DashboardRange } from './analytics.service';

/**
 * Wire types — mirror các Java records ở
 * {@code statistical-report/.../dto/report/AdminDashboardSnapshotDTO.java}.
 */

export interface PlatformOverviewDTO {
  totalShops: number;
  activeShops: number;
  pendingShops: number;
  suspendedShops: number;
  totalUsers: number;
  totalCustomers: number;
  totalShopOwners: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingRegistrations: number;
}

export interface NewSignupReportDTO {
  period: string;
  newUsers: number;
  newShops: number;
}

export interface OrderStatusBreakdownDTO {
  status: string;
  count: number;
}

export interface ShopRankingDTO {
  shopId: string | null;
  shopName: string | null;
  logoUrl: string | null;
  totalRevenue: number;
  totalOrders: number;
  avgRating: number | null;
}

export interface AdminDashboardSnapshotDTO {
  overview: PlatformOverviewDTO;
  revenueSeries: { period: string; revenue: number; orderCount: number; avgOrderValue: number }[];
  signupSeries: NewSignupReportDTO[];
  orderStatusBreakdown: OrderStatusBreakdownDTO[];
  topShops: ShopRankingDTO[];
  windowRevenue: number;
  windowOrders: number;
  previousRevenue: number;
  previousOrders: number;
  range: DashboardRange;
}

/**
 * Client cho `/statistical-reports/admin/**` — chỉ ADMIN mới gọi được. Gateway
 * forward header `X-User-Roles=ROLE_ADMIN,...` nên BE tự enforce, FE không
 * cần thêm gì.
 */
@Injectable({ providedIn: 'root' })
export class AdminAnalyticsService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/statistical-reports/admin`;

  /** Aggregate snapshot: overview + revenue series + signups + order breakdown + top shops. */
  getAdminDashboard(range: DashboardRange = 'week', topShopsLimit = 10): Observable<AdminDashboardSnapshotDTO> {
    const params = new HttpParams()
      .set('range', range)
      .set('topShopsLimit', topShopsLimit);
    return this.http.get<AdminDashboardSnapshotDTO>(`${this.base}/dashboard`, {
      params,
      withCredentials: true,
    });
  }

  /** Standalone overview (without time-windowed slices). */
  getPlatformOverview(): Observable<PlatformOverviewDTO> {
    return this.http.get<PlatformOverviewDTO>(`${this.base}/overview`, {
      withCredentials: true,
    });
  }

  /** Top shops trong khoảng tuỳ ý (cho future drill-down page). */
  getTopShops(start: Date, end: Date, limit = 20): Observable<ShopRankingDTO[]> {
    const params = new HttpParams()
      .set('startDate', start.toISOString().slice(0, 19))
      .set('endDate', end.toISOString().slice(0, 19))
      .set('limit', limit);
    return this.http.get<ShopRankingDTO[]>(`${this.base}/top-shops`, {
      params,
      withCredentials: true,
    });
  }
}

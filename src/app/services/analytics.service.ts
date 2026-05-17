import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Range tokens accepted by the BE /me/dashboard endpoint.
 *
 * The string values match what {@code StatisticalReportResources#resolveRange}
 * understands on the server (see {@code statistical-report} service).
 */
export type DashboardRange = 'week' | 'month' | 'quarter' | 'year';

// ---------------------------------------------------------------------------
// Wire types — these mirror the Java records the BE sends. Numbers stay as
// `number` rather than `string` because the BE uses `BigDecimal` but Jackson
// serialises them as JSON numbers.
// ---------------------------------------------------------------------------

export interface RevenueReportDTO {
  period: string;             // ISO LocalDateTime
  revenue: number;
  orderCount: number;
  avgOrderValue: number;
}

export interface ProfitReportDTO {
  period: string;
  grossRevenue: number;
  totalShippingFee: number;
  totalDiscount: number;
  netProfit: number;
}

export interface OrderSuccessRateDTO {
  totalOrders: number;
  completedOrders: number;
  failedOrders: number;
  cancelledOrders: number;
  returnedOrders: number;
  successRate: number;
}

export interface RatingReportDTO {
  averageRating: number;
  totalFeedbacks: number;
  star1: number;
  star2: number;
  star3: number;
  star4: number;
  star5: number;
}

export interface ShopOverviewDTO {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  averageRating: number;
  totalFeedbacks: number;
  totalCustomers: number;
}

export interface TopProductDTO {
  productId: string;
  productName: string;
  sku: string | null;
  imageUrl: string | null;
  stockQuantity: number | null;
  quantitySold: number;
  revenue: number;
}

export interface DashboardSnapshotDTO {
  overview: ShopOverviewDTO;
  successRate: OrderSuccessRateDTO;
  ratings: RatingReportDTO;
  revenueSeries: RevenueReportDTO[];
  profitSeries: ProfitReportDTO[];
  topProducts: TopProductDTO[];
  previousRevenue: number;
  previousOrders: number;
  range: DashboardRange;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/statistical-reports`;

  /**
   * One-shot dashboard payload for the currently signed-in shop owner.
   *
   * Authentication is delivered via cookies handled globally elsewhere; the
   * gateway resolves the shop owner from the JWT and populates the
   * {@code X-Shop-ID} header consumed by the BE.
   */
  getMyDashboard(range: DashboardRange, topProductsLimit = 5): Observable<DashboardSnapshotDTO> {
    const params = new HttpParams()
      .set('range', range)
      .set('topProductsLimit', topProductsLimit);
    return this.http.get<DashboardSnapshotDTO>(`${this.base}/me/dashboard`, {
      params,
      withCredentials: true,
    });
  }

  /** Granular endpoints — exposed for future drill-down panels. */
  getMyRevenue(start: Date, end: Date, groupBy: 'day' | 'month' | 'year' = 'day'): Observable<RevenueReportDTO[]> {
    return this.http.get<RevenueReportDTO[]>(`${this.base}/me/revenue`, {
      params: this.dateRangeParams(start, end).set('groupBy', groupBy),
      withCredentials: true,
    });
  }

  getMyProfit(start: Date, end: Date, groupBy: 'day' | 'month' | 'year' = 'day'): Observable<ProfitReportDTO[]> {
    return this.http.get<ProfitReportDTO[]>(`${this.base}/me/profit`, {
      params: this.dateRangeParams(start, end).set('groupBy', groupBy),
      withCredentials: true,
    });
  }

  getMyTopProducts(start: Date, end: Date, limit = 10): Observable<TopProductDTO[]> {
    return this.http.get<TopProductDTO[]>(`${this.base}/me/top-products`, {
      params: this.dateRangeParams(start, end).set('limit', limit),
      withCredentials: true,
    });
  }

  private dateRangeParams(start: Date, end: Date): HttpParams {
    return new HttpParams()
      // Angular's HttpParams URL-encodes the value; the BE @DateTimeFormat
      // accepts both with and without timezone offset.
      .set('startDate', start.toISOString().slice(0, 19))
      .set('endDate', end.toISOString().slice(0, 19));
  }
}

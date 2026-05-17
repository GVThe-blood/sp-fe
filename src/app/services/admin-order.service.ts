import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export type OrderStatusValue =
  | 'PENDING_PAYMENT'
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'READY_FOR_PICKUP'
  | 'SHIPPING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ORDER_RETURN'
  | 'FAILED'
  | 'DELETED';

export interface AdminOrderRow {
  orderId: string;
  userId: string | null;
  shopId: string | null;
  shopName: string | null;
  shopLogoUrl: string | null;
  buyerUsername: string | null;
  buyerName: string | null;
  orderStatus: OrderStatusValue | string | null;
  paymentMethod: string | null;
  subtotalAmount: number | null;
  shippingFee: number | null;
  discount: number | null;
  finalPrice: number | null;
  itemCount: number;
  shippingCity: string | null;
  shippingDetails: string | null;
  paidAt: string | null;
  deliveredAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AdminOrderStats {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  shippingOrders: number;
  cancelledOrders: number;
  failedOrders: number;
  totalGmv: number;
  ordersLast30: number;
  ordersLast24h: number;
}

export interface AdminOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  priceAtBooking: number;
  image?: string | null;
}

export interface AdminOrderListPage {
  items: AdminOrderRow[];
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
export class AdminOrderService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/order/admin`;

  getStats(): Observable<AdminOrderStats> {
    return this.http
      .get<ApiResponse<AdminOrderStats>>(`${this.base}/stats`, { withCredentials: true })
      .pipe(map((r) => r.data));
  }

  list(params: {
    status?: 'all' | OrderStatusValue;
    shopId?: string;
    userId?: string;
    search?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    size?: number;
  } = {}): Observable<AdminOrderListPage> {
    let p = new HttpParams();
    if (params.status && params.status !== 'all') p = p.set('status', params.status);
    if (params.shopId) p = p.set('shopId', params.shopId);
    if (params.userId) p = p.set('userId', params.userId);
    if (params.search?.trim()) p = p.set('search', params.search.trim());
    if (params.fromDate) p = p.set('fromDate', params.fromDate);
    if (params.toDate) p = p.set('toDate', params.toDate);
    p = p.set('page', String(params.page ?? 0));
    p = p.set('size', String(params.size ?? 20));

    return this.http
      .get<ApiResponse<SpringPage<AdminOrderRow>>>(this.base, {
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

  get(orderId: string): Observable<AdminOrderRow> {
    return this.http
      .get<ApiResponse<AdminOrderRow>>(`${this.base}/${orderId}`, { withCredentials: true })
      .pipe(map((r) => r.data));
  }

  getItems(orderId: string): Observable<AdminOrderItem[]> {
    return this.http
      .get<ApiResponse<AdminOrderItem[]>>(`${this.base}/${orderId}/items`, {
        withCredentials: true,
      })
      .pipe(map((r) => r.data ?? []));
  }

  forceUpdateStatus(orderId: string, value: OrderStatusValue): Observable<AdminOrderRow> {
    return this.http
      .patch<ApiResponse<AdminOrderRow>>(
        `${this.base}/${orderId}/status?value=${value}`,
        {},
        { withCredentials: true },
      )
      .pipe(map((r) => r.data));
  }
}

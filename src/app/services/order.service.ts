import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Centralised order status tokens — mirror of the BE enum
 * {@code com.theblood.springfood.common.enums.OrderStatus}.
 */
export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'READY_FOR_PICKUP'
  | 'SHIPPING'
  | 'COMPLETED'
  | 'ORDER_RETURN'
  | 'FAILED'
  | 'DELETED';

export type TransactionStatus =
  | 'PENDING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'REFUNDED'
  | 'CANCELLED';

/**
 * Mirror of {@code com.theblood.orderservice.dto.response.OrderItemView}.
 *
 * <p>Mỗi line trong 1 order. {@code quantity} là số lượng khách đã đặt
 * (lấy từ {@code order_items.quantity}, không phải tồn kho sản phẩm) —
 * sửa lệch nghiêm trọng trước đây khi BE trả về {@code ProductDetail}.</p>
 */
export interface OrderItemView {
  productId: string | null;
  productName: string | null;
  /** Number of units the customer ordered. */
  quantity: number;
  /** Unit price captured at booking time, in VND. */
  priceAtBooking: number;
  /** First image URL, may be null. */
  image: string | null;
}

export interface OrderDetail {
  orderId: string;
  userId: string;
  shopId: string;
  orderDate: string; // ISO LocalDateTime
  subtotalAmount: number;
  discount: number;
  finalPrice: number;
  paymentMethod: string;
  paymentStatus: TransactionStatus | null;
  orderStatus: OrderStatus;
  items: OrderItemView[];
  shippingAddress: string | null;
  shippingFee: number | null;
  deliveredAt: string | null;
}

export interface OrderPage {
  content: OrderDetail[];
  totalElements: number;
  totalPages: number;
  number: number; // page index
  size: number;
}

interface ApiResponse<T> {
  appStatus?: number;
  code?: number;
  message: string;
  data: T;
}

/**
 * Allowed status transitions per the BE state machine
 * ({@code OrderStatusValidationUtil}). Useful for the FE to render the right
 * action buttons without hitting the network.
 */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['PENDING_PAYMENT', 'CONFIRMED'],
  PENDING_PAYMENT: ['PENDING', 'CONFIRMED'],
  CONFIRMED: ['PENDING_PAYMENT', 'PROCESSING'],
  PROCESSING: ['READY_FOR_PICKUP'],
  READY_FOR_PICKUP: ['SHIPPING'],
  SHIPPING: ['COMPLETED', 'FAILED'],
  COMPLETED: ['ORDER_RETURN'],
  ORDER_RETURN: ['SHIPPING'],
  FAILED: ['DELETED'],
  DELETED: [],
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: 'Chờ xác nhận',
  PENDING_PAYMENT: 'Chờ thanh toán',
  CONFIRMED: 'Đã xác nhận',
  PROCESSING: 'Đang xử lý',
  READY_FOR_PICKUP: 'Sẵn sàng giao',
  SHIPPING: 'Đang giao',
  COMPLETED: 'Hoàn thành',
  ORDER_RETURN: 'Trả hàng',
  FAILED: 'Thất bại',
  DELETED: 'Đã xóa',
};

@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/order`;

  /**
   * Paged list of orders belonging to the signed-in shop.
   * Backend infers {@code shopId} from JWT.
   */
  listShopOrders(page = 0, size = 10, sort?: string): Observable<OrderPage> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (sort) params = params.set('sort', sort);
    return this.http
      .get<ApiResponse<OrderPage>>(`${this.base}/shop`, {
        params,
        withCredentials: true,
      })
      .pipe(map((r) => r.data));
  }

  getShopOrderDetail(orderId: string): Observable<OrderDetail> {
    return this.http
      .get<ApiResponse<OrderDetail>>(`${this.base}/shop/${orderId}`, {
        withCredentials: true,
      })
      .pipe(map((r) => r.data));
  }

  updateStatus(
    orderId: string,
    targetStatus: OrderStatus,
    reason?: string
  ): Observable<OrderDetail> {
    return this.http
      .put<ApiResponse<OrderDetail>>(
        `${this.base}/shop/${orderId}/status`,
        { targetStatus, reason },
        { withCredentials: true }
      )
      .pipe(map((r) => r.data));
  }
}

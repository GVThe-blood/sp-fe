/**
 * Order models — map 1-1 với BE order-service `OrderDetailResponse` và Spring `Page`.
 */

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'SHIPPING'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type TransactionStatus =
  | 'PENDING'
  | 'SUCCESS'
  | 'FAILED'
  | 'REFUNDED';

/**
 * Mirror của {@code com.theblood.orderservice.dto.response.OrderItemView}.
 *
 * <p>Trước đây BE trả {@code List<ProductDetail>} cho field {@code items} →
 * {@code quantity} là tồn kho sản phẩm chứ không phải số lượng đặt. Đã
 * được sửa thành DTO riêng {@code OrderItemView} để giữ đúng ý nghĩa.</p>
 */
export interface OrderItemProductDetail {
  productId?: string;
  productName?: string;
  /** Số lượng khách đã đặt (lấy từ {@code order_items.quantity}). */
  quantity?: number;
  /** Giá tại thời điểm đặt hàng (VND). */
  priceAtBooking?: number;
  /** URL ảnh sản phẩm — có thể null. */
  image?: string | null;

  // Aliases giữ tương thích với code cũ — không có trên wire format.
  /** @deprecated dùng {@link priceAtBooking}. */
  price?: number;
  /** @deprecated dùng {@link image}. */
  productImage?: string;
  variantName?: string;
  total?: number;
  [key: string]: unknown;
}

export interface OrderDetailResponse {
  orderId: string;
  userId: string;
  shopId?: string;
  orderDate: string;
  subtotalAmount: number;
  discount?: number;
  finalPrice: number;
  paymentMethod?: string;
  paymentStatus?: TransactionStatus;
  orderStatus: OrderStatus;
  items: OrderItemProductDetail[];
  shippingAddress?: string;
  shippingFee?: number;
  deliveredAt?: string;
}

/** Map 1-1 với Spring `Page<T>`. */
export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;       // current page (0-indexed)
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}


// =============================================================================
// Checkout flow — type cho POST /api/v1/order/checkout
// (Khôi phục từ refactor trước.)
// =============================================================================

import type { CartItemResponse } from './cart.model';

export type PaymentMethod = 'COD' | 'VNPAY';

export interface OrderCheckoutItem {
  productId: string;
  variantId?: string;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  originalPrice?: number;
}

export interface ShopOrderRequest {
  shopId: string;
  shopName?: string;
  items: OrderCheckoutItem[];
  shippingFee?: number;
  shippingMethod?: 'DOOR' | 'STANDARD';
  note?: string;
  voucher?: string;
}

export interface OrderCheckoutRequest {
  shopOrderItems: ShopOrderRequest[];
  paymentMethod: PaymentMethod;
  shippingAddressId?: string;
  globalVoucher?: string;
}

export interface OrderPaymentResponse {
  referenceId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentUrl?: string;          // chỉ có khi VNPAY và BE build sẵn URL
  orders?: OrderDetailResponse[];
}

export interface VNPayPaymentRequest {
  paymentMethod: PaymentMethod;
  amount: number;
  orderInfo: string;
  txnRef: string;
  transferDate?: string;        // LocalDateTime string yyyy-MM-ddTHH:mm:ss
}

/**
 * Group `CartItemResponse` theo shopId rồi build thành `ShopOrderRequest[]`
 * sẵn sàng đẩy vào `OrderCheckoutRequest.shopOrderItems`.
 *
 * Item nào không có `shopId` (mock data) sẽ bị bỏ qua + log warning.
 */
export function buildShopOrdersFromCart(items: CartItemResponse[]): ShopOrderRequest[] {
  const grouped = new Map<string, ShopOrderRequest>();

  for (const it of items) {
    if (!it.shopId) {
      console.warn('[buildShopOrdersFromCart] item missing shopId, skip', it);
      continue;
    }
    const key = it.shopId;
    let group = grouped.get(key);
    if (!group) {
      group = {
        shopId: it.shopId,
        shopName: it.shopName,
        items: []
      };
      grouped.set(key, group);
    }
    group.items.push({
      productId: it.productId,
      productName: it.productName,
      productImage: it.productImage,
      quantity: it.quantity,
      unitPrice: it.price ?? it.finalPrice ?? 0,
      originalPrice: it.originalPrice
    });
  }

  return Array.from(grouped.values());
}

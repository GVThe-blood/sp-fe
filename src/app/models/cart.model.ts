/**
 * Cart Models — map 1-1 với BE DTO của cart-service.
 *
 * Backend reference:
 *  - cart-service/.../service/dto/response/CartResponse.java
 *  - cart-service/.../service/dto/response/ShopCartGroup.java
 *  - cart-service/.../service/dto/response/CartItemResponse.java
 *  - cart-service/.../service/dto/request/AddToCartRequest.java
 *  - cart-service/.../service/dto/request/SelectionUpdateRequest.java
 *
 * BigDecimal phía BE serialize ra `number` trong JSON.
 */

export interface CartItemResponse {
  // Product identity
  sku: string;
  productId: string;            // UUID
  productName: string;
  productImage?: string;

  // Shop
  shopId?: string;              // UUID
  shopName?: string;

  // Pricing
  originalPrice?: number;
  price?: number;
  discountAmount?: number;
  finalPrice?: number;
  promotionName?: string;
  discountPercent?: number;

  // Quantity & stock
  quantity: number;
  availableStock?: number;
  hasEnoughStock?: boolean;

  // Availability
  isAvailable?: boolean;
  unavailableReason?: string;
  unavailableMessage?: string;

  // Variant
  variantName?: string;
  attributes?: Record<string, string>;

  // Selection
  selected: boolean;
  canCheckout?: boolean;

  // Timestamps (ISO datetime strings)
  addedAt?: string;
  updatedAt?: string;
}

export interface ShopCartGroup {
  shopId?: string;
  shopName?: string;
  shopAvatar?: string;
  items: CartItemResponse[];
  shopTotal: number;
  selectedTotal: number;
  itemCount: number;
  selectedCount: number;
  allSelected: boolean;
  hasUnavailableItems: boolean;
}

export interface CartResponse {
  userId: string;
  totalPrice: number;
  selectedTotal: number;
  totalItems: number;
  selectedItems: number;
  shopGroups: ShopCartGroup[];
  warnings: string[];
  canCheckout: boolean;
  hasUnavailableItems: boolean;
  hasInsufficientStock?: boolean;
  updatedAt?: string;
  lastValidated?: string;
}

export interface AddToCartRequest {
  productId: string;
  sku?: string;
  productName: string;
  productImage?: string;
  shopId?: string;
  shopName?: string;
  quantity?: number;            // default 1 ở BE
  price?: number;
  originalPrice?: number;
  discountAmount?: number;
  // Variants (decision #3)
  variantName?: string;
  attributes?: Record<string, string>;
}

export interface SkuSelection {
  sku: string;
  selected: boolean;
}

export interface SelectionUpdateRequest {
  /** Mode item-level. */
  items?: SkuSelection[];
  /** Mode shop-level. */
  shopId?: string;
  /** Mode cart-level. */
  selectAll?: boolean;
  /** Giá trị áp dụng cho mode shopId hoặc selectAll. */
  selected?: boolean;
}

/** Wrapper response chuẩn từ BE (`ResponseData<T>`). */
export interface CartApiResponse<T> {
  appStatus: number;
  message: string;
  data: T;
}

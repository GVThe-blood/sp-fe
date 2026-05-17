/**
 * Wishlist (Sản phẩm yêu thích) models.
 * Map 1-1 với BE `WishlistItemResponse` ở product-service.
 */

export interface WishlistItemResponse {
  wishlistId: string;
  productId: string;
  variantId?: string;
  note?: string;
  createdAt: string;            // ISO instant
  productName?: string;
  productImage?: string;
  productPrice?: number;
  productOriginalPrice?: number;
  isAvailable?: boolean;
}

export interface WishlistAddRequest {
  productId: string;
  variantId?: string;
  note?: string;
}

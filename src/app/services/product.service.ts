import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  images: string;
  quantity: number;
  msg: string | null;
  exp: string | null;
  averageRating: number;
  totalFeedbacks: number;
  shopName?: string;
  /**
   * Giá gốc trước khi giảm — BE set khi có sale active.
   * Bằng `price` khi không có sale.
   */
  originalPrice?: string | number | null;
  /** % giảm giá đang áp dụng (0–100). Null/0 nếu không có sale active.
   */
  discountPercentage?: string | number | null;

  // ---------------------------------------------------------------------
  // Owner-only fields — mirror các trường mới trên `ProductDetail` (BE).
  // BE serialize {@code @JsonInclude(NON_NULL)} nên các field này chỉ xuất
  // hiện khi caller là owner (endpoint `/products/shop`). Public endpoints
  // (homepage, search, by-shop menu storefront) trả undefined.
  // ---------------------------------------------------------------------
  /** SKU duy nhất của sản phẩm trong phạm vi 1 shop. */
  sku?: string;
  /** Giá bán buôn (VND). */
  wholesalePrice?: string | number | null;
  /** Trạng thái: AVAILABLE | OUT_OF_STOCK | DISABLED. */
  status?: 'AVAILABLE' | 'OUT_OF_STOCK' | 'DISABLED' | string;
  /** Tên category đầu tiên gắn với product — dùng để prefill form edit. */
  categoryName?: string;
  /** Owner shop của sản phẩm. */
  shopId?: string;
}

export interface ProductPage {
  content: Product[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
}

/**
 * Mirror of {@code com.theblood.productservice.service.dto.response.ShopMenuCategoryResponse}.
 *
 * <p>One bucket of a shop's storefront menu — emitted by
 * {@code GET /products/by-shop/{shopId}/menu}. The {@code id} is a stable
 * hash of the category name so the storefront can use it as a scroll anchor
 * (e.g. {@code #category-{id}}).</p>
 */
export interface ShopMenuCategory {
  id: number;
  name: string;
  slug: string | null;
  count: number;
  products: Product[];
}

export interface ApiResponse<T> {
  code?: number;
  appStatus?: number;
  message: string;
  data: T;
}

export interface FlashSaleResponse {
  products: Product[];
  endTime: string;
  discount: number;
}

export interface SearchCriteria {
  [key: string]: string;
}

/**
 * Mirror of the public DTO returned by `GET /products/categories`.
 * Backend uses {@code Map<String,Object>} so slug + isActive are loose-typed.
 */
export interface CategoryOption {
  name: string;
  slug: string;
  description?: string | null;
  isActive?: boolean;
}

/**
 * Direct port of {@code com.theblood.productservice.service.dto.request.ProductRequest}.
 *
 * BE validation expects strings for the numeric fields (price, wholesalePrice)
 * because of how it parses Excel imports — the JSON path keeps the same shape.
 */
export interface CreateProductRequest {
  shopId: string;
  /** Comma-separated list of category slugs/ids when product belongs to >1 category. */
  categoryNames: string;
  name: string;
  description?: string;
  /** BE expects price as string. */
  price: string;
  /** JSON-encoded array of image URLs, e.g. '["https://…/a.jpg"]'. */
  images: string;
  quantity?: number;
  sku: string;
  msg?: string; // ISO date
  exp?: string; // ISO date
  status?: 'AVAILABLE' | 'OUT_OF_STOCK' | 'DISABLED';
  wholesalePrice: string;
  avgRate?: number;
}

export interface ProductImagesUploadResponse {
  productId: string;
  saveAt: string;
  minIOResponses: Array<{
    url: string;
    objectKey: string;
    size?: number;
    contentType?: string;
    message?: string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/products`;

  // Signal for search state
  searchQuery = signal('');
  isSearching = signal(false);

  /**
   * Get all products with pagination
   */
  getAllProducts(page: number = 0, size: number = 10): Observable<ApiResponse<ProductPage>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiResponse<ProductPage>>(`${this.apiUrl}/`, { params });
  }

  /**
   * Get product by ID
   */
  getProductById(id: string): Observable<ApiResponse<Product>> {
    return this.http.get<ApiResponse<Product>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Search products by price range
   */
  searchByPrice(from: string, to: string, page: number = 0, size: number = 10): Observable<ApiResponse<ProductPage>> {
    const params = new HttpParams()
      .set('from', from)
      .set('to', to)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiResponse<ProductPage>>(`${this.apiUrl}/search/price`, { params });
  }

  /**
   * Dynamic search with multiple criteria
   * 
   * @param criteria - Search criteria object
   * @param page - Page number
   * @param size - Page size
   * @param sort - Sort field and direction (e.g., 'price,ASC')
   * 
   * @example
   * // Search by name containing "laptop"
   * searchProducts({ name: ':laptop' })
   * 
   * // Search by price range
   * searchProducts({ price: '~10000-50000' })
   * 
   * // Multiple criteria
   * searchProducts({ 
   *   name: ':laptop', 
   *   price: '>10000',
   *   quantity: '>0'
   * })
   * 
   * // With pagination and sorting
   * searchProducts(
   *   { name: ':laptop' },
   *   0,
   *   20,
   *   'price,ASC'
   * )
   */
  searchProducts(
    criteria: SearchCriteria,
    page: number = 0,
    size: number = 10,
    sort?: string
  ): Observable<ApiResponse<ProductPage>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    // Add search criteria - check for undefined/null, allow empty string
    Object.keys(criteria).forEach(key => {
      const value = criteria[key];
      if (value !== undefined && value !== null) {
        params = params.set(key, value);
      }
    });

    // Add sort if provided
    if (sort) {
      params = params.set('sort', sort);
    }

    return this.http.get<ApiResponse<ProductPage>>(`${this.apiUrl}/search`, { params });
  }

  /**
   * Search products by name (convenience method)
   */
  searchByName(name: string, page: number = 0, size: number = 10): Observable<ApiResponse<ProductPage>> {
    return this.searchProducts({ name: `:${name}` }, page, size);
  }

  /**
   * Get related products
   */
  getRelatedProducts(productId: string, page: number = 0, size: number = 10): Observable<ApiResponse<ProductPage>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiResponse<ProductPage>>(`${this.apiUrl}/related/${productId}`, { params });
  }

  /**
   * Get random related products (no pagination)
   */
  getRandomRelatedProducts(productId: string): Observable<ApiResponse<Product[]>> {
    return this.http.get<ApiResponse<Product[]>>(`${this.apiUrl}/randomRelated/${productId}`);
  }

  /**
   * Get flash sale products
   * 
   * Fetches products currently on flash sale with countdown timer end time
   * 
   * @returns Observable with flash sale products, end time, and discount percentage
   * 
   * Requirements: 9.1, 9.2
   */
  getFlashSaleProducts(): Observable<ApiResponse<FlashSaleResponse>> {
    return this.http.get<ApiResponse<FlashSaleResponse>>(`${this.apiUrl}/flash-sale`);
  }

  /**
   * Get recommended products (random products for freshness)
   *
   * @param page - Page number
   * @param size - Page size (default 20)
   * @returns Observable with random products
   */
  getRecommendedProducts(page: number = 0, size: number = 20): Observable<ApiResponse<ProductPage>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiResponse<ProductPage>>(`${this.apiUrl}/recommended`, { params });
  }

  /**
   * Public list of all products belonging to a specific shop.
   *
   * <p>Backed by {@code GET /products/by-shop/{shopId}} which returns a
   * paginated response of {@link Product} matching {@code shopId}. Used by
   * the shop detail page to render the menu without requiring auth.</p>
   *
   * @param shopId - Shop UUID
   * @param page - Page number (0-based)
   * @param size - Page size (default 100 to fetch full menu in one call)
   */
  getProductsByShop(shopId: string, page: number = 0, size: number = 100): Observable<ApiResponse<ProductPage>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiResponse<ProductPage>>(`${this.apiUrl}/by-shop/${shopId}`, { params });
  }

  /**
   * Storefront menu for a specific shop, grouped by category.
   *
   * <p>Backed by {@code GET /products/by-shop/{shopId}/menu}. Returns one
   * {@link ShopMenuCategory} per category present in the shop, plus a
   * synthetic {@code KHÁC} bucket for products without categories. The store
   * detail page consumes this directly to render the category chips, the
   * counts, and the section list.</p>
   */
  getShopMenu(shopId: string): Observable<ApiResponse<ShopMenuCategory[]>> {
    return this.http.get<ApiResponse<ShopMenuCategory[]>>(
      `${this.apiUrl}/by-shop/${shopId}/menu`
    );
  }

  /**
   * Public keyword search via product-service /products/search?keyword=
   */
  searchByKeyword(
    keyword: string,
    page: number = 0,
    size: number = 10
  ): Observable<ApiResponse<ProductPage>> {
    const params = new HttpParams()
      .set('keyword', keyword)
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<ApiResponse<ProductPage>>(`${this.apiUrl}/search`, { params });
  }

  /**
   * Cross-shop listing of products belonging to a specific category. The
   * {@code categoryKey} can be either the category's slug or its display
   * name — the BE matches both case-insensitive. Optional {@code keyword}
   * narrows the results within the category.
   *
   * <p>Backed by {@code GET /products/by-category/{slug}} which was added
   * to product-service for the storefront search-result page.</p>
   */
  searchByCategory(
    categoryKey: string,
    keyword: string = '',
    page: number = 0,
    size: number = 20
  ): Observable<ApiResponse<ProductPage>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (keyword) params = params.set('keyword', keyword);
    return this.http.get<ApiResponse<ProductPage>>(
      `${this.apiUrl}/by-category/${encodeURIComponent(categoryKey)}`,
      { params }
    );
  }

  /**
   * Per-shop keyword search. Hits {@code GET /products/by-shop/{shopId}/search}
   * which scans only products belonging to that shop. Empty keyword returns
   * the shop's whole menu.
   */
  searchByShop(
    shopId: string,
    keyword: string,
    page: number = 0,
    size: number = 20
  ): Observable<ApiResponse<ProductPage>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (keyword) params = params.set('keyword', keyword);
    return this.http.get<ApiResponse<ProductPage>>(
      `${this.apiUrl}/by-shop/${encodeURIComponent(shopId)}/search`,
      { params }
    );
  }

  /**
   * Admin platform search across all shops. Requires ADMIN role; the call
   * goes through {@code GET /products/admin/search} with optional shopId
   * + status filters.
   */
  adminSearch(
    params: { keyword?: string; shopId?: string; status?: string; page?: number; size?: number }
  ): Observable<ApiResponse<ProductPage>> {
    let httpParams = new HttpParams()
      .set('page', String(params.page ?? 0))
      .set('size', String(params.size ?? 20));
    if (params.keyword) httpParams = httpParams.set('keyword', params.keyword);
    if (params.shopId) httpParams = httpParams.set('shopId', params.shopId);
    if (params.status) httpParams = httpParams.set('status', params.status);
    return this.http.get<ApiResponse<ProductPage>>(`${this.apiUrl}/admin/search`, {
      params: httpParams,
      withCredentials: true
    });
  }

  /**
   * Visible categories for the current shop (system + own). Used by the
   * shop-owner product form to populate the category dropdown. Falls back
   * to the public {@code /categories} endpoint for unauthenticated callers.
   */
  getCategories(): Observable<ApiResponse<CategoryOption[]>> {
    return this.http.get<ApiResponse<CategoryOption[]>>(
      `${environment.apiUrl}/categories/visible`,
      { withCredentials: true }
    );
  }

  // ============= Shop owner CRUD =============

  /**
   * Get the current shop owner's products. Backend infers shop from JWT.
   */
  getMyShopProducts(page: number = 0, size: number = 10): Observable<ApiResponse<ProductPage>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<ApiResponse<ProductPage>>(`${this.apiUrl}/shop`, {
      params,
      withCredentials: true
    });
  }

  /**
   * Create a product. Requires SHOP_OWNER role + product:create authority.
   */
  createProduct(payload: CreateProductRequest): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.apiUrl}/`, payload, {
      withCredentials: true
    });
  }

  /**
   * Update a product. Requires SHOP_OWNER role + product:update_own authority.
   */
  updateProduct(productId: string, payload: CreateProductRequest): Observable<ApiResponse<unknown>> {
    return this.http.put<ApiResponse<unknown>>(`${this.apiUrl}/${productId}`, payload, {
      withCredentials: true
    });
  }

  /**
   * Delete a product. Requires SHOP_OWNER role + product:delete_own authority.
   */
  deleteProduct(productId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${productId}`, {
      withCredentials: true
    });
  }

  /**
   * Upload product images to MinIO via product-service.
   * `productId` is required server-side once a product exists; pass undefined
   * for the optimistic case where the FE wants a temporary upload.
   */
  uploadProductImages(files: File[], productId?: string): Observable<ApiResponse<ProductImagesUploadResponse>> {
    // BE expects the raw List<MultipartFile> body; we mirror that via FormData
    // and append every file under the same `files` key so Spring binds the
    // collection automatically.
    const form = new FormData();
    files.forEach(f => form.append('files', f));
    let params = new HttpParams();
    if (productId) {
      params = params.set('productId', productId);
    }
    return this.http.post<ApiResponse<ProductImagesUploadResponse>>(
      `${this.apiUrl}/img`,
      form,
      { params, withCredentials: true }
    );
  }

  /**
   * Parse images JSON string to array
   */
  parseImages(imagesJson: string): string[] {
    try {
      return JSON.parse(imagesJson);
    } catch {
      return [];
    }
  }

  /**
   * Get first image URL
   */
  getFirstImage(product: Product): string {
    const images = this.parseImages(product.images);
    return images.length > 0 ? images[0] : environment.placeholders.product;
  }

  /**
   * Format price for display
   */
  formatPrice(price: string): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(parseFloat(price));
  }

  /**
   * Check if product is in stock
   */
  isInStock(product: Product): boolean {
    return product.quantity > 0;
  }

  /**
   * Get stock status text
   */
  getStockStatus(product: Product): string {
    if (product.quantity === 0) return 'Hết hàng';
    if (product.quantity < 10) return `Chỉ còn ${product.quantity} sản phẩm`;
    return 'Còn hàng';
  }
}

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

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Shop {
  shopId: string;
  shopName: string;
  logo: string | null;
  introduction: string | null;
  totalProducts: number;
  totalSold: number;
}

/**
 * Mirrors {@code com.theblood.shopservice.dto.response.ShopDetailResponse}.
 *
 * <p>Returned by {@code GET /shop/{shopId}} (public) and {@code GET /shop/me}
 * (authenticated). The same DTO is reused so a shop owner sees their own
 * profile while customers see the public-facing version.</p>
 */
export interface ShopDetail {
  shopId: string;
  shopName: string;
  logo: string | null;
  introduction: string | null;
  shopAddress: string | null;
  city: string | null;
  province: string | null;
  /** Numeric on the wire (BigDecimal serialised as JSON number). */
  avgStar: number | null;
  totalFeedback: number | null;
  /** Free-form active hours string, e.g. "07:00 - 22:00". */
  activeHours: string | null;
  /** Distance in kilometres — server may not always populate this yet. */
  distance: number | null;
  totalProducts: number | null;
  totalSold: number | null;
  totalOrders: number | null;
  phoneNumber: string | null;
  email: string | null;
  shopStatus: string | null;
  isActive: number | null;
  shopType: string | null;
  businessType: string | null;
}

export interface ShopPage {
  content: Shop[];
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

@Injectable({
  providedIn: 'root'
})
export class ShopService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/shop`;

  /**
   * Get all shops with pagination
   */
  getAllShops(page: number = 0, size: number = 10): Observable<ApiResponse<ShopPage>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiResponse<ShopPage>>(`${this.apiUrl}/`, { params });
  }

  /**
   * Get featured shops (top 10 shops by total sold in last month)
   * 
   * @param page - Page number
   * @param size - Page size (default 10)
   * @returns Observable with featured shops
   */
  getFeaturedShops(page: number = 0, size: number = 10): Observable<ApiResponse<ShopPage>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ApiResponse<ShopPage>>(`${this.apiUrl}/featured`, { params });
  }

  /**
   * Get shop info (requires authentication)
   */
  getShopInfo(): Observable<ApiResponse<Shop>> {
    return this.http.get<ApiResponse<Shop>>(`${this.apiUrl}`);
  }

  /**
   * Public shop detail endpoint — used by the storefront's shop detail page
   * when a customer taps a shop card on the homepage.
   *
   * <p>Hits {@code GET /shop/{shopId}} which returns the
   * {@code ShopDetailResponse} payload shape (see {@link ShopDetail}).</p>
   *
   * @param shopId - Shop UUID from {@link Shop#shopId}
   */
  getShopDetail(shopId: string): Observable<ApiResponse<ShopDetail>> {
    return this.http.get<ApiResponse<ShopDetail>>(`${this.apiUrl}/${shopId}`);
  }

  /**
   * Format shop name for display (truncate if too long)
   */
  formatShopName(name: string, maxLength: number = 50): string {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + '...';
  }

  /**
   * Get default shop logo if not available
   */
  getShopLogo(shop: Shop): string {
    return shop.logo || environment.placeholders.shop;
  }
}

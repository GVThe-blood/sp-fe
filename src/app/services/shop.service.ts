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

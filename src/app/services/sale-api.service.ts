import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../environments/environment';

/**
 * Mirror of {@code com.theblood.productservice.service.dto.response.SaleResponse}.
 * Field set is intentionally narrow — the dedicated /sale page only needs to
 * render a card list with countdown + nav to product list. Add fields when the
 * BE response grows.
 */
export interface SaleResponse {
  id: string;
  name: string;
  description?: string | null;
  bannerImage?: string | null;
  /** Discount percentage (0..100) when sale uses flat percent rule. */
  discountPercent?: number | null;
  startTime: string; // ISO date-time
  endTime: string; // ISO date-time
  active?: boolean;
  productCount?: number;
}

/**
 * Mirror of {@code SaleProductResponse} — single product within a sale.
 */
export interface SaleProductResponse {
  productId: string;
  productName: string;
  image?: string | null;
  originalPrice: number;
  salePrice: number;
  discountPercent?: number | null;
}

interface ApiEnvelope<T> {
  appStatus?: number;
  code?: number;
  status?: number;
  message: string;
  data: T;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

/**
 * SaleApiService — gọi product-service `/api/v1/sales/**` qua API Gateway.
 *
 * BE controllers nằm trong {@code SaleResource.java}:
 * - {@code GET /sales}            — paginated list (admin / overview)
 * - {@code GET /sales/active}     — list active sales (homepage banner, /sale page)
 * - {@code GET /sales/{id}}       — chi tiết 1 sale
 * - {@code GET /sales/{id}/products} — danh sách product của sale
 */
@Injectable({ providedIn: 'root' })
export class SaleApiService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/sales`;

  /** Returns currently-active sales sorted by end-time ascending (server-side). */
  getActiveSales(): Observable<SaleResponse[]> {
    return this.http
      .get<ApiEnvelope<SaleResponse[] | PageResponse<SaleResponse>>>(`${this.base}/active`, {
        withCredentials: true,
      })
      .pipe(map((res) => normalizeList(res.data)));
  }

  /** Returns paginated sales (any state). */
  getAllSales(page = 0, size = 20): Observable<SaleResponse[]> {
    return this.http
      .get<ApiEnvelope<PageResponse<SaleResponse> | SaleResponse[]>>(this.base, {
        params: { page, size },
        withCredentials: true,
      })
      .pipe(map((res) => normalizeList(res.data)));
  }

  getSaleDetail(id: string): Observable<SaleResponse> {
    return this.http
      .get<ApiEnvelope<SaleResponse>>(`${this.base}/${encodeURIComponent(id)}`, {
        withCredentials: true,
      })
      .pipe(map((res) => res.data));
  }

  getSaleProducts(id: string, page = 0, size = 20): Observable<SaleProductResponse[]> {
    return this.http
      .get<ApiEnvelope<PageResponse<SaleProductResponse> | SaleProductResponse[]>>(
        `${this.base}/${encodeURIComponent(id)}/products`,
        { params: { page, size }, withCredentials: true },
      )
      .pipe(map((res) => normalizeList(res.data)));
  }
}

/**
 * BE đôi khi trả về Page (Spring Data) bọc trong {@code data}, đôi khi
 * trả thẳng list — đặc biệt trong /active. Adapter thống nhất về T[] để
 * UI khỏi phải care wire format.
 */
function normalizeList<T>(value: PageResponse<T> | T[] | null | undefined): T[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (Array.isArray((value as PageResponse<T>).content)) {
    return (value as PageResponse<T>).content;
  }
  return [];
}

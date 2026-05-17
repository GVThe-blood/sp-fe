import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

/**
 * Feedback type — mirrors backend enum
 * {@code com.theblood.productservice.common.enums.FeedbackType}.
 */
export type FeedbackType = 'PRODUCT_FEEDBACK' | 'SHOP_FEEDBACK';

/**
 * Wire shape of {@code FeedbackResponse} in product-service. Keep the
 * fields nullable because BE may omit some (e.g. shopId on a pure
 * product-feedback row).
 */
export interface FeedbackResponse {
  id?: string;
  userId?: string;
  shopId?: string | null;
  productId?: string | null;
  productVariantsId?: string | null;
  mediaFileId?: string | null;
  createdAt?: string | null;   // ISO datetime
  createdBy?: string | null;
  updatedAt?: string | null;
  updatedBy?: string | null;
  content?: string;
  rate?: number;               // 1..5
  feedbackType?: FeedbackType;
  feedbackTitle?: string | null;
}

/**
 * Body for {@code POST /feedback}. Only `productId`, `rating`, `content`
 * and `type` are required for the product detail review use-case.
 */
export interface CreateFeedbackRequest {
  productId: string;
  rating: number;
  content: string;
  type?: FeedbackType;
  shopId?: string;
  productVariantsId?: string;
  mediaFileId?: string;
  isShopReply?: boolean;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

interface ApiEnvelope<T> {
  appStatus?: number;
  code?: number;
  message: string;
  data: T;
}

interface DeleteFeedbackResponse {
  deleteCount: number;
  success: number;
  message: string;
}

/**
 * FeedbackService — calls product-service feedback endpoints via the API
 * gateway:
 *
 * <ul>
 *   <li>{@code GET /api/v1/feedback/product?productId=…&page=&size=}</li>
 *   <li>{@code GET /api/v1/feedback/shop?shopId=…&page=&size=}</li>
 *   <li>{@code POST /api/v1/feedback}</li>
 *   <li>{@code PUT /api/v1/feedback}</li>
 *   <li>{@code DELETE /api/v1/feedback}  (body: ["uuid1","uuid2"])</li>
 * </ul>
 *
 * GET endpoints are public (the gateway whitelists them per HTTP method).
 * Mutations require an authenticated session — the auth interceptor
 * forwards cookies automatically.
 */
@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/feedback`;

  /** List paginated feedback for a product. */
  listByProduct(
    productId: string,
    page: number = 0,
    size: number = 20
  ): Observable<ApiEnvelope<PageResponse<FeedbackResponse>>> {
    const params = new HttpParams()
      .set('productId', productId)
      .set('page', String(page))
      .set('size', String(size));
    return this.http.get<ApiEnvelope<PageResponse<FeedbackResponse>>>(this.base + '/product', {
      params,
      withCredentials: true
    });
  }

  /** List paginated feedback for a shop. */
  listByShop(
    shopId: string,
    page: number = 0,
    size: number = 20
  ): Observable<ApiEnvelope<PageResponse<FeedbackResponse>>> {
    const params = new HttpParams()
      .set('shopId', shopId)
      .set('page', String(page))
      .set('size', String(size));
    return this.http.get<ApiEnvelope<PageResponse<FeedbackResponse>>>(this.base + '/shop', {
      params,
      withCredentials: true
    });
  }

  /** Create a new feedback for the current user. */
  create(payload: CreateFeedbackRequest): Observable<ApiEnvelope<FeedbackResponse>> {
    return this.http.post<ApiEnvelope<FeedbackResponse>>(this.base, payload, {
      withCredentials: true
    });
  }

  /**
   * Update an existing feedback. NOTE: the legacy BE contract reuses the
   * same {@code FeedbackRequest} body and resolves the row through
   * {@code productId} — which is also the feedback id in current code.
   * Pass the feedback row id in the {@code productId} field to avoid
   * accidentally creating a new row.
   */
  update(payload: CreateFeedbackRequest): Observable<ApiEnvelope<FeedbackResponse>> {
    return this.http.put<ApiEnvelope<FeedbackResponse>>(this.base, payload, {
      withCredentials: true
    });
  }

  /** Soft-delete one or more feedback rows owned by the current user. */
  delete(ids: string[]): Observable<ApiEnvelope<DeleteFeedbackResponse>> {
    return this.http.request<ApiEnvelope<DeleteFeedbackResponse>>('DELETE', this.base, {
      body: ids,
      withCredentials: true
    });
  }
}

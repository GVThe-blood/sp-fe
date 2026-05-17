import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Wire types — phải khớp shape JSON BE trả ra.
 */

export interface AdminCategoryView {
  /** PK = name (string). */
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  /** UUID string của shop sở hữu, null = system-wide category. */
  shopId: string | null;
  parentName: string | null;
  categoryGroupCode: string | null;
}

export interface AdminCategoryUpsert {
  name: string;
  slug: string;
  description?: string;
  parentName?: string;
  categoryGroupCode?: string;
  /** Để null/empty để biến thành system category. */
  shopId?: string | null;
}

interface ApiResponse<T> {
  appStatus?: number;
  code?: number;
  message: string;
  data: T;
}

interface RawCategory {
  name?: string;
  categoryName?: string;
  slug?: string;
  description?: string | null;
  active?: boolean;
  isActive?: boolean;
  shopId?: string | null;
  parent?: { name?: string } | null;
  parentCategories?: { name?: string } | null;
  parentName?: string | null;
  categoryGroupCode?: string | null;
}

function normalize(raw: RawCategory): AdminCategoryView {
  return {
    name: raw.name ?? raw.categoryName ?? '',
    slug: raw.slug ?? '',
    description: raw.description ?? null,
    isActive: raw.isActive ?? raw.active ?? true,
    shopId: raw.shopId ?? null,
    parentName: raw.parentName ?? raw.parent?.name ?? raw.parentCategories?.name ?? null,
    categoryGroupCode: raw.categoryGroupCode ?? null,
  };
}

/**
 * HTTP client cho `/api/v1/categories/admin/**`. Backend tự enforce
 * `@PreAuthorize("hasRole('ADMIN')")`; FE chỉ cần đảm bảo `withCredentials`.
 */
@Injectable({ providedIn: 'root' })
export class AdminCategoryService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/categories/admin`;

  list(): Observable<AdminCategoryView[]> {
    return this.http
      .get<ApiResponse<RawCategory[]>>(this.base, { withCredentials: true })
      .pipe(map((r) => (r.data ?? []).map(normalize)));
  }

  create(payload: AdminCategoryUpsert): Observable<AdminCategoryView> {
    return this.http
      .post<ApiResponse<RawCategory>>(this.base, payload, { withCredentials: true })
      .pipe(map((r) => normalize(r.data)));
  }

  update(name: string, payload: AdminCategoryUpsert): Observable<AdminCategoryView> {
    return this.http
      .put<ApiResponse<RawCategory>>(`${this.base}/${encodeURIComponent(name)}`, payload, {
        withCredentials: true,
      })
      .pipe(map((r) => normalize(r.data)));
  }

  setActive(name: string, active: boolean): Observable<AdminCategoryView> {
    return this.http
      .patch<ApiResponse<RawCategory>>(
        `${this.base}/${encodeURIComponent(name)}/active?value=${active}`,
        {},
        { withCredentials: true },
      )
      .pipe(map((r) => normalize(r.data)));
  }

  remove(name: string): Observable<void> {
    return this.http
      .delete<void>(`${this.base}/${encodeURIComponent(name)}`, { withCredentials: true })
      .pipe(map(() => undefined));
  }
}

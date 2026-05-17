import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Category projection mirroring the BE {@code Categories} entity. The
 * {@code shopId} is {@code null} for system-wide categories shared by every
 * shop.
 */
export interface CategoryView {
  /** Category PK = name. */
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  shopId: string | null;
  parentName: string | null;
  categoryGroupCode: string | null;
}

export interface CategoryUpsert {
  name: string;
  slug: string;
  description?: string;
  parentName?: string;
  categoryGroupCode?: string;
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
  active?: boolean;        // Lombok bool getter
  isActive?: boolean;
  shopId?: string | null;
  parent?: { name?: string } | null;
  parentCategories?: { name?: string } | null;
  parentName?: string | null;
  categoryGroupCode?: string | null;
}

function normalize(raw: RawCategory): CategoryView {
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

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/categories`;

  /** Public — system-wide categories used by storefront catalogues. */
  listSystem(): Observable<CategoryView[]> {
    return this.http
      .get<ApiResponse<RawCategory[]>>(this.base, { withCredentials: true })
      .pipe(map((r) => (r.data ?? []).map(normalize)));
  }

  /**
   * Categories the signed-in shop owner can attach to their products: system
   * categories + categories owned by their shop.
   */
  listVisible(): Observable<CategoryView[]> {
    return this.http
      .get<ApiResponse<RawCategory[]>>(`${this.base}/visible`, { withCredentials: true })
      .pipe(map((r) => (r.data ?? []).map(normalize)));
  }

  /** Categories owned by the signed-in shop only — used by the management page. */
  listMine(): Observable<CategoryView[]> {
    return this.http
      .get<ApiResponse<RawCategory[]>>(`${this.base}/me`, { withCredentials: true })
      .pipe(map((r) => (r.data ?? []).map(normalize)));
  }

  create(payload: CategoryUpsert): Observable<CategoryView> {
    return this.http
      .post<ApiResponse<RawCategory>>(`${this.base}/me`, payload, { withCredentials: true })
      .pipe(map((r) => normalize(r.data)));
  }

  update(name: string, payload: CategoryUpsert): Observable<CategoryView> {
    return this.http
      .put<ApiResponse<RawCategory>>(`${this.base}/me/${encodeURIComponent(name)}`, payload, {
        withCredentials: true,
      })
      .pipe(map((r) => normalize(r.data)));
  }

  remove(name: string): Observable<void> {
    return this.http
      .delete<void>(`${this.base}/me/${encodeURIComponent(name)}`, { withCredentials: true })
      .pipe(map(() => undefined));
  }
}

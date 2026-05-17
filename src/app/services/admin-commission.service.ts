import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export type CommissionType = 'PERCENTAGE' | 'FLAT' | 'HYBRID';

export interface CommissionConfig {
  configId: string;
  name: string;
  description: string | null;
  commissionType: CommissionType;
  percentRate: number | null;
  flatAmount: number | null;
  minCommission: number | null;
  maxCommission: number | null;
  isActive: boolean;
  effectiveFrom: string;
  effectiveTo: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  currentlyEffective: boolean;
}

export interface CommissionConfigRequest {
  name: string;
  description?: string | null;
  commissionType: CommissionType;
  percentRate?: number | null;
  flatAmount?: number | null;
  minCommission?: number | null;
  maxCommission?: number | null;
  isActive?: boolean;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
}

interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

/**
 * Service gọi `/shop/admin/commission-configs/**`. Tương ứng với
 * {@code AdminCommissionConfigController} ở BE.
 */
@Injectable({ providedIn: 'root' })
export class AdminCommissionService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/shop/admin/commission-configs`;

  list(): Observable<CommissionConfig[]> {
    return this.http
      .get<ApiResponse<CommissionConfig[]>>(this.base, { withCredentials: true })
      .pipe(map((r) => r.data ?? []));
  }

  getActive(): Observable<CommissionConfig | null> {
    return this.http
      .get<ApiResponse<CommissionConfig | null>>(`${this.base}/active`, { withCredentials: true })
      .pipe(map((r) => r.data ?? null));
  }

  get(id: string): Observable<CommissionConfig> {
    return this.http
      .get<ApiResponse<CommissionConfig>>(`${this.base}/${id}`, { withCredentials: true })
      .pipe(map((r) => r.data));
  }

  create(body: CommissionConfigRequest): Observable<CommissionConfig> {
    return this.http
      .post<ApiResponse<CommissionConfig>>(this.base, body, { withCredentials: true })
      .pipe(map((r) => r.data));
  }

  update(id: string, body: CommissionConfigRequest): Observable<CommissionConfig> {
    return this.http
      .put<ApiResponse<CommissionConfig>>(`${this.base}/${id}`, body, { withCredentials: true })
      .pipe(map((r) => r.data));
  }

  activate(id: string): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(`${this.base}/${id}/activate`, {}, { withCredentials: true })
      .pipe(map(() => void 0));
  }

  deactivate(id: string): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(`${this.base}/${id}/deactivate`, {}, { withCredentials: true })
      .pipe(map(() => void 0));
  }

  delete(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.base}/${id}`, { withCredentials: true })
      .pipe(map(() => void 0));
  }
}

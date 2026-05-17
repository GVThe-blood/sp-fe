import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export type UserStatusValue = 'ACTIVE' | 'INACTIVE' | 'BANNED' | 'DELETED';
export type UserRoleValue = 'ADMIN' | 'CUSTOMER' | 'SHOP_OWNER' | 'STAFF';

export interface AdminUserRow {
  userId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  gender: string | null;
  status: UserStatusValue | string;
  phoneVerified: boolean;
  emailVerified: boolean;
  deleted: boolean;
  roles: string[];
  totalOrders: number;
  totalSpent: number;
  hasShop: boolean;
  ownedShopId: string | null;
  bannedReason: string | null;
  bannedAt: string | null;
  bannedBy: string | null;
  lastLoginAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AdminUserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  bannedUsers: number;
  customers: number;
  shopOwners: number;
  staff: number;
  admins: number;
  newUsersLast30: number;
  verifiedUsers: number;
}

export interface AdminUserListPage {
  items: AdminUserRow[];
  totalItems: number;
  totalPages: number;
  page: number;
  pageSize: number;
}

interface ApiResponse<T> {
  appStatus?: number;
  code?: number;
  message: string;
  data: T;
}

interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/user/admin`;

  getStats(): Observable<AdminUserStats> {
    return this.http
      .get<ApiResponse<AdminUserStats>>(`${this.base}/stats`, { withCredentials: true })
      .pipe(map((r) => r.data));
  }

  list(params: {
    status?: 'all' | UserStatusValue;
    role?: 'all' | UserRoleValue;
    search?: string;
    page?: number;
    size?: number;
  } = {}): Observable<AdminUserListPage> {
    let p = new HttpParams();
    if (params.status && params.status !== 'all') p = p.set('status', params.status);
    if (params.role && params.role !== 'all') p = p.set('role', params.role);
    if (params.search?.trim()) p = p.set('search', params.search.trim());
    p = p.set('page', String(params.page ?? 0));
    p = p.set('size', String(params.size ?? 20));
    return this.http
      .get<ApiResponse<SpringPage<AdminUserRow>>>(this.base, { params: p, withCredentials: true })
      .pipe(
        map((r) => ({
          items: r.data?.content ?? [],
          totalItems: r.data?.totalElements ?? 0,
          totalPages: r.data?.totalPages ?? 0,
          page: r.data?.number ?? 0,
          pageSize: r.data?.size ?? 20,
        })),
      );
  }

  get(userId: string): Observable<AdminUserRow> {
    return this.http
      .get<ApiResponse<AdminUserRow>>(`${this.base}/${userId}`, { withCredentials: true })
      .pipe(map((r) => r.data));
  }

  changeStatus(userId: string, value: UserStatusValue): Observable<AdminUserRow> {
    return this.http
      .patch<ApiResponse<AdminUserRow>>(
        `${this.base}/${userId}/status?value=${value}`,
        {},
        { withCredentials: true },
      )
      .pipe(map((r) => r.data));
  }

  ban(userId: string, reason: string): Observable<AdminUserRow> {
    return this.http
      .post<ApiResponse<AdminUserRow>>(
        `${this.base}/${userId}/ban`,
        { reason },
        { withCredentials: true },
      )
      .pipe(map((r) => r.data));
  }

  unban(userId: string): Observable<AdminUserRow> {
    return this.http
      .post<ApiResponse<AdminUserRow>>(
        `${this.base}/${userId}/unban`,
        {},
        { withCredentials: true },
      )
      .pipe(map((r) => r.data));
  }

  assignRole(userId: string, role: UserRoleValue): Observable<AdminUserRow> {
    return this.http
      .post<ApiResponse<AdminUserRow>>(
        `${this.base}/${userId}/roles`,
        { role },
        { withCredentials: true },
      )
      .pipe(map((r) => r.data));
  }

  revokeRole(userId: string, role: UserRoleValue): Observable<AdminUserRow> {
    return this.http
      .delete<ApiResponse<AdminUserRow>>(
        `${this.base}/${userId}/roles/${role}`,
        { withCredentials: true },
      )
      .pipe(map((r) => r.data));
  }

  remove(userId: string): Observable<void> {
    return this.http
      .delete<void>(`${this.base}/${userId}`, { withCredentials: true })
      .pipe(map(() => undefined));
  }
}

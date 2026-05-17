import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, share, tap, throwError } from 'rxjs';

import { environment } from '../../environments/environment';

/**
 * Map 1-1 với `UserDetail` ở BE (authentication-service).
 * Endpoint `GET /api/v1/user/profile`.
 */
export interface UserProfileResponse {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;       // legacy single-string field, sẽ thay bằng /profile/addr
  avatar: string;
  dob: string;           // ISO date (yyyy-MM-dd)
}

/**
 * Body cho `PUT /user/profile`. Map 1-1 với BE `UserRequest`.
 *
 * Lưu ý: BE field `password` là @NotBlank — khi update profile mà không đổi
 * password, FE phải gửi password "dummy" hoặc BE cần loosen validation.
 * Hiện tại FE gửi bất kỳ chuỗi pass-validation nào (tạm thời) — không thay đổi pwd.
 *
 * TODO BE: tách `UserRequest` thành `UserUpdateRequest` (no password) và
 * `UserCreateRequest` (full) để bỏ workaround.
 */
export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  email: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  phone: string;
  address?: string;
}

/**
 * Map 1-1 với BE `AddressDetail` mới (phase 2).
 * Endpoint `GET /api/v1/profile/addr/`.
 */
export interface AddressDetailResponse {
  id: string;
  label?: string;
  recipientName: string;
  phoneNumber: string;
  streetAddress: string;
  ward: string;
  district: string;
  city: string;
  details?: string;
  isDefault: boolean;
}

/**
 * Body cho POST/PUT `/profile/addr` và `/profile/addr/{id}`.
 * Match BE `AddressRequest`.
 */
export interface AddressUpsertRequest {
  label?: string;
  recipientName: string;
  phoneNumber: string;
  streetAddress: string;
  ward: string;
  district: string;
  city: string;
  details?: string;
  isDefault?: boolean;
}

interface ApiEnvelope<T> {
  appStatus?: number;
  status?: number;
  message: string;
  data: T;
}

/**
 * ProfileApiService — Gọi authentication-service cho user profile + address.
 *
 * Cache profile + addresses vào signal để header và profile page share.
 */
@Injectable({ providedIn: 'root' })
export class ProfileApiService {
  private http = inject(HttpClient);

  private readonly USER_BASE = `${environment.apiUrl}/user`;
  private readonly ADDR_BASE = `${environment.apiUrl}/profile/addr`;

  // ============= State =============
  private _profile = signal<UserProfileResponse | null>(null);
  profile = this._profile.asReadonly();

  private _addresses = signal<AddressDetailResponse[]>([]);
  addresses = this._addresses.asReadonly();

  loading = signal(false);
  error = signal<string | null>(null);

  // ============= In-flight request dedup =============
  // Multiple effects/components fan-out and call loadProfile / loadAddresses
  // at near-identical times during boot (header, user.service, profile page).
  // Without dedup we fire 2-3 identical XHRs that compete for the browser's
  // 6-conn-per-host limit and stay "pending" longer than they need to. By
  // sharing a single in-flight observable per resource, we collapse them
  // into 1 network call.
  private profileInFlight$: Observable<UserProfileResponse> | null = null;
  private addressesInFlight$: Observable<AddressDetailResponse[]> | null = null;

  // ============= Computed helpers =============
  avatarUrl = computed(() => this._profile()?.avatar ?? null);
  fullName = computed(() => {
    const p = this._profile();
    if (!p) return '';
    return `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim();
  });

  /** Addresses sắp xếp default lên đầu. */
  sortedAddresses = computed(() =>
    [...this._addresses()].sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return 0;
    })
  );

  defaultAddress = computed(() =>
    this._addresses().find(a => a.isDefault) ?? null
  );

  // ============= Profile =============

  /**
   * Load profile từ BE. Gọi khi login thành công hoặc khi vào /profile.
   *
   * Concurrent callers share the same in-flight HTTP call so that 3
   * different effects (header, user.service constructor, /profile page)
   * don't trigger 3 identical XHRs. Once the call resolves the cache is
   * populated and subsequent calls hit the network again only when the
   * caller explicitly wants fresh data.
   */
  loadProfile(): Observable<UserProfileResponse> {
    if (this.profileInFlight$) {
      return this.profileInFlight$;
    }

    this.loading.set(true);
    this.error.set(null);

    this.profileInFlight$ = this.http
      .get<ApiEnvelope<UserProfileResponse>>(`${this.USER_BASE}/profile`, {
        withCredentials: true
      })
      .pipe(
        map(res => res.data),
        tap(profile => this._profile.set(profile)),
        catchError(err => this.silentFail<UserProfileResponse>(err, 'Không tải được hồ sơ')),
        finalize(() => {
          this.loading.set(false);
          this.profileInFlight$ = null;
        }),
        share()
      );

    return this.profileInFlight$;
  }

  /** Cập nhật profile. Trả về `UserProfileResponse` đã update. */
  updateProfile(payload: UpdateProfileRequest): Observable<UserProfileResponse> {
    return this.http
      .put<ApiEnvelope<UserProfileResponse>>(`${this.USER_BASE}/profile`, payload, {
        withCredentials: true
      })
      .pipe(
        map(res => res.data),
        tap(profile => this._profile.set(profile)),
        catchError(err => this.failWithThrow<UserProfileResponse>(err, 'Cập nhật hồ sơ thất bại'))
      );
  }

  // ============= Addresses (full CRUD - phase 2) =============

  loadAddresses(): Observable<AddressDetailResponse[]> {
    if (this.addressesInFlight$) {
      return this.addressesInFlight$;
    }

    this.addressesInFlight$ = this.http
      .get<ApiEnvelope<AddressDetailResponse[]>>(`${this.ADDR_BASE}/`, {
        withCredentials: true
      })
      .pipe(
        map(res => res.data ?? []),
        tap(list => this._addresses.set(list)),
        catchError(err =>
          this.silentFail<AddressDetailResponse[]>(err, 'Không tải được địa chỉ')
        ),
        finalize(() => {
          this.addressesInFlight$ = null;
        }),
        share()
      );

    return this.addressesInFlight$;
  }

  createAddress(payload: AddressUpsertRequest): Observable<AddressDetailResponse> {
    return this.http
      .post<ApiEnvelope<AddressDetailResponse>>(this.ADDR_BASE, payload, {
        withCredentials: true
      })
      .pipe(
        map(res => res.data),
        tap(created => this.handleAddressMutation(created)),
        catchError(err =>
          this.failWithThrow<AddressDetailResponse>(err, 'Thêm địa chỉ thất bại')
        )
      );
  }

  updateAddress(
    addressId: string,
    payload: AddressUpsertRequest
  ): Observable<AddressDetailResponse> {
    return this.http
      .put<ApiEnvelope<AddressDetailResponse>>(
        `${this.ADDR_BASE}/${encodeURIComponent(addressId)}`,
        payload,
        { withCredentials: true }
      )
      .pipe(
        map(res => res.data),
        tap(updated => this.handleAddressMutation(updated)),
        catchError(err =>
          this.failWithThrow<AddressDetailResponse>(err, 'Cập nhật địa chỉ thất bại')
        )
      );
  }

  setDefaultAddress(addressId: string): Observable<AddressDetailResponse> {
    return this.http
      .patch<ApiEnvelope<AddressDetailResponse>>(
        `${this.ADDR_BASE}/${encodeURIComponent(addressId)}/default`,
        null,
        { withCredentials: true }
      )
      .pipe(
        map(res => res.data),
        tap(() => {
          // Sau khi set default → reload list để chắc chắn flag isDefault đồng bộ
          this.loadAddresses().subscribe({ error: () => {} });
        }),
        catchError(err =>
          this.failWithThrow<AddressDetailResponse>(err, 'Đặt mặc định thất bại')
        )
      );
  }

  /** Xoá nhiều địa chỉ theo list UUID. Body là `List<UUID>`. */
  deleteAddresses(addressIds: string[]): Observable<void> {
    return this.http
      .request<ApiEnvelope<void>>('DELETE', this.ADDR_BASE, {
        body: addressIds,
        withCredentials: true
      })
      .pipe(
        map(() => void 0 as void),
        tap(() => {
          // Remove khỏi cache local
          this._addresses.update(list =>
            list.filter(a => !addressIds.includes(a.id))
          );
        }),
        catchError(err => this.failWithThrow<void>(err, 'Xoá địa chỉ thất bại'))
      );
  }

  // ============= Reset / cache =============

  /** Reset cache khi user logout. */
  resetCache(): void {
    this._profile.set(null);
    this._addresses.set([]);
    this.loading.set(false);
    this.error.set(null);
  }

  // ============= Internal =============

  /**
   * Sau khi create/update, replace hoặc append vào cache. Nếu address mới
   * có isDefault=true thì unset cờ default ở các record khác (mirror BE logic).
   */
  private handleAddressMutation(record: AddressDetailResponse): void {
    this._addresses.update(list => {
      let next = list.some(a => a.id === record.id)
        ? list.map(a => (a.id === record.id ? record : a))
        : [...list, record];

      if (record.isDefault) {
        next = next.map(a =>
          a.id === record.id ? a : { ...a, isDefault: false }
        );
      }
      return next;
    });
  }

  private silentFail<T>(err: unknown, fallback: string): Observable<T> {
    const msg = this.extractErrorMessage(err) ?? fallback;
    this.error.set(msg);
    console.warn('[ProfileApiService]', msg, err);
    return throwError(() => err);
  }

  private failWithThrow<T>(err: unknown, fallback: string): Observable<T> {
    const msg = this.extractErrorMessage(err) ?? fallback;
    this.error.set(msg);
    console.error('[ProfileApiService]', msg, err);
    return throwError(() => err);
  }

  private extractErrorMessage(err: unknown): string | null {
    if (typeof err === 'object' && err !== null) {
      const e = err as { error?: { message?: string }; message?: string };
      return e.error?.message ?? e.message ?? null;
    }
    return null;
  }
}

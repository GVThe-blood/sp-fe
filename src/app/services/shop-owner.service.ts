import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  Injectable,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Observable, catchError, finalize, map, of, share } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Mirror of {@code com.theblood.shopservice.dto.response.ShopDetailResponse}.
 * Numeric fields are kept as plain {@code number} since Jackson serialises
 * BigDecimal as JSON numbers.
 */
export interface ShopDetail {
  shopId: string;
  shopName: string;
  logo: string | null;
  introduction: string | null;
  shopAddress: string | null;
  city: string | null;
  province: string | null;
  avgStar: number | null;
  totalFeedback: number | null;
  activeHours: string | null;
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

// ---------------------------------------------------------------------------
// Registration request DTOs — direct port of the Java records used by
// `/shop-registration/step-*` endpoints.
// ---------------------------------------------------------------------------

export interface IndividualKyc {
  idNumber: string;
  fullName: string;
  dateOfBirth: string; // ISO date
  gender?: string;
  permanentAddress?: string;
  issuedDate?: string;
  issuedPlace?: string;
  frontImageMediaId: string;
  backImageMediaId: string;
  selfieMediaId: string;
  nfcVerified?: boolean;
  nfcRawData?: string;
}

export interface BusinessDoc {
  companyName: string;
  businessRegNumber: string;
  licenseMediaId: string;
  companyAddress?: string;
}

export interface BankAccount {
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
}

export interface RegistrationStep1 {
  shopName: string;
  logoMediaId?: string;
  introduction?: string;
  shopType: 'INDIVIDUAL' | 'HOUSEHOLD' | 'COMPANY';
  businessType: string;
}

export interface RegistrationStep2 {
  requestId: string;
  shopType: 'INDIVIDUAL' | 'HOUSEHOLD' | 'COMPANY';
  kyc: IndividualKyc;
  businessDoc?: BusinessDoc;
}

export interface RegistrationStep3 {
  requestId: string;
  email: string;
  phoneNumber: string;
  shopAddress: string;
  city: string;
  province: string;
  postalCode?: string;
  nationId?: string;
  activeHours?: string;
}

export interface RegistrationStep4 {
  requestId: string;
  taxId?: string;
  bankAccount?: BankAccount;
}

export interface RegistrationStepResponse {
  requestId: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
}

/**
 * Mirror of {@code com.theblood.shopservice.dto.request.ShopUpdateRequest}
 * used by {@code PUT /shop/me}.
 *
 * <p>Tất cả field optional — chỉ những field non-undefined được gửi lên,
 * còn lại BE sẽ "leave alone". Empty string trên các field bắt buộc-khi-set
 * (shopName/email/phoneNumber/shopAddress/city/province/businessType) sẽ bị
 * BE bỏ qua để tránh accidental wipe khi user clear input rồi submit.</p>
 */
export interface ShopUpdatePayload {
  shopName?: string;
  logo?: string;
  introduction?: string;
  email?: string;
  phoneNumber?: string;
  shopAddress?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  nationId?: string;
  activeHours?: string;
  businessType?: string;
}

interface ApiResponse<T> {
  appStatus?: number;
  code?: number;
  message: string;
  data: T;
}

/**
 * Service responsible for everything related to the *current* user's shop:
 * checking ownership, fetching detail, and driving the multi-step registration
 * wizard.
 *
 * The service exposes signals so the UI can react declaratively:
 *  - {@link shop} — the resolved {@link ShopDetail} (or {@code null}).
 *  - {@link hasShop} — convenience boolean.
 *  - {@link loading}, {@link error} — request state.
 */
@Injectable({ providedIn: 'root' })
export class ShopOwnerService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/shop`;
  private readonly registrationBase = `${environment.apiUrl}/shop-registration`;

  // ---------------------------------------------------------------------
  // Reactive shop ownership state
  // ---------------------------------------------------------------------
  private _shop = signal<ShopDetail | null>(null);
  private _loading = signal(false);
  private _loaded = signal(false); // true after at least one resolved fetch
  private _error = signal<string | null>(null);

  readonly shop = this._shop.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly loaded = this._loaded.asReadonly();
  readonly error = this._error.asReadonly();

  /** True only when we've confirmed the user owns a shop. */
  readonly hasShop = computed(() => this._shop() !== null);

  // Dedup in-flight refresh so several effects calling refresh() at boot
  // collapse to a single network call.
  private refreshInFlight$: Observable<ShopDetail | null> | null = null;

  /**
   * Refresh the shop ownership state. Safe to call multiple times: concurrent
   * calls share the same in-flight request via the underlying HttpClient.
   *
   * Returns an Observable so callers can chain side-effects (e.g. routing).
   */
  refresh(): Observable<ShopDetail | null> {
    if (this.refreshInFlight$) {
      return this.refreshInFlight$;
    }

    this._loading.set(true);
    this._error.set(null);

    this.refreshInFlight$ = this.http
      .get<ShopDetail>(`${this.base}/me`, {
        withCredentials: true,
        observe: 'response',
      })
      .pipe(
        map((res) => {
          // BE returns 204 when the user has no shop yet. The Angular client
          // surfaces this as a successful response with a null body.
          const value = res.status === 204 ? null : res.body ?? null;
          this._shop.set(value);
          this._loaded.set(true);
          this._loading.set(false);
          return value;
        }),
        catchError((err: HttpErrorResponse) => {
          this._loading.set(false);
          this._loaded.set(true);
          if (err.status === 401 || err.status === 403) {
            this._error.set('Bạn cần đăng nhập để xem cửa hàng.');
          } else {
            this._error.set(err.error?.message ?? 'Không tải được thông tin cửa hàng.');
          }
          this._shop.set(null);
          return of(null);
        }),
        finalize(() => {
          this.refreshInFlight$ = null;
        }),
        share()
      );

    return this.refreshInFlight$;
  }

  /** Reset state, e.g. on logout. */
  clear(): void {
    this._shop.set(null);
    this._loaded.set(false);
    this._error.set(null);
    this._loading.set(false);
  }

  /**
   * Update mutable fields of the current shop via {@code PUT /shop/me}.
   *
   * <p>Sends only the fields the FE explicitly populated — null/undefined
   * values are stripped so the BE's "leave alone when null" semantics work.
   * On success the local {@link _shop} signal is patched in place so any
   * page consuming {@link shop} re-renders without a re-fetch.</p>
   *
   * <p>Required-when-set fields (name, email, phone, address, city, province,
   * businessType) are protected on BE: empty string passed in is treated as
   * "no change". Free-form fields (logo, intro, postalCode, nationId,
   * activeHours) accept empty string to clear.</p>
   */
  updateMyShop(payload: ShopUpdatePayload): Observable<ShopDetail> {
    // Strip undefined keys so the wire body matches the BE PATCH-style
    // semantics (null on a field would also work, but undefined leaves the
    // FE form free to omit untouched controls without producing nulls).
    const body: Record<string, unknown> = {};
    (Object.keys(payload) as Array<keyof ShopUpdatePayload>).forEach((k) => {
      const v = payload[k];
      if (v !== undefined) body[k as string] = v;
    });

    return this.http
      .put<ApiResponse<ShopDetail>>(`${this.base}/me`, body, {
        withCredentials: true,
      })
      .pipe(
        map((res) => {
          const updated = res.data;
          if (updated) {
            this._shop.set(updated);
          }
          return updated;
        })
      );
  }

  // ---------------------------------------------------------------------
  // Registration wizard — each step is independent and returns the
  // canonical {@code requestId} that subsequent steps must echo back.
  // ---------------------------------------------------------------------

  submitStep1(payload: RegistrationStep1): Observable<RegistrationStepResponse> {
    return this.http
      .post<ApiResponse<RegistrationStepResponse>>(`${this.registrationBase}/step-1`, payload, {
        withCredentials: true,
      })
      .pipe(map((r) => r.data));
  }

  submitStep2(payload: RegistrationStep2): Observable<RegistrationStepResponse> {
    return this.http
      .post<ApiResponse<RegistrationStepResponse>>(`${this.registrationBase}/step-2`, payload, {
        withCredentials: true,
      })
      .pipe(map((r) => r.data));
  }

  submitStep3(payload: RegistrationStep3): Observable<RegistrationStepResponse> {
    return this.http
      .post<ApiResponse<RegistrationStepResponse>>(`${this.registrationBase}/step-3`, payload, {
        withCredentials: true,
      })
      .pipe(map((r) => r.data));
  }

  submitStep4(payload: RegistrationStep4): Observable<RegistrationStepResponse> {
    return this.http
      .post<ApiResponse<RegistrationStepResponse>>(`${this.registrationBase}/step-4`, payload, {
        withCredentials: true,
      })
      .pipe(map((r) => r.data));
  }
}

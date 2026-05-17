import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { decodeJwt, extractRoles } from './jwt.util';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  email: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  phone?: string;
  address?: string;
}

export interface TokenResponse {
  userId: string;
  username: string;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface RegisterResponse {
  userId: string;
  username: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface ApiResponse<T> {
  appStatus: number;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  private readonly API_URL = `${environment.apiUrl}/auth`;
  private readonly USER_KEY = 'current_user';

  isAuthenticated = signal<boolean>(this.hasActiveSession());
  currentUser = signal<any>(this.getUserFromStorage());

  /**
   * Roles của user hiện tại — computed từ access token trong sessionStorage.
   * Empty khi chưa login hoặc token đã expire/được clear.
   *
   * Note: roles ở đây chỉ phục vụ UI gating (hide/show menu) — BE/gateway vẫn
   * là source-of-truth cho authorization. Đừng dựa vào claim này để gate
   * logic nhạy cảm.
   */
  readonly roles = signal<string[]>(this.computeRolesFromToken());

  /** Helper: đang login với role ADMIN? */
  readonly isAdmin = computed(() => this.roles().includes('ADMIN'));

  /** Helper: đang login với role SHOP_OWNER? */
  readonly isShopOwner = computed(() => this.roles().includes('SHOP_OWNER'));

  login(credentials: LoginRequest): Observable<ApiResponse<TokenResponse>> {
    return this.http.post<ApiResponse<TokenResponse>>(`${this.API_URL}/login`, credentials, {
      withCredentials: true
    }).pipe(
      tap(response => {
        if (response.appStatus === 200 && response.data) {
          this.handleAuthSuccess(response.data);
        }
      })
    );
  }

  register(userData: RegisterRequest): Observable<ApiResponse<RegisterResponse>> {
    return this.http.post<ApiResponse<RegisterResponse>>(`${this.API_URL}/register`, userData, {
      withCredentials: true
    }).pipe(
      tap(response => {
        if ((response.appStatus === 201 || response.appStatus === 200) && response.data) {
          this.handleAuthSuccess(response.data);
        }
      })
    );
  }

  logout(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.API_URL}/logout`, {
      withCredentials: true // Important: Send cookies with request
    }).pipe(
      tap(() => {
        // Success path: clear local state + navigate
        this.clearAuthData();
        this.router.navigate(['/']);
      }),
      catchError(error => {
        // Network/API fail: vẫn clear local state để tránh user kẹt ở trạng thái half-logged-in.
        // Backend blacklist token bị bỏ qua, nhưng AT/RT cookie hiện tại sẽ tự expire.
        console.warn('[Auth] Logout API failed, clearing local state anyway:', error);
        this.clearAuthData();
        this.router.navigate(['/']);
        return throwError(() => error);
      })
    );
  }

  /**
   * Gọi /auth/refresh dựa vào cookie HttpOnly.
   *
   * Backend (`AuthController.refreshToken`) đã được sửa để đọc REFRESH_TOKEN từ
   * cookie thay vì body, và Set-Cookie ACCESS_TOKEN mới sau khi refresh thành công.
   * FE không cần gửi gì trong body, chỉ cần `withCredentials: true`.
   */
  refreshToken(): Observable<ApiResponse<TokenResponse>> {
    return this.http.post<ApiResponse<TokenResponse>>(
      `${this.API_URL}/refresh`,
      {},
      { withCredentials: true }
    ).pipe(
      tap(response => {
        if (response?.data?.accessToken) {
          // Backend đã Set-Cookie mới cho ACCESS_TOKEN. FE cập nhật sessionStorage
          // để WebSocket dùng access token mới.
          sessionStorage.setItem('ACCESS_TOKEN', response.data.accessToken);
          this.updateUserInfo(response.data);
          this.roles.set(extractRoles(decodeJwt(response.data.accessToken)));
          this.isAuthenticated.set(true);
        }
      })
    );
  }

  private handleAuthSuccess(data: TokenResponse | RegisterResponse): void {
    // Backend đã set 2 cookie HttpOnly (ACCESS_TOKEN, REFRESH_TOKEN) qua Set-Cookie.
    // Browser tự gửi kèm mọi request có `withCredentials: true` (cùng origin qua dev proxy).
    //
    // FE chỉ giữ lại access token trong sessionStorage để cấp cho WebSocket — vì
    // STOMP/WS không tự attach cookie vào CONNECT frame, phải gắn header
    // `Authorization: Bearer ...` thủ công. KHÔNG dùng cho REST.
    //
    // sessionStorage thay localStorage: token tự bị xoá khi đóng tab → giảm rủi ro
    // XSS persistent so với localStorage.
    if (data.accessToken) {
      sessionStorage.setItem('ACCESS_TOKEN', data.accessToken);
      // Refresh roles signal ngay khi có token mới — điều khiển redirect post-login.
      this.roles.set(extractRoles(decodeJwt(data.accessToken)));
    }

    const user = {
      userId: data.userId,
      username: data.username,
      email: 'email' in data ? data.email : undefined
    };

    this.setUser(user);
    this.isAuthenticated.set(true);
    this.currentUser.set(user);

    console.log('[Auth] ✅ Auth success, userId:', user.userId);
  }

  private updateUserInfo(data: TokenResponse): void {
    const user = {
      userId: data.userId,
      username: data.username
    };
    this.setUser(user);
    this.currentUser.set(user);
  }

  private clearAuthData(): void {
    // Clear sessionStorage (chỉ FE biết — dùng cho WS) và user info
    sessionStorage.removeItem('ACCESS_TOKEN');
    localStorage.removeItem(this.USER_KEY);

    // Cookie ACCESS_TOKEN/REFRESH_TOKEN là HttpOnly → JS không xoá được.
    // BE logout endpoint trả Set-Cookie maxAge=0 để clear. Nếu logout API fail
    // (network down) cookie vẫn còn nhưng sẽ tự expire (15min/7d).
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
    this.roles.set([]);
  }

  /**
   * Public alias of {@link clearAuthData} — để các interceptor / guard có thể
   * reset state khi gặp 401 mà KHÔNG kéo theo `router.navigate('/')` của hàm
   * {@link logout}. Tránh việc 2 navigation song song (logout → '/' và
   * interceptor → '/login') gây flash trang.
   */
  clearLocalAuthState(): void {
    this.clearAuthData();
  }

  // Check session đã đăng nhập chưa: dựa vào USER_KEY trong localStorage.
  // KHÔNG decode JWT (cookie HttpOnly không đọc được) — đây chỉ là proxy "đã từng login".
  // Server vẫn là source of truth: 401 sẽ trigger refresh.
  private hasActiveSession(): boolean {
    return !!localStorage.getItem(this.USER_KEY);
  }

  /**
   * Lấy access token để cấp cho client KHÔNG tự kèm cookie (vd: WebSocket STOMP CONNECT).
   * KHÔNG dùng cho HTTP REST — request HTTP đã có cookie HttpOnly tự đính kèm.
   *
   * Token được lưu sessionStorage (xóa khi đóng tab). Có thể null khi:
   *   - User chưa login
   *   - Tab vừa mở (cookie còn nhưng sessionStorage rỗng) → cần gọi refresh
   *     hoặc reload page để re-set token sau login flow
   */
  getAccessToken(): string | null {
    return sessionStorage.getItem('ACCESS_TOKEN');
  }

  /** @deprecated Dùng `getAccessToken()` cho rõ nghĩa. */
  getCookie(name: string): string | null {
    return sessionStorage.getItem(name);
  }

  // User management
  private setUser(user: any): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private getUserFromStorage(): any {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Decode access token đang lưu trong sessionStorage để rút roles. Trả mảng
   * rỗng nếu không có token (vd vừa reload tab → cookie còn nhưng sessionStorage
   * mất). Khi đó các UI gate sẽ ẩn admin menu cho đến khi user login lại hoặc
   * refresh token chạy thành công.
   */
  private computeRolesFromToken(): string[] {
    const token = sessionStorage.getItem('ACCESS_TOKEN');
    return extractRoles(decodeJwt(token));
  }
}

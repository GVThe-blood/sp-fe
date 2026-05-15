import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

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

  isAuthenticated = signal<boolean>(this.hasAuthCookie());
  currentUser = signal<any>(this.getUserFromStorage());

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
        this.clearAuthData();
        this.router.navigate(['/']);
      })
    );
  }

  refreshToken(): Observable<ApiResponse<TokenResponse>> {
    return this.http.post<ApiResponse<TokenResponse>>(`${this.API_URL}/refresh`, {}, {
      withCredentials: true // Important: Send cookies with request
    }).pipe(
      tap(response => {
        if (response.data) {
          // Cookies are automatically updated by backend
          this.updateUserInfo(response.data);
        }
      })
    );
  }

  private handleAuthSuccess(data: TokenResponse | RegisterResponse): void {
    // Lưu token vào localStorage (cookie có thể bị reject nếu token quá dài)
    localStorage.setItem('ACCESS_TOKEN', data.accessToken);
    localStorage.setItem('REFRESH_TOKEN', data.refreshToken);
    
    // Cũng set cookie để backward compatible
    try {
      this.setCookie('ACCESS_TOKEN', data.accessToken, data.expiresIn / 1000);
      this.setCookie('REFRESH_TOKEN', data.refreshToken, 7 * 24 * 60 * 60);
    } catch (e) {
      console.warn('[Auth] Could not set cookie, using localStorage only');
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
    console.log('[Auth] Token stored in localStorage:', !!localStorage.getItem('ACCESS_TOKEN'));
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
    // Clear localStorage
    localStorage.removeItem('ACCESS_TOKEN');
    localStorage.removeItem('REFRESH_TOKEN');
    localStorage.removeItem(this.USER_KEY);
    
    // Clear cookies
    this.deleteCookie('ACCESS_TOKEN');
    this.deleteCookie('REFRESH_TOKEN');
    
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
  }

  // Check if auth token exists
  private hasAuthCookie(): boolean {
    return !!(localStorage.getItem('ACCESS_TOKEN') || 
      document.cookie.split(';').some(c => c.trim().startsWith('ACCESS_TOKEN=')));
  }

  // Get cookie value by name
  getCookie(name: string): string | null {
    // Thử localStorage trước (reliable hơn cookie cho JWT dài)
    const fromStorage = localStorage.getItem(name);
    if (fromStorage) return fromStorage;
    
    // Fallback: cookie
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
  }

  // Set cookie
  private setCookie(name: string, value: string, maxAgeSeconds: number): void {
    const expires = new Date();
    expires.setTime(expires.getTime() + maxAgeSeconds * 1000);
    document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  }

  // Delete cookie
  private deleteCookie(name: string): void {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }

  // User management
  private setUser(user: any): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private getUserFromStorage(): any {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }
}

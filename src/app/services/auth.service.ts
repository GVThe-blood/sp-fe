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
  code: number;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  private readonly API_URL = `${environment.apiUrl}/api/v1/auth`;
  private readonly USER_KEY = 'current_user';

  isAuthenticated = signal<boolean>(this.hasAuthCookie());
  currentUser = signal<any>(this.getUserFromStorage());

  login(credentials: LoginRequest): Observable<ApiResponse<TokenResponse>> {
    return this.http.post<ApiResponse<TokenResponse>>(`${this.API_URL}/login`, credentials, {
      withCredentials: true // Important: Send cookies with request
    }).pipe(
      tap(response => {
        if (response.code === 200 && response.data) {
          this.handleAuthSuccess(response.data);
        }
      })
    );
  }

  register(userData: RegisterRequest): Observable<ApiResponse<RegisterResponse>> {
    return this.http.post<ApiResponse<RegisterResponse>>(`${this.API_URL}/register`, userData, {
      withCredentials: true // Important: Send cookies with request
    }).pipe(
      tap(response => {
        if (response.code === 201 && response.data) {
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
    // Cookies are automatically set by backend via Set-Cookie header
    // We only need to store user info in localStorage
    const user = {
      userId: data.userId,
      username: data.username,
      email: 'email' in data ? data.email : undefined
    };
    
    this.setUser(user);
    this.isAuthenticated.set(true);
    this.currentUser.set(user);
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
    // Cookies are cleared by backend via Set-Cookie with maxAge=0
    // We only need to clear localStorage
    localStorage.removeItem(this.USER_KEY);
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
  }

  // Check if auth cookie exists (ACCESS_TOKEN)
  private hasAuthCookie(): boolean {
    return document.cookie.split(';').some(cookie => 
      cookie.trim().startsWith('ACCESS_TOKEN=')
    );
  }

  // Get cookie value by name
  getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
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

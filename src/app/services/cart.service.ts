import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of, Observable, BehaviorSubject, tap, catchError } from 'rxjs';
import { DeviceIdService } from './device-id.service';

export interface CartItem {
  id: number;
  name: string;
  options: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

export interface OrderDetails {
  storeName: string;
  deliveryAddress: string;
  notes: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
}

// Merge Cart interfaces (Requirements 3.2)
export interface MergeCartRequest {
  deviceId: string;
}

export interface MergeCartResponse {
  success: boolean;
  adjustedItems?: AdjustedItem[];
  message?: string;
}

export interface AdjustedItem {
  sku: string;
  name: string;
  requestedQuantity: number;
  adjustedQuantity: number;
  reason: string;
}

// API endpoint constants
export const CART_API_ENDPOINTS = {
  MERGE: '/api/v1/cart/merge',
  GET_CART: '/api/v1/cart'
};

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems$ = new BehaviorSubject<CartItem[]>([]);

  private mockOrder: OrderDetails = {
    storeName: 'Mỳ Cay Jeju - Tu Hoàng',
    deliveryAddress: 'Trung Tâm Pha Sơn Vi Tinh Quang Chinh, Quốc Lộ 32, P.Minh Khai, Q.Bắc Từ Liêm, Hà Nội',
    notes: 'Vd: Bác tài vui lòng gọi trước khi đến giao',
    items: [
      {
        id: 1,
        name: 'Mỳ kim chi hải sản',
        options: 'Cấp độ cay: Cấp 0',
        price: 68000,
        quantity: 1,
        imageUrl: 'https://i.imgur.com/rs23gCq.png'
      }
    ],
    subtotal: 68000,
    deliveryFee: 20000,
    discount: -25000,
    total: 63000
  };

  constructor(
    private http: HttpClient,
    private deviceIdService: DeviceIdService
  ) { }

  getOrderDetails(): Observable<OrderDetails> {
    return of(this.mockOrder);
  }

  /**
   * Lấy giỏ hàng hiện tại (guest hoặc user)
   * Requirements: 5.2
   */
  getCart(): Observable<CartItem[]> {
    return this.http.get<CartItem[]>(CART_API_ENDPOINTS.GET_CART).pipe(
      tap(items => this.cartItems$.next(items)),
      catchError(error => {
        console.error('Error fetching cart:', error);
        return of([]);
      })
    );
  }

  /**
   * Hợp nhất giỏ hàng guest vào user cart
   * Requirements: 3.2, 3.3
   */
  mergeGuestCart(): Observable<MergeCartResponse> {
    const deviceId = this.deviceIdService.getDeviceId();
    const request: MergeCartRequest = { deviceId };

    return this.http.post<MergeCartResponse>(CART_API_ENDPOINTS.MERGE, request).pipe(
      tap(response => {
        if (response.success) {
          // Refresh cart state after successful merge (Requirement 3.3)
          this.getCart().subscribe();
        }
      }),
      catchError(error => {
        console.error('Error merging cart:', error);
        // Return a failed response but don't throw to allow login flow to continue
        return of({ success: false, message: 'Không thể hợp nhất giỏ hàng' });
      })
    );
  }

  /**
   * Xóa local cart state (khi logout)
   * Device ID is NOT deleted from LocalStorage (Requirement 5.3)
   */
  clearLocalCart(): void {
    this.cartItems$.next([]);
  }

  /**
   * Get cart items as observable
   */
  getCartItems(): Observable<CartItem[]> {
    return this.cartItems$.asObservable();
  }
}

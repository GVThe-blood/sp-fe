import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  Observable,
  catchError,
  filter,
  switchMap,
  take,
  throwError
} from 'rxjs';
import { BehaviorSubject } from 'rxjs';

import { AuthService } from '../services/auth.service';

/**
 * Single-flight refresh state. Khi 1 request hit 401, ta gọi /auth/refresh đúng
 * 1 lần và queue các request đồng thời (concurrency) chờ kết quả.
 *
 * - `isRefreshing`: cờ "đang chạy refresh"
 * - `refreshTrigger$`: phát tín hiệu khi refresh xong → các request queued retry
 *   - emit `true` = thành công
 *   - emit `false` = thất bại (hoặc error)
 *
 * Note: state này nằm ở module-level vì chỉ có 1 luồng refresh chung cho toàn
 * app. Đừng đặt trong factory function vì `HttpInterceptorFn` được tạo lại cho
 * mỗi DI scope; ta cần chia sẻ state giữa các invocation.
 */
let isRefreshing = false;
const refreshTrigger$ = new BehaviorSubject<boolean | null>(null);

/**
 * Reset single-flight state. Gọi sau mỗi luồng refresh để đảm bảo lần 401 sau
 * đó không thấy `isRefreshing === true` còn sót lại.
 */
const finishRefresh = (success: boolean) => {
  isRefreshing = false;
  refreshTrigger$.next(success);
};

/**
 * Endpoint không bao giờ trigger refresh — vô nghĩa hoặc gây loop.
 */
const AUTH_BYPASS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

const isAuthEndpoint = (req: HttpRequest<unknown>): boolean =>
  AUTH_BYPASS.some(p => req.url.includes(p));

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Mọi request luôn kèm cookie. Cookie HttpOnly đã được browser quản lý — FE không
  // cần đụng tay.
  const cloned = req.clone({ withCredentials: true });

  return next(cloned).pipe(
    catchError((error: HttpErrorResponse) => {
      // Bỏ qua nếu không phải 401 hoặc là endpoint auth (login/refresh/logout).
      if (error.status !== 401 || isAuthEndpoint(req)) {
        return throwError(() => error);
      }

      // Nếu đang có refresh chạy → queue lại request, đợi tín hiệu.
      if (isRefreshing) {
        return refreshTrigger$.pipe(
          filter(v => v !== null),
          take(1),
          switchMap(success => {
            if (success) {
              return next(cloned);
            }
            return throwError(() => error);
          })
        );
      }

      // Là request đầu tiên hit 401 → khởi động refresh single-flight.
      isRefreshing = true;
      refreshTrigger$.next(null);

      return authService.refreshToken().pipe(
        switchMap(() => {
          finishRefresh(true);
          return next(cloned);
        }),
        catchError(refreshError => {
          finishRefresh(false);

          // Refresh fail thật sự → user hết phiên. Quan trọng: KHÔNG gọi
          // authService.logout() ở đây vì logout sẽ navigate('/') song song
          // với navigate('/login') bên dưới — 2 navigation chồng nhau gây
          // flash giữa hai trang ("cảm giác reload"). Thay vào đó clear
          // state local và để guard / login flow tự xử lý.
          authService.clearLocalAuthState();
          router.navigate(['/login'], {
            queryParams: { returnUrl: router.url }
          });
          return throwError(() => refreshError);
        })
      );
    })
  );
};

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Always include credentials (cookies) for API requests
  const clonedReq = req.clone({
    withCredentials: true
  });

  return next(clonedReq).pipe(
    catchError(error => {
      // Handle 401 Unauthorized - token expired
      if (error.status === 401 && !req.url.includes('/auth/login') && 
          !req.url.includes('/auth/register') && !req.url.includes('/auth/refresh')) {
        
        // Try to refresh token
        return authService.refreshToken().pipe(
          switchMap(() => {
            // Retry original request with updated cookies
            return next(clonedReq);
          }),
          catchError(refreshError => {
            // Refresh failed, logout user
            authService.logout().subscribe();
            router.navigate(['/login']);
            return throwError(() => refreshError);
          })
        );
      }
      
      return throwError(() => error);
    })
  );
};

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { HotToastService } from '@ngxpert/hot-toast';

import { AuthService } from '../services/auth.service';

/**
 * adminGuard — gate cho toàn bộ `/admin/**` routes.
 *
 * Hành vi:
 * - Chưa login → push về /login với returnUrl, kèm toast.
 * - Đã login nhưng không có role ADMIN → đẩy về home + toast warning.
 * - Có ROLE_ADMIN → cho qua.
 *
 * Lưu ý: gating ở FE chỉ là UX; BE/gateway vẫn enforce authorization. Nếu
 * user fake JWT để vượt qua guard này thì các API admin vẫn trả 403.
 */
export const adminGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(HotToastService);

  if (!auth.isAuthenticated()) {
    toast.warning('Vui lòng đăng nhập với tài khoản admin');
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url },
    });
    return false;
  }

  if (!auth.isAdmin()) {
    toast.error('Bạn không có quyền truy cập trang này');
    router.navigate(['/']);
    return false;
  }

  return true;
};

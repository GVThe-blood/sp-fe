import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { HotToastService } from '@ngxpert/hot-toast';

import { AuthService } from '../services/auth.service';

/**
 * authGuard — Function-based guard cho route bảo vệ.
 *
 * Nếu user chưa đăng nhập:
 *   - Hiển thị toast "Vui lòng đăng nhập"
 *   - Redirect /login với queryParam `returnUrl` = path đang cố truy cập
 *   - LoginComponent đọc returnUrl rồi navigate lại sau khi login thành công
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(HotToastService);

  if (auth.isAuthenticated()) {
    return true;
  }

  toast.warning('Vui lòng đăng nhập để tiếp tục');
  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url }
  });
  return false;
};

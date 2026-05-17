import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { HotToastService } from '@ngxpert/hot-toast';

import { AuthService } from '../services/auth.service';

/**
 * shopOwnerGuard — gate cho toàn bộ `/my-store/**` routes.
 *
 * Hành vi:
 * - Chưa login → đẩy về `/login` với queryParam `returnUrl`, kèm toast warning.
 * - Đã login nhưng không có role `SHOP_OWNER` → đẩy về home, toast error.
 * - Có role `SHOP_OWNER` → cho qua.
 *
 * <p>Tương tự {@code adminGuard}, FE gating chỉ phục vụ UX; backend/gateway vẫn
 * enforce authorization qua {@code @PreAuthorize("hasRole('SHOP_OWNER')")}. Nếu
 * client fake JWT để vượt qua guard này thì call API vẫn trả 403.</p>
 *
 * <p>Trước khi có guard này, tất cả route {@code /my-store*} chỉ check
 * {@code authGuard}. Hậu quả: customer login bình thường vẫn vào được khung
 * sườn rồi mới hứng 403 ở mọi call API — UX không tốt và để lộ layout shop
 * owner ra ngoài.</p>
 */
export const shopOwnerGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(HotToastService);

  if (!auth.isAuthenticated()) {
    toast.warning('Vui lòng đăng nhập với tài khoản chủ shop');
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url },
    });
    return false;
  }

  if (!auth.isShopOwner()) {
    toast.error('Bạn không có quyền truy cập khu vực quản trị shop');
    router.navigate(['/']);
    return false;
  }

  return true;
};

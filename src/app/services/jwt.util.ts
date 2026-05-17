/**
 * Lightweight JWT helpers — we only need to peek at claims on the client to
 * personalise the UI; the BE/gateway are still the source of truth for
 * authorisation.
 */

export interface JwtClaims {
  sub?: string;          // user UUID
  username?: string;
  sid?: string | null;   // shop UUID — `null` when the user has no shop
  type?: string;         // ACCESS | REFRESH | RESET
  /**
   * Mảng quyền do BE gắn vào token. Backend serialise từ
   * {@code SimpleGrantedAuthority} nên mỗi phần tử có shape
   * {@code { authority: "ROLE_ADMIN" }} hoặc {@code { authority: "product:read" }},
   * KHÔNG phải string. Một số token cũ có thể là string thuần — code phía dưới
   * hỗ trợ cả 2 dạng để an toàn.
   */
  permissions?: Array<string | { authority?: string }>;
  iss?: string;
  iat?: number;
  exp?: number;
}

/** Chuẩn hoá 1 phần tử trong `permissions` về string. */
function authorityOf(item: string | { authority?: string } | null | undefined): string | null {
  if (typeof item === 'string') return item;
  if (item && typeof item === 'object' && typeof item.authority === 'string') return item.authority;
  return null;
}

/**
 * Elevation roles ngầm gắn cho ADMIN. Frontend mirror logic của
 * gateway (`AuthenticationFilter.populateRequestWithHeaders`) để mọi
 * UI gate `isShopOwner()` / `isCustomer()` cũng cho admin qua mà không
 * phải sửa từng component.
 */
const ADMIN_ELEVATION_ROLES = ['SHOP_OWNER', 'CUSTOMER', 'STAFF'];

/** Tách roles (`ROLE_*`) khỏi permissions plain. */
export function extractRoles(claims: JwtClaims | null | undefined): string[] {
  if (!claims?.permissions?.length) return [];
  const out: string[] = [];
  for (const p of claims.permissions) {
    const auth = authorityOf(p);
    if (auth && auth.startsWith('ROLE_')) {
      out.push(auth.substring('ROLE_'.length));
    }
  }
  // ADMIN super-role: khi user có ROLE_ADMIN, ngầm gắn thêm các role thấp hơn
  // để mọi UI gate `auth.isShopOwner()` / `auth.isCustomer()` cũng pass.
  // Backend (gateway + @PreAuthorize) đã làm tương tự nên FE chỉ mirror UX.
  if (out.includes('ADMIN')) {
    for (const elevated of ADMIN_ELEVATION_ROLES) {
      if (!out.includes(elevated)) out.push(elevated);
    }
  }
  return out;
}

/** Tiện cho FE check `isAdmin()`. */
export function hasRole(claims: JwtClaims | null | undefined, role: string): boolean {
  return extractRoles(claims).includes(role);
}

/**
 * Decode the JWT payload without verifying the signature. Returns {@code null}
 * when the token is malformed.
 */
export function decodeJwt(token: string | null | undefined): JwtClaims | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    // base64url -> base64; pad to multiple of 4
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json) as JwtClaims;
  } catch {
    return null;
  }
}

/** True when the JWT advertises a non-empty `sid` claim. */
export function hasShopIdClaim(claims: JwtClaims | null | undefined): boolean {
  return !!claims?.sid && claims.sid !== 'null' && claims.sid.length > 0;
}

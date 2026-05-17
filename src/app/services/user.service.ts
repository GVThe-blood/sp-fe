import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';

import { Province, District, Ward } from './location.service';
import { AuthService } from './auth.service';
import { ShopOwnerService } from './shop-owner.service';
import {
  AddressDetailResponse,
  AddressUpsertRequest,
  ProfileApiService,
  UpdateProfileRequest,
} from './profile-api.service';

export interface Address {
  id: string;
  label?: string; // e.g., "Nhà", "Công ty"
  recipientName: string;
  phoneNumber: string;
  province: Province;
  district: District;
  ward: Ward;
  streetAddress: string; // Số nhà, tên đường
  isDefault: boolean;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  gender: string;
  phoneNumber: string;
  avatarUrl: string;
  joinDate: string;
  hasStore: boolean;
  addresses: Address[]; // Multiple addresses
  defaultAddressId?: string; // ID of default address
  /**
   * Legacy single-line address kept for backward compatibility with components
   * that haven't migrated to the new {@link addresses} list yet.
   */
  address?: {
    street: string;
    ward: string;
    district: string;
    city: string;
  };
}

const FALLBACK_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBgjZ9GwA2m2p3P5NE403dzCnqP20TuT0CYAJQgc_pm1OBq76QsQZRldqxKzi3908A36n-cMI1DQ4R_oBcfc6AdyZwLIGrIiA_WBe-rCgD-cHEG4cbCZUxGt7d4lrvrcs8qtLcrlYLMg0niB-fA7AhvrJ4CbOZ8Ny31XyejpmLXDpGsIzHOXpYuBjdNOIe_SUniWX_VYeP0wF1dYE6xL6kuFAxFpTSmxcOAkL2kdGiv-dV-oWWp4pyVhcNiy0Ledtbl6U-Wr4JOF2MB';

/**
 * Aggregates auth identity, BE profile, addresses and shop ownership into a
 * single {@link User} signal so components like {@code ProfileSidebar} can
 * consume one source.
 *
 * - Identity (`id`, `username`, `email`) comes from {@link AuthService}.
 * - Profile fields (`firstName`, `lastName`, `phone`, `avatar`, ...) come from
 *   {@link ProfileApiService} which calls `GET /api/v1/user/profile`.
 * - Addresses come from {@link ProfileApiService} which calls
 *   `GET /api/v1/profile/addr/`.
 * - Shop ownership comes from {@link ShopOwnerService}.
 *
 * Mutations (`addAddress`, `updateAddress`, …) delegate to the API service and
 * return Observables so callers can chain side-effects. Avatar is the only
 * field still kept locally because the BE has no avatar-upload endpoint yet.
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  private authService = inject(AuthService);
  private shopOwnerService = inject(ShopOwnerService);
  private profileApi = inject(ProfileApiService);

  /**
   * Local avatar override. Used until the BE exposes an avatar-upload endpoint.
   * Resets when the user logs out so the next user does not inherit it.
   */
  private avatarOverride = signal<string | null>(null);

  /**
   * Composite user signal — combines auth state, BE profile, addresses, and
   * shop ownership. Returns null while no auth user is present.
   */
  currentUser = computed<User | null>(() => {
    const authUser = this.authService.currentUser();
    if (!authUser) return null;

    const profile = this.profileApi.profile();
    const addresses = this.profileApi.addresses().map((a) => this.toLegacyAddress(a));
    const defaultAddr = addresses.find((a) => a.isDefault);

    return {
      id: profile?.id ?? authUser.userId ?? authUser.id ?? 'unknown',
      username: profile?.username ?? authUser.username ?? '',
      email: profile?.email ?? authUser.email ?? '',
      firstName: profile?.firstName ?? '',
      lastName: profile?.lastName ?? '',
      phoneNumber: profile?.phone ?? '',
      gender: '',
      avatarUrl: this.avatarOverride() ?? profile?.avatar ?? FALLBACK_AVATAR,
      joinDate: profile?.dob ?? '',
      hasStore: this.shopOwnerService.hasShop(),
      addresses,
      defaultAddressId: defaultAddr?.id,
      address: profile?.address
        ? {
            street: profile.address,
            ward: defaultAddr?.ward.name ?? '',
            district: defaultAddr?.district.name ?? '',
            city: defaultAddr?.province.name ?? '',
          }
        : undefined,
    };
  });

  constructor() {
    // Refresh shop ownership + profile + addresses whenever the user logs in / out.
    //
    // Guard `lastAuthState`: only react when `isAuthenticated()` actually
    // flips. Without it, any unrelated dependency change in the signal graph
    // can re-run this block. During bootstrap the auth signal may briefly
    // oscillate (localStorage probe → cookie validate → refresh-token), so
    // a debounce-by-equality is enough to prevent triple-fetching profile +
    // addresses on every page load. Header runs the same pattern.
    let lastAuthState: boolean | null = null;
    effect(() => {
      const authed = this.authService.isAuthenticated();
      if (authed === lastAuthState) return;
      lastAuthState = authed;

      if (authed) {
        this.shopOwnerService.refresh().subscribe();
        this.profileApi.loadProfile().subscribe({ error: () => {} });
        this.profileApi.loadAddresses().subscribe({ error: () => {} });
      } else {
        this.shopOwnerService.clear();
        this.profileApi.resetCache();
        this.avatarOverride.set(null);
      }
    });
  }

  // -------------------------------------------------------------------------
  // Profile mutations — delegate to ProfileApiService and return Observable
  // so callers can subscribe and react to errors.
  // -------------------------------------------------------------------------

  /**
   * Update profile via BE. The {@code avatarUrl} field is handled locally
   * (BE has no avatar-upload endpoint yet); all other fields are sent to
   * {@code PUT /api/v1/user/profile}.
   */
  updateUser(
    user: Partial<Omit<User, 'id' | 'username' | 'email' | 'hasStore'>>,
  ): Observable<User | null> {
    // Avatar-only updates are kept local until the BE supports uploads.
    if (user.avatarUrl !== undefined && Object.keys(user).length === 1) {
      this.avatarOverride.set(user.avatarUrl);
      return new Observable((subscriber) => {
        subscriber.next(this.currentUser());
        subscriber.complete();
      });
    }

    const profile = this.profileApi.profile();
    const authUser = this.authService.currentUser();
    const payload: UpdateProfileRequest = {
      firstName: user.firstName ?? profile?.firstName ?? '',
      lastName: user.lastName ?? profile?.lastName ?? '',
      username: profile?.username ?? authUser?.username ?? '',
      email: profile?.email ?? authUser?.email ?? '',
      phone: user.phoneNumber ?? profile?.phone ?? '',
      gender: this.normalizeGender(user.gender),
      address: profile?.address ?? '',
      // BE @NotBlank password validation — placeholder, password not changed here.
      // TODO BE: split UserRequest into UserUpdateRequest (no password) + UserCreateRequest.
      password: 'Placeholder@123',
    };

    if (user.avatarUrl !== undefined) {
      this.avatarOverride.set(user.avatarUrl);
    }

    return this.profileApi.updateProfile(payload).pipe(map(() => this.currentUser()));
  }

  // -------------------------------------------------------------------------
  // Address mutations — delegate to ProfileApiService.
  // -------------------------------------------------------------------------

  addAddress(address: Address): Observable<Address> {
    return this.profileApi
      .createAddress(this.toUpsertRequest(address))
      .pipe(map((created) => this.toLegacyAddress(created)));
  }

  updateAddress(id: string, addressUpdate: Partial<Address>): Observable<Address> {
    const current = this.profileApi.addresses().find((a) => a.id === id);
    if (!current) {
      throw new Error(`Address ${id} not found in cache`);
    }
    const merged: Address = {
      ...this.toLegacyAddress(current),
      ...addressUpdate,
      id,
    };
    return this.profileApi
      .updateAddress(id, this.toUpsertRequest(merged))
      .pipe(map((updated) => this.toLegacyAddress(updated)));
  }

  deleteAddress(id: string): Observable<void> {
    return this.profileApi.deleteAddresses([id]);
  }

  setDefaultAddress(id: string): Observable<Address> {
    return this.profileApi
      .setDefaultAddress(id)
      .pipe(map((updated) => this.toLegacyAddress(updated)));
  }

  /** Read-only helper: addresses sorted with default first. */
  getAddressesSorted(): Address[] {
    return this.profileApi.sortedAddresses().map((a) => this.toLegacyAddress(a));
  }

  /**
   * Legacy hook kept for backwards compatibility — refreshes shop ownership.
   * Prefer {@code ShopOwnerService.refresh()} in new code.
   */
  toggleStoreStatus(): void {
    this.shopOwnerService.refresh().subscribe();
  }

  // -------------------------------------------------------------------------
  // Adapters BE ↔ frontend shape
  // -------------------------------------------------------------------------

  /**
   * BE stores `district`, `ward`, `city` as flat strings. Frontend components
   * (address-card, address-form-modal) expect {@link Province}/{@link District}/
   * {@link Ward} objects. We use the name as both `code` and `name`. When the
   * user edits an address through the form modal they re-pick the value from
   * {@link LocationService}, and the upsert adapter strips it back to a string.
   */
  private toLegacyAddress(a: AddressDetailResponse): Address {
    return {
      id: a.id,
      label: a.label,
      recipientName: a.recipientName,
      phoneNumber: a.phoneNumber,
      streetAddress: a.streetAddress,
      isDefault: a.isDefault,
      province: { code: a.city, name: a.city },
      district: { code: a.district, name: a.district, provinceCode: a.city },
      ward: { code: a.ward, name: a.ward, districtCode: a.district },
    };
  }

  private toUpsertRequest(a: Address): AddressUpsertRequest {
    return {
      label: a.label,
      recipientName: a.recipientName,
      phoneNumber: a.phoneNumber,
      streetAddress: a.streetAddress,
      ward: a.ward.name,
      district: a.district.name,
      city: a.province.name,
      isDefault: a.isDefault,
    };
  }

  private normalizeGender(g: string | undefined | null): 'MALE' | 'FEMALE' | 'OTHER' {
    const upper = (g ?? '').toUpperCase();
    if (upper === 'FEMALE' || upper === 'NỮ' || upper === 'F') return 'FEMALE';
    if (upper === 'OTHER' || upper === 'KHÁC') return 'OTHER';
    return 'MALE';
  }
}

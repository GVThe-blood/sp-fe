import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HotToastService } from '@ngxpert/hot-toast';

import { UserService, Address } from '../../services/user.service';
import {
  AddressDetailResponse,
  AddressUpsertRequest,
  ProfileApiService,
  UpdateProfileRequest
} from '../../services/profile-api.service';
import { ProfileSidebarComponent } from '../../components/profile-sidebar/profile-sidebar.component';
import { AddressCardComponent } from '../../components/address-card/address-card.component';
import { AddressFormModalComponent } from '../../components/address-form-modal/address-form-modal.component';
import { AvatarPickerModalComponent } from '../../components/avatar-picker-modal/avatar-picker-modal.component';

interface ProfileFormState {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  phone: string;
  address?: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ProfileSidebarComponent,
    AddressCardComponent,
    AddressFormModalComponent,
    AvatarPickerModalComponent
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  private userService = inject(UserService);
  private profileApi = inject(ProfileApiService);
  private toast = inject(HotToastService);

  // Local user (composite signal: auth + mock profile + shop)
  user = this.userService.currentUser;

  // Real profile + addresses từ BE
  profile = this.profileApi.profile;
  profileLoading = this.profileApi.loading;

  /** Adapter BE → component shape mà address-card/form-modal expect. */
  sortedAddressesUI = computed<Address[]>(() =>
    this.profileApi.sortedAddresses().map(a => this.toLegacyAddress(a))
  );

  /** Hợp nhất profile cho header card. */
  displayProfile = computed(() => {
    const p = this.profile();
    const u = this.user();
    if (p) {
      return {
        firstName: p.firstName ?? '',
        lastName: p.lastName ?? '',
        username: p.username ?? '',
        email: p.email ?? '',
        gender: this.normalizeGender(u?.gender),
        phone: p.phone ?? '',
        avatar: p.avatar ?? u?.avatarUrl,
        address: p.address ?? ''
      };
    }
    if (!u) return null;
    return {
      firstName: u.firstName,
      lastName: u.lastName,
      username: u.username,
      email: u.email,
      gender: this.normalizeGender(u.gender),
      phone: u.phoneNumber,
      avatar: u.avatarUrl,
      address: ''
    };
  });

  // Edit form state
  isEditMode = signal(false);
  isSaving = signal(false);
  formState = signal<ProfileFormState>({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    gender: 'MALE',
    phone: '',
    address: ''
  });

  // Address modal state
  isAddressModalOpen = false;
  editingAddress: Address | undefined = undefined;
  loadingAddressId: string | null = null;

  // Avatar modal state
  isAvatarModalOpen = false;

  // -------------------------------------------------------------------------

  ngOnInit(): void {
    // UserService tự động loadProfile + loadAddresses qua effect khi authenticated.
    // Nếu vào trực tiếp /profile lúc cache còn rỗng (vd. hard reload), trigger
    // load thủ công để chắc chắn data có mặt cho first paint.
    if (!this.profile()) {
      this.profileApi.loadProfile().subscribe({ error: () => {} });
    }
    if (this.profileApi.addresses().length === 0) {
      this.profileApi.loadAddresses().subscribe({ error: () => {} });
    }
  }

  /** Alias kept để template cũ vẫn dùng `sortedAddresses`. */
  get sortedAddresses(): Address[] {
    return this.sortedAddressesUI();
  }

  // -------------------------------------------------------------------------
  // Profile edit
  // -------------------------------------------------------------------------

  startEdit(): void {
    const p = this.displayProfile();
    if (!p) return;
    this.formState.set({
      firstName: p.firstName,
      lastName: p.lastName,
      username: p.username,
      email: p.email,
      gender: p.gender,
      phone: p.phone,
      address: p.address
    });
    this.isEditMode.set(true);
  }

  cancelEdit(): void {
    this.isEditMode.set(false);
  }

  saveProfile(): void {
    const f = this.formState();
    if (!f.firstName.trim() || !f.lastName.trim() || !f.username.trim()) {
      this.toast.warning('Họ, tên và tên đăng nhập không được để trống');
      return;
    }

    const payload: UpdateProfileRequest = {
      firstName: f.firstName.trim(),
      lastName: f.lastName.trim(),
      username: f.username.trim(),
      email: f.email.trim(),
      gender: f.gender,
      phone: f.phone.trim(),
      address: f.address?.trim(),
      // BE @NotBlank password — placeholder, không đổi pwd thật
      password: 'Placeholder@123'
    };

    this.isSaving.set(true);
    this.profileApi.updateProfile(payload).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.isEditMode.set(false);
        this.toast.success('Cập nhật hồ sơ thành công');
      },
      error: () => {
        this.isSaving.set(false);
        this.toast.error('Cập nhật hồ sơ thất bại');
      }
    });
  }

  updateForm<K extends keyof ProfileFormState>(key: K, value: ProfileFormState[K]): void {
    this.formState.update(f => ({ ...f, [key]: value }));
  }

  private normalizeGender(g: string | undefined | null): 'MALE' | 'FEMALE' | 'OTHER' {
    const upper = (g ?? '').toUpperCase();
    if (upper === 'FEMALE' || upper === 'NỮ' || upper === 'F') return 'FEMALE';
    if (upper === 'OTHER' || upper === 'KHÁC') return 'OTHER';
    return 'MALE';
  }

  genderLabel(g: string): string {
    if (g === 'FEMALE') return 'Nữ';
    if (g === 'OTHER') return 'Khác';
    return 'Nam';
  }

  // -------------------------------------------------------------------------
  // Address (full BE CRUD - phase 2)
  // -------------------------------------------------------------------------

  openAddAddressModal(): void {
    this.editingAddress = undefined;
    this.isAddressModalOpen = true;
  }

  openEditAddressModal(address: Address): void {
    this.editingAddress = address;
    this.isAddressModalOpen = true;
  }

  closeAddressModal(): void {
    this.isAddressModalOpen = false;
    this.editingAddress = undefined;
  }

  onSaveAddress(address: Address): void {
    const payload = this.toUpsertRequest(address);
    const isUpdate = !!this.editingAddress && this.isUuid(this.editingAddress.id);

    this.loadingAddressId = address.id;
    const obs$ = isUpdate
      ? this.profileApi.updateAddress(this.editingAddress!.id, payload)
      : this.profileApi.createAddress(payload);

    obs$.subscribe({
      next: () => {
        this.toast.success(isUpdate ? 'Cập nhật địa chỉ thành công' : 'Thêm địa chỉ thành công');
        this.closeAddressModal();
        this.loadingAddressId = null;
      },
      error: () => {
        this.toast.error('Có lỗi xảy ra. Vui lòng thử lại.');
        this.loadingAddressId = null;
      }
    });
  }

  onSetDefaultAddress(address: Address): void {
    if (!this.isUuid(address.id)) {
      this.toast.warning('Địa chỉ chưa được lưu trên server');
      return;
    }
    this.loadingAddressId = address.id;
    this.profileApi.setDefaultAddress(address.id).subscribe({
      next: () => {
        this.toast.success('Đã đặt làm địa chỉ mặc định');
        this.loadingAddressId = null;
      },
      error: () => {
        this.toast.error('Không thể đặt địa chỉ mặc định');
        this.loadingAddressId = null;
      }
    });
  }

  onDeleteAddress(address: Address): void {
    const confirmed = confirm(
      `Bạn có chắc chắn muốn xóa địa chỉ này?\n\n${this.getAddressPreview(address)}`
    );
    if (!confirmed) return;

    if (!this.isUuid(address.id)) {
      this.toast.warning('Địa chỉ chưa được lưu trên server, không thể xoá');
      return;
    }

    this.loadingAddressId = address.id;
    this.profileApi.deleteAddresses([address.id]).subscribe({
      next: () => {
        this.toast.success('Xóa địa chỉ thành công');
        this.loadingAddressId = null;
      },
      error: () => {
        this.toast.error('Không thể xóa địa chỉ');
        this.loadingAddressId = null;
      }
    });
  }

  private getAddressPreview(address: Address): string {
    return `${address.recipientName}\n${address.phoneNumber}\n${address.streetAddress}, ${address.ward.name}, ${address.district.name}, ${address.province.name}`;
  }

  private isUuid(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  }

  // -------------------------------------------------------------------------
  // Adapters BE ↔ component shape
  // -------------------------------------------------------------------------

  /**
   * BE trả `district`, `ward`, `city` chỉ là string.
   * Component address-card expect object `{code, name}`.
   * Tao convert sang object với `code = name` để render OK; khi user edit
   * sẽ chọn lại từ LocationService và lúc submit ta convert lại sang string.
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
      ward: { code: a.ward, name: a.ward, districtCode: a.district }
    };
  }

  /**
   * Convert ngược lại từ form modal trả về → request body cho BE.
   */
  private toUpsertRequest(a: Address): AddressUpsertRequest {
    return {
      label: a.label,
      recipientName: a.recipientName,
      phoneNumber: a.phoneNumber,
      streetAddress: a.streetAddress,
      ward: a.ward.name,
      district: a.district.name,
      city: a.province.name,
      isDefault: a.isDefault
    };
  }

  // -------------------------------------------------------------------------
  // Avatar (giữ luồng cũ — local mock; BE upload file là phase sau)
  // -------------------------------------------------------------------------

  openAvatarPicker(): void {
    this.isAvatarModalOpen = true;
  }

  closeAvatarPicker(): void {
    this.isAvatarModalOpen = false;
  }

  onAvatarSelect(avatarUrl: string): void {
    this.userService.updateUser({ avatarUrl }).subscribe({
      next: () => {
        this.toast.success('Cập nhật avatar thành công (local)');
        this.closeAvatarPicker();
      },
      error: () => this.toast.error('Không thể cập nhật avatar. Vui lòng thử lại.')
    });
  }

  onAvatarUpload(file: File): void {
    const uploadToast = this.toast.loading('Đang tải lên avatar...');
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const avatarUrl = e.target?.result as string;
        this.userService.updateUser({ avatarUrl }).subscribe({
          next: () => {
            uploadToast.close();
            this.toast.success('Tải lên avatar thành công (local)');
          },
          error: () => {
            uploadToast.close();
            this.toast.error('Không thể tải lên avatar. Vui lòng thử lại.');
          }
        });
      };
      reader.onerror = () => {
        uploadToast.close();
        this.toast.error('Không thể đọc file. Vui lòng thử lại.');
      };
      reader.readAsDataURL(file);
      this.closeAvatarPicker();
    } catch (error) {
      uploadToast.close();
      this.toast.error('Không thể tải lên avatar. Vui lòng thử lại.');
    }
  }
}

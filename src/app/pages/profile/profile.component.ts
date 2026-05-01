import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HotToastService } from '@ngxpert/hot-toast';
import { UserService, Address } from '../../services/user.service';
import { ProfileSidebarComponent } from '../../components/profile-sidebar/profile-sidebar.component';
import { AddressCardComponent } from '../../components/address-card/address-card.component';
import { AddressFormModalComponent } from '../../components/address-form-modal/address-form-modal.component';
import { AvatarPickerModalComponent } from '../../components/avatar-picker-modal/avatar-picker-modal.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    ProfileSidebarComponent,
    AddressCardComponent,
    AddressFormModalComponent,
    AvatarPickerModalComponent
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  private userService = inject(UserService);
  private toast = inject(HotToastService);
  
  user = this.userService.currentUser;
  
  // Address management state
  isAddressModalOpen = false;
  editingAddress: Address | undefined = undefined;
  loadingAddressId: string | null = null;
  
  // Avatar management state
  isAvatarModalOpen = false;
  
  // Get sorted addresses (default first)
  get sortedAddresses(): Address[] {
    return this.userService.getAddressesSorted();
  }
  
  // Open modal to add new address
  openAddAddressModal(): void {
    this.editingAddress = undefined;
    this.isAddressModalOpen = true;
  }
  
  // Open modal to edit existing address
  openEditAddressModal(address: Address): void {
    this.editingAddress = address;
    this.isAddressModalOpen = true;
  }
  
  // Close address modal
  closeAddressModal(): void {
    this.isAddressModalOpen = false;
    this.editingAddress = undefined;
  }
  
  // Handle save from address modal
  onSaveAddress(address: Address): void {
    try {
      if (this.editingAddress) {
        // Update existing address
        this.userService.updateAddress(this.editingAddress.id, address);
        this.toast.success('Cập nhật địa chỉ thành công');
      } else {
        // Add new address
        this.userService.addAddress(address);
        this.toast.success('Thêm địa chỉ mới thành công');
      }
      this.closeAddressModal();
    } catch (error) {
      this.toast.error('Có lỗi xảy ra. Vui lòng thử lại.');
    }
  }
  
  // Set address as default
  onSetDefaultAddress(address: Address): void {
    this.loadingAddressId = address.id;
    // Simulate async operation
    setTimeout(() => {
      try {
        this.userService.setDefaultAddress(address.id);
        this.toast.success('Đã đặt làm địa chỉ mặc định');
      } catch (error) {
        this.toast.error('Không thể đặt địa chỉ mặc định. Vui lòng thử lại.');
      } finally {
        this.loadingAddressId = null;
      }
    }, 300);
  }
  
  // Delete address with confirmation
  onDeleteAddress(address: Address): void {
    const confirmed = confirm(
      `Bạn có chắc chắn muốn xóa địa chỉ này?\n\n${this.getAddressPreview(address)}`
    );
    
    if (confirmed) {
      this.loadingAddressId = address.id;
      // Simulate async operation
      setTimeout(() => {
        try {
          this.userService.deleteAddress(address.id);
          this.toast.success('Xóa địa chỉ thành công');
        } catch (error) {
          this.toast.error('Không thể xóa địa chỉ. Vui lòng thử lại.');
        } finally {
          this.loadingAddressId = null;
        }
      }, 300);
    }
  }
  
  // Helper to get address preview for confirmation
  private getAddressPreview(address: Address): string {
    return `${address.recipientName}\n${address.phoneNumber}\n${address.streetAddress}, ${address.ward.name}, ${address.district.name}, ${address.province.name}`;
  }
  
  // Open avatar picker modal
  openAvatarPicker(): void {
    this.isAvatarModalOpen = true;
  }
  
  // Close avatar picker modal
  closeAvatarPicker(): void {
    this.isAvatarModalOpen = false;
  }
  
  // Handle avatar selection from preset
  onAvatarSelect(avatarUrl: string): void {
    try {
      this.userService.updateUser({ avatarUrl });
      this.toast.success('Cập nhật avatar thành công');
      this.closeAvatarPicker();
    } catch (error) {
      this.toast.error('Không thể cập nhật avatar. Vui lòng thử lại.');
    }
  }
  
  // Handle avatar upload
  onAvatarUpload(file: File): void {
    const uploadToast = this.toast.loading('Đang tải lên avatar...');
    
    try {
      // In a real application, this would upload the file to a server
      // For now, we'll create a local URL for preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const avatarUrl = e.target?.result as string;
        this.userService.updateUser({ avatarUrl });
        uploadToast.close();
        this.toast.success('Tải lên avatar thành công');
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

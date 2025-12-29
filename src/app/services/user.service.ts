import { Injectable, signal } from '@angular/core';
import { Province, District, Ward } from './location.service';

export interface Address {
  id: string;
  label?: string;             // e.g., "Nhà", "Công ty"
  recipientName: string;
  phoneNumber: string;
  province: Province;
  district: District;
  ward: Ward;
  streetAddress: string;      // Số nhà, tên đường
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
  addresses: Address[];       // Multiple addresses
  defaultAddressId?: string;  // ID of default address
  address?: {                 // Keep for backward compatibility
    street: string;
    ward: string;
    district: string;
    city: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  // Mock user data
  private mockUser: User = {
    id: '1',
    firstName: 'An',
    lastName: 'Nguyen',
    username: 'annv',
    email: 'an.nguyen@example.com',
    gender: 'Male',
    phoneNumber: '+84 123 456 789',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgjZ9GwA2m2p3P5NE403dzCnqP20TuT0CYAJQgc_pm1OBq76QsQZRldqxKzi3908A36n-cMI1DQ4R_oBcfc6AdyZwLIGrIiA_WBe-rCgD-cHEG4cbCZUxGt7d4lrvrcs8qtLcrlYLMg0niB-fA7AhvrJ4CbOZ8Ny31XyejpmLXDpGsIzHOXpYuBjdNOIe_SUniWX_VYeP0wF1dYE6xL6kuFAxFpTSmxcOAkL2kdGiv-dV-oWWp4pyVhcNiy0Ledtbl6U-Wr4JOF2MB',
    joinDate: '2023',
    hasStore: false, // Default to false to test the "Open Store" view first
    addresses: [
      {
        id: 'addr-1',
        label: 'Nhà',
        recipientName: 'An Nguyen',
        phoneNumber: '+84 123 456 789',
        province: { code: 'HCM', name: 'TP. Hồ Chí Minh' },
        district: { code: 'HCM-Q1', name: 'Quận 1', provinceCode: 'HCM' },
        ward: { code: 'HCM-Q1-BN', name: 'Phường Bến Nghé', districtCode: 'HCM-Q1' },
        streetAddress: '123 Đường Lê Lợi',
        isDefault: true
      },
      {
        id: 'addr-2',
        label: 'Công ty',
        recipientName: 'An Nguyen',
        phoneNumber: '+84 987 654 321',
        province: { code: 'HCM', name: 'TP. Hồ Chí Minh' },
        district: { code: 'HCM-Q3', name: 'Quận 3', provinceCode: 'HCM' },
        ward: { code: 'HCM-Q3-P1', name: 'Phường 1', districtCode: 'HCM-Q3' },
        streetAddress: '456 Đường Võ Văn Tần',
        isDefault: false
      },
      {
        id: 'addr-3',
        recipientName: 'Nguyen Van An',
        phoneNumber: '+84 123 456 789',
        province: { code: 'HN', name: 'Hà Nội' },
        district: { code: 'HN-HK', name: 'Quận Hoàn Kiếm', provinceCode: 'HN' },
        ward: { code: 'HN-HK-HT', name: 'Phường Hàng Trống', districtCode: 'HN-HK' },
        streetAddress: '789 Phố Hàng Bài',
        isDefault: false
      }
    ],
    defaultAddressId: 'addr-1',
    address: {
      street: '123 Đường ABC',
      ward: 'Phường Bến Nghé',
      district: 'Quận 1',
      city: 'TP. Hồ Chí Minh'
    }
  };

  currentUser = signal<User | null>(this.mockUser);

  constructor() { }

  updateUser(user: Partial<User>) {
    this.currentUser.update(current => current ? { ...current, ...user } : null);
  }

  toggleStoreStatus() {
    this.currentUser.update(user => user ? { ...user, hasStore: !user.hasStore } : null);
  }

  /**
   * Add a new address to the user's address list
   */
  addAddress(address: Address): void {
    this.currentUser.update(user => {
      if (!user) return null;
      
      // If this is the first address or marked as default, set it as default
      const isFirstAddress = user.addresses.length === 0;
      const shouldBeDefault = isFirstAddress || address.isDefault;
      
      const newAddress = { ...address, isDefault: shouldBeDefault };
      
      // If setting as default, unset other defaults
      const updatedAddresses = shouldBeDefault
        ? user.addresses.map(addr => ({ ...addr, isDefault: false }))
        : user.addresses;
      
      return {
        ...user,
        addresses: [...updatedAddresses, newAddress],
        defaultAddressId: shouldBeDefault ? newAddress.id : user.defaultAddressId
      };
    });
  }

  /**
   * Update an existing address
   */
  updateAddress(id: string, addressUpdate: Partial<Address>): void {
    this.currentUser.update(user => {
      if (!user) return null;
      
      const updatedAddresses = user.addresses.map(addr => {
        if (addr.id !== id) {
          // If updating another address to be default, unset this one
          return addressUpdate.isDefault ? { ...addr, isDefault: false } : addr;
        }
        return { ...addr, ...addressUpdate };
      });
      
      const updatedAddress = updatedAddresses.find(addr => addr.id === id);
      const newDefaultId = updatedAddress?.isDefault ? id : user.defaultAddressId;
      
      return {
        ...user,
        addresses: updatedAddresses,
        defaultAddressId: newDefaultId
      };
    });
  }

  /**
   * Delete an address by ID
   */
  deleteAddress(id: string): void {
    this.currentUser.update(user => {
      if (!user) return null;
      
      const addressToDelete = user.addresses.find(addr => addr.id === id);
      const filteredAddresses = user.addresses.filter(addr => addr.id !== id);
      
      // If deleting the default address and there are other addresses, set the first one as default
      let newDefaultId = user.defaultAddressId;
      if (addressToDelete?.isDefault && filteredAddresses.length > 0) {
        filteredAddresses[0].isDefault = true;
        newDefaultId = filteredAddresses[0].id;
      } else if (addressToDelete?.isDefault) {
        newDefaultId = undefined;
      }
      
      return {
        ...user,
        addresses: filteredAddresses,
        defaultAddressId: newDefaultId
      };
    });
  }

  /**
   * Set an address as the default address
   */
  setDefaultAddress(id: string): void {
    this.currentUser.update(user => {
      if (!user) return null;
      
      const updatedAddresses = user.addresses.map(addr => ({
        ...addr,
        isDefault: addr.id === id
      }));
      
      return {
        ...user,
        addresses: updatedAddresses,
        defaultAddressId: id
      };
    });
  }

  /**
   * Get addresses sorted with default address first
   */
  getAddressesSorted(): Address[] {
    const user = this.currentUser();
    if (!user) return [];
    
    return [...user.addresses].sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return 0;
    });
  }
}

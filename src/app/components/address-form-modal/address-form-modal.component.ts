import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Address } from '../../services/user.service';
import { LocationService, Province, District, Ward } from '../../services/location.service';

@Component({
  selector: 'app-address-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './address-form-modal.component.html',
  styleUrl: './address-form-modal.component.css'
})
export class AddressFormModalComponent implements OnInit, OnChanges {
  @Input() isOpen: boolean = false;
  @Input() address?: Address;
  @Output() save = new EventEmitter<Address>();
  @Output() close = new EventEmitter<void>();

  // Form fields
  recipientName: string = '';
  phoneNumber: string = '';
  streetAddress: string = '';
  label: string = '';

  // Location data
  provinces: Province[] = [];
  filteredDistricts: District[] = [];
  filteredWards: Ward[] = [];

  // Selected locations
  selectedProvince: Province | null = null;
  selectedDistrict: District | null = null;
  selectedWard: Ward | null = null;

  // Search queries
  provinceSearch: string = '';
  districtSearch: string = '';
  wardSearch: string = '';

  // UI state
  isLoading: boolean = false;
  showProvinceDropdown: boolean = false;
  showDistrictDropdown: boolean = false;
  showWardDropdown: boolean = false;

  // Validation errors
  errors: {
    recipientName?: string;
    phoneNumber?: string;
    province?: string;
    district?: string;
    ward?: string;
    streetAddress?: string;
  } = {};

  constructor(private locationService: LocationService) {}

  ngOnInit(): void {
    this.provinces = this.locationService.getProvinces();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.initializeForm();
    }
    
    if (changes['address']) {
      this.initializeForm();
    }
  }

  private initializeForm(): void {
    if (this.address) {
      // Edit mode - populate with existing address
      this.recipientName = this.address.recipientName;
      this.phoneNumber = this.address.phoneNumber;
      this.streetAddress = this.address.streetAddress;
      this.label = this.address.label || '';
      
      this.selectedProvince = this.address.province;
      this.selectedDistrict = this.address.district;
      this.selectedWard = this.address.ward;
      
      // Load cascading data
      if (this.selectedProvince) {
        this.filteredDistricts = this.locationService.getDistrictsByProvince(this.selectedProvince.code);
      }
      if (this.selectedDistrict) {
        this.filteredWards = this.locationService.getWardsByDistrict(this.selectedDistrict.code);
      }
    } else {
      // Add mode - reset form
      this.resetForm();
    }
    
    this.errors = {};
  }

  private resetForm(): void {
    this.recipientName = '';
    this.phoneNumber = '';
    this.streetAddress = '';
    this.label = '';
    this.selectedProvince = null;
    this.selectedDistrict = null;
    this.selectedWard = null;
    this.filteredDistricts = [];
    this.filteredWards = [];
    this.provinceSearch = '';
    this.districtSearch = '';
    this.wardSearch = '';
  }

  // Province selection
  onProvinceSelect(province: Province): void {
    this.selectedProvince = province;
    this.provinceSearch = province.name;
    this.showProvinceDropdown = false;
    
    // Reset district and ward when province changes
    this.selectedDistrict = null;
    this.selectedWard = null;
    this.districtSearch = '';
    this.wardSearch = '';
    this.filteredWards = [];
    
    // Load districts for selected province
    this.filteredDistricts = this.locationService.getDistrictsByProvince(province.code);
    
    // Clear province error
    if (this.errors.province) {
      delete this.errors.province;
    }
  }

  // District selection
  onDistrictSelect(district: District): void {
    this.selectedDistrict = district;
    this.districtSearch = district.name;
    this.showDistrictDropdown = false;
    
    // Reset ward when district changes
    this.selectedWard = null;
    this.wardSearch = '';
    
    // Load wards for selected district
    this.filteredWards = this.locationService.getWardsByDistrict(district.code);
    
    // Clear district error
    if (this.errors.district) {
      delete this.errors.district;
    }
  }

  // Ward selection
  onWardSelect(ward: Ward): void {
    this.selectedWard = ward;
    this.wardSearch = ward.name;
    this.showWardDropdown = false;
    
    // Clear ward error
    if (this.errors.ward) {
      delete this.errors.ward;
    }
  }

  // Blur handlers with delay to allow click events to fire
  onProvinceBlur(): void {
    setTimeout(() => {
      this.showProvinceDropdown = false;
    }, 200);
  }

  onDistrictBlur(): void {
    setTimeout(() => {
      this.showDistrictDropdown = false;
    }, 200);
  }

  onWardBlur(): void {
    setTimeout(() => {
      this.showWardDropdown = false;
    }, 200);
  }

  // Search filtering
  getFilteredProvinces(): Province[] {
    if (!this.provinceSearch) {
      return this.provinces;
    }
    return this.locationService.searchProvinces(this.provinceSearch);
  }

  getFilteredDistricts(): District[] {
    if (!this.selectedProvince) {
      return [];
    }
    if (!this.districtSearch) {
      return this.filteredDistricts;
    }
    return this.locationService.searchDistricts(this.selectedProvince.code, this.districtSearch);
  }

  getFilteredWards(): Ward[] {
    if (!this.selectedDistrict) {
      return [];
    }
    if (!this.wardSearch) {
      return this.filteredWards;
    }
    return this.locationService.searchWards(this.selectedDistrict.code, this.wardSearch);
  }

  // Validation
  private validateForm(): boolean {
    this.errors = {};
    let isValid = true;

    if (!this.recipientName.trim()) {
      this.errors.recipientName = 'Vui lòng nhập tên người nhận';
      isValid = false;
    }

    if (!this.phoneNumber.trim()) {
      this.errors.phoneNumber = 'Vui lòng nhập số điện thoại';
      isValid = false;
    } else if (!/^[+]?[\d\s-]{10,}$/.test(this.phoneNumber.trim())) {
      this.errors.phoneNumber = 'Số điện thoại không hợp lệ';
      isValid = false;
    }

    if (!this.selectedProvince) {
      this.errors.province = 'Vui lòng chọn tỉnh/thành phố';
      isValid = false;
    }

    if (!this.selectedDistrict) {
      this.errors.district = 'Vui lòng chọn quận/huyện';
      isValid = false;
    }

    if (!this.selectedWard) {
      this.errors.ward = 'Vui lòng chọn phường/xã';
      isValid = false;
    }

    if (!this.streetAddress.trim()) {
      this.errors.streetAddress = 'Vui lòng nhập địa chỉ cụ thể';
      isValid = false;
    }

    return isValid;
  }

  isFormValid(): boolean {
    return !!(
      this.recipientName.trim() &&
      this.phoneNumber.trim() &&
      this.selectedProvince &&
      this.selectedDistrict &&
      this.selectedWard &&
      this.streetAddress.trim()
    );
  }

  // Actions
  onSave(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;

    const addressData: Address = {
      id: this.address?.id || `addr-${Date.now()}`,
      label: this.label.trim() || undefined,
      recipientName: this.recipientName.trim(),
      phoneNumber: this.phoneNumber.trim(),
      province: this.selectedProvince!,
      district: this.selectedDistrict!,
      ward: this.selectedWard!,
      streetAddress: this.streetAddress.trim(),
      isDefault: this.address?.isDefault || false
    };

    // Simulate async save
    setTimeout(() => {
      this.isLoading = false;
      this.save.emit(addressData);
      this.resetForm();
    }, 300);
  }

  onCancel(): void {
    this.resetForm();
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }
}

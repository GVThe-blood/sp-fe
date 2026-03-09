import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddressFormModalComponent } from './address-form-modal.component';
import { LocationService } from '../../services/location.service';

describe('AddressFormModalComponent', () => {
  let component: AddressFormModalComponent;
  let fixture: ComponentFixture<AddressFormModalComponent>;
  let locationService: LocationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddressFormModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AddressFormModalComponent);
    component = fixture.componentInstance;
    locationService = TestBed.inject(LocationService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with provinces from LocationService', () => {
    expect(component.provinces.length).toBeGreaterThan(0);
  });

  it('should reset form when opening in add mode', () => {
    component.address = undefined;
    component.isOpen = true;
    component.ngOnChanges({
      isOpen: {
        currentValue: true,
        previousValue: false,
        firstChange: false,
        isFirstChange: () => false
      }
    });

    expect(component.recipientName).toBe('');
    expect(component.phoneNumber).toBe('');
    expect(component.streetAddress).toBe('');
    expect(component.selectedProvince).toBeNull();
    expect(component.selectedDistrict).toBeNull();
    expect(component.selectedWard).toBeNull();
  });

  it('should populate form when opening in edit mode', () => {
    const mockAddress = {
      id: 'test-1',
      recipientName: 'Test User',
      phoneNumber: '+84 123 456 789',
      province: { code: 'HCM', name: 'TP. Hồ Chí Minh' },
      district: { code: 'HCM-Q1', name: 'Quận 1', provinceCode: 'HCM' },
      ward: { code: 'HCM-Q1-BN', name: 'Phường Bến Nghé', districtCode: 'HCM-Q1' },
      streetAddress: '123 Test Street',
      isDefault: false
    };

    component.address = mockAddress;
    component.isOpen = true;
    component.ngOnChanges({
      address: {
        currentValue: mockAddress,
        previousValue: undefined,
        firstChange: false,
        isFirstChange: () => false
      }
    });

    expect(component.recipientName).toBe('Test User');
    expect(component.phoneNumber).toBe('+84 123 456 789');
    expect(component.streetAddress).toBe('123 Test Street');
    expect(component.selectedProvince?.code).toBe('HCM');
    expect(component.selectedDistrict?.code).toBe('HCM-Q1');
    expect(component.selectedWard?.code).toBe('HCM-Q1-BN');
  });

  it('should filter districts when province is selected', () => {
    const province = { code: 'HCM', name: 'TP. Hồ Chí Minh' };
    component.onProvinceSelect(province);

    expect(component.selectedProvince).toEqual(province);
    expect(component.filteredDistricts.length).toBeGreaterThan(0);
    expect(component.filteredDistricts.every(d => d.provinceCode === 'HCM')).toBe(true);
  });

  it('should filter wards when district is selected', () => {
    const province = { code: 'HCM', name: 'TP. Hồ Chí Minh' };
    const district = { code: 'HCM-Q1', name: 'Quận 1', provinceCode: 'HCM' };
    
    component.onProvinceSelect(province);
    component.onDistrictSelect(district);

    expect(component.selectedDistrict).toEqual(district);
    expect(component.filteredWards.length).toBeGreaterThan(0);
    expect(component.filteredWards.every(w => w.districtCode === 'HCM-Q1')).toBe(true);
  });

  it('should reset district and ward when province changes', () => {
    const province1 = { code: 'HCM', name: 'TP. Hồ Chí Minh' };
    const district = { code: 'HCM-Q1', name: 'Quận 1', provinceCode: 'HCM' };
    const ward = { code: 'HCM-Q1-BN', name: 'Phường Bến Nghé', districtCode: 'HCM-Q1' };
    
    component.onProvinceSelect(province1);
    component.onDistrictSelect(district);
    component.onWardSelect(ward);

    const province2 = { code: 'HN', name: 'Hà Nội' };
    component.onProvinceSelect(province2);

    expect(component.selectedProvince?.code).toBe('HN');
    expect(component.selectedDistrict).toBeNull();
    expect(component.selectedWard).toBeNull();
  });

  it('should validate required fields', () => {
    component.recipientName = '';
    component.phoneNumber = '';
    component.selectedProvince = null;
    component.selectedDistrict = null;
    component.selectedWard = null;
    component.streetAddress = '';

    expect(component.isFormValid()).toBe(false);
  });

  it('should validate form as valid when all required fields are filled', () => {
    component.recipientName = 'Test User';
    component.phoneNumber = '+84 123 456 789';
    component.selectedProvince = { code: 'HCM', name: 'TP. Hồ Chí Minh' };
    component.selectedDistrict = { code: 'HCM-Q1', name: 'Quận 1', provinceCode: 'HCM' };
    component.selectedWard = { code: 'HCM-Q1-BN', name: 'Phường Bến Nghé', districtCode: 'HCM-Q1' };
    component.streetAddress = '123 Test Street';

    expect(component.isFormValid()).toBe(true);
  });

  it('should emit save event with complete address data', (done) => {
    component.recipientName = 'Test User';
    component.phoneNumber = '+84 123 456 789';
    component.selectedProvince = { code: 'HCM', name: 'TP. Hồ Chí Minh' };
    component.selectedDistrict = { code: 'HCM-Q1', name: 'Quận 1', provinceCode: 'HCM' };
    component.selectedWard = { code: 'HCM-Q1-BN', name: 'Phường Bến Nghé', districtCode: 'HCM-Q1' };
    component.streetAddress = '123 Test Street';
    component.label = 'Nhà';

    component.save.subscribe(address => {
      expect(address.recipientName).toBe('Test User');
      expect(address.phoneNumber).toBe('+84 123 456 789');
      expect(address.province.code).toBe('HCM');
      expect(address.district.code).toBe('HCM-Q1');
      expect(address.ward.code).toBe('HCM-Q1-BN');
      expect(address.streetAddress).toBe('123 Test Street');
      expect(address.label).toBe('Nhà');
      done();
    });

    component.onSave();
  });

  it('should emit close event on cancel', (done) => {
    component.close.subscribe(() => {
      done();
    });

    component.onCancel();
  });

  it('should show loading state during save', () => {
    component.recipientName = 'Test User';
    component.phoneNumber = '+84 123 456 789';
    component.selectedProvince = { code: 'HCM', name: 'TP. Hồ Chí Minh' };
    component.selectedDistrict = { code: 'HCM-Q1', name: 'Quận 1', provinceCode: 'HCM' };
    component.selectedWard = { code: 'HCM-Q1-BN', name: 'Phường Bến Nghé', districtCode: 'HCM-Q1' };
    component.streetAddress = '123 Test Street';

    component.onSave();
    expect(component.isLoading).toBe(true);
  });
});

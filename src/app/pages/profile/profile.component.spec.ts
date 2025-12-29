import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileComponent } from './profile.component';
import { UserService } from '../../services/user.service';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileComponent, RouterTestingModule],
      providers: [
        UserService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => null,
              },
            },
            params: of({}),
          },
        },
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display user first name', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    // Assuming the user mock data has firstName 'An'
    expect(compiled.textContent).toContain('An');
  });

  it('should display sorted addresses with default first', () => {
    const sortedAddresses = component.sortedAddresses;
    expect(sortedAddresses.length).toBeGreaterThan(0);
    expect(sortedAddresses[0].isDefault).toBe(true);
  });

  it('should open add address modal when button is clicked', () => {
    expect(component.isAddressModalOpen).toBe(false);
    component.openAddAddressModal();
    expect(component.isAddressModalOpen).toBe(true);
    expect(component.editingAddress).toBeUndefined();
  });

  it('should open edit address modal with address data', () => {
    const testAddress = component.sortedAddresses[0];
    component.openEditAddressModal(testAddress);
    expect(component.isAddressModalOpen).toBe(true);
    expect(component.editingAddress).toBe(testAddress);
  });

  it('should close address modal', () => {
    component.isAddressModalOpen = true;
    component.editingAddress = component.sortedAddresses[0];
    component.closeAddressModal();
    expect(component.isAddressModalOpen).toBe(false);
    expect(component.editingAddress).toBeUndefined();
  });

  it('should add new address via UserService', () => {
    const initialCount = component.sortedAddresses.length;
    const newAddress = {
      id: 'test-addr',
      recipientName: 'Test User',
      phoneNumber: '+84 999 999 999',
      province: { code: 'HCM', name: 'TP. Hồ Chí Minh' },
      district: { code: 'HCM-Q1', name: 'Quận 1', provinceCode: 'HCM' },
      ward: { code: 'HCM-Q1-BN', name: 'Phường Bến Nghé', districtCode: 'HCM-Q1' },
      streetAddress: '999 Test Street',
      isDefault: false
    };
    
    component.onSaveAddress(newAddress);
    expect(component.sortedAddresses.length).toBe(initialCount + 1);
  });

  it('should update existing address via UserService', () => {
    const addressToEdit = component.sortedAddresses[0];
    component.editingAddress = addressToEdit;
    
    const updatedAddress = {
      ...addressToEdit,
      recipientName: 'Updated Name'
    };
    
    component.onSaveAddress(updatedAddress);
    const updated = component.sortedAddresses.find(a => a.id === addressToEdit.id);
    expect(updated?.recipientName).toBe('Updated Name');
  });

  it('should set address as default', (done) => {
    const nonDefaultAddress = component.sortedAddresses.find(a => !a.isDefault);
    if (nonDefaultAddress) {
      component.onSetDefaultAddress(nonDefaultAddress);
      
      // Wait for async operation
      setTimeout(() => {
        const updated = component.sortedAddresses.find(a => a.id === nonDefaultAddress.id);
        expect(updated?.isDefault).toBe(true);
        expect(component.sortedAddresses[0].id).toBe(nonDefaultAddress.id);
        done();
      }, 400);
    } else {
      done();
    }
  });
});

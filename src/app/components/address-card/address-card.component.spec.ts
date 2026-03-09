import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddressCardComponent } from './address-card.component';
import { Address } from '../../services/user.service';

describe('AddressCardComponent', () => {
  let component: AddressCardComponent;
  let fixture: ComponentFixture<AddressCardComponent>;

  const mockAddress: Address = {
    id: 'addr-1',
    label: 'Nhà',
    recipientName: 'An Nguyen',
    phoneNumber: '+84 123 456 789',
    province: { code: 'HCM', name: 'TP. Hồ Chí Minh' },
    district: { code: 'HCM-Q1', name: 'Quận 1', provinceCode: 'HCM' },
    ward: { code: 'HCM-Q1-BN', name: 'Phường Bến Nghé', districtCode: 'HCM-Q1' },
    streetAddress: '123 Đường Lê Lợi',
    isDefault: true
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddressCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AddressCardComponent);
    component = fixture.componentInstance;
    component.address = mockAddress;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display recipient name and phone', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('An Nguyen');
    expect(compiled.textContent).toContain('+84 123 456 789');
  });

  it('should display default badge when isDefault is true', () => {
    component.isDefault = true;
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Mặc định');
  });

  it('should display full address', () => {
    const fullAddress = component.getFullAddress();
    expect(fullAddress).toBe('123 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh');
  });

  it('should emit edit event when edit button is clicked', () => {
    spyOn(component.edit, 'emit');
    component.onEdit();
    expect(component.edit.emit).toHaveBeenCalled();
  });

  it('should emit setDefault event when set default button is clicked', () => {
    component.isDefault = false;
    spyOn(component.setDefault, 'emit');
    component.onSetDefault();
    expect(component.setDefault.emit).toHaveBeenCalled();
  });

  it('should not emit setDefault event when already default', () => {
    component.isDefault = true;
    spyOn(component.setDefault, 'emit');
    component.onSetDefault();
    expect(component.setDefault.emit).not.toHaveBeenCalled();
  });

  it('should emit delete event when delete button is clicked', () => {
    spyOn(component.delete, 'emit');
    component.onDelete();
    expect(component.delete.emit).toHaveBeenCalled();
  });

  it('should not emit events when loading', () => {
    component.isLoading = true;
    spyOn(component.edit, 'emit');
    spyOn(component.setDefault, 'emit');
    spyOn(component.delete, 'emit');

    component.onEdit();
    component.onSetDefault();
    component.onDelete();

    expect(component.edit.emit).not.toHaveBeenCalled();
    expect(component.setDefault.emit).not.toHaveBeenCalled();
    expect(component.delete.emit).not.toHaveBeenCalled();
  });

  it('should display label when provided', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Nhà');
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AvatarPickerModalComponent } from './avatar-picker-modal.component';

describe('AvatarPickerModalComponent', () => {
  let component: AvatarPickerModalComponent;
  let fixture: ComponentFixture<AvatarPickerModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvatarPickerModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AvatarPickerModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have preset avatars', () => {
    expect(component.presetAvatars).toBeDefined();
    expect(component.presetAvatars.length).toBeGreaterThan(0);
  });

  it('should initialize with closed state', () => {
    expect(component.isOpen).toBe(false);
  });

  it('should emit close event when onClose is called', () => {
    spyOn(component.close, 'emit');
    component.onClose();
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should emit select event when onSave is called with selected avatar', () => {
    spyOn(component.select, 'emit');
    component.selectedAvatar = 'https://example.com/avatar.jpg';
    component.onSave();
    expect(component.select.emit).toHaveBeenCalledWith('https://example.com/avatar.jpg');
  });

  it('should emit upload event when onSave is called with uploaded file', () => {
    spyOn(component.upload, 'emit');
    const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
    component.uploadedFile = mockFile;
    component.onSave();
    expect(component.upload.emit).toHaveBeenCalledWith(mockFile);
  });

  it('should clear selection when preset avatar is selected', () => {
    component.uploadedFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
    component.uploadedPreview = 'data:image/jpeg;base64,test';
    
    component.onPresetSelect('https://example.com/avatar.jpg');
    
    expect(component.selectedAvatar).toBe('https://example.com/avatar.jpg');
    expect(component.uploadedFile).toBeNull();
    expect(component.uploadedPreview).toBeNull();
  });

  it('should return true for canSave when avatar is selected', () => {
    component.selectedAvatar = 'https://example.com/avatar.jpg';
    expect(component.canSave()).toBe(true);
  });

  it('should return true for canSave when file is uploaded', () => {
    component.uploadedFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
    expect(component.canSave()).toBe(true);
  });

  it('should return false for canSave when nothing is selected', () => {
    component.selectedAvatar = '';
    component.uploadedFile = null;
    expect(component.canSave()).toBe(false);
  });

  it('should return true for isSelected when avatar matches and no upload', () => {
    component.selectedAvatar = 'https://example.com/avatar.jpg';
    component.uploadedPreview = null;
    expect(component.isSelected('https://example.com/avatar.jpg')).toBe(true);
  });

  it('should return false for isSelected when upload preview exists', () => {
    component.selectedAvatar = 'https://example.com/avatar.jpg';
    component.uploadedPreview = 'data:image/jpeg;base64,test';
    expect(component.isSelected('https://example.com/avatar.jpg')).toBe(false);
  });
});

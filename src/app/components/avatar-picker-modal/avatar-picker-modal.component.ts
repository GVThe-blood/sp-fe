import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-avatar-picker-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avatar-picker-modal.component.html',
  styleUrl: './avatar-picker-modal.component.css'
})
export class AvatarPickerModalComponent {
  @Input() isOpen: boolean = false;
  @Input() currentAvatar: string = '';
  @Output() select = new EventEmitter<string>();
  @Output() upload = new EventEmitter<File>();
  @Output() close = new EventEmitter<void>();

  // Preset avatar URLs
  presetAvatars: string[] = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Max',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Bella',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucy',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Daisy',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie'
  ];

  selectedAvatar: string = '';
  uploadedFile: File | null = null;
  uploadedPreview: string | null = null;
  fileError: string = '';
  isLoading: boolean = false;

  // Allowed file types
  private readonly ALLOWED_FILE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
  ];

  ngOnInit(): void {
    this.selectedAvatar = this.currentAvatar;
  }

  ngOnChanges(): void {
    if (this.isOpen) {
      this.selectedAvatar = this.currentAvatar;
      this.uploadedFile = null;
      this.uploadedPreview = null;
      this.fileError = '';
    }
  }

  onPresetSelect(avatarUrl: string): void {
    this.selectedAvatar = avatarUrl;
    this.uploadedFile = null;
    this.uploadedPreview = null;
    this.fileError = '';
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    // Validate file type
    if (!this.ALLOWED_FILE_TYPES.includes(file.type)) {
      this.fileError = 'Chỉ chấp nhận file ảnh định dạng: JPG, JPEG, PNG, WEBP, GIF';
      this.uploadedFile = null;
      this.uploadedPreview = null;
      input.value = ''; // Reset input
      return;
    }

    this.fileError = '';
    this.isLoading = true;
    this.uploadedFile = file;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.uploadedPreview = e.target?.result as string;
      this.selectedAvatar = ''; // Clear preset selection
      this.isLoading = false;
    };
    reader.onerror = () => {
      this.fileError = 'Không thể đọc file. Vui lòng thử lại.';
      this.isLoading = false;
    };
    reader.readAsDataURL(file);
  }

  onSave(): void {
    if (this.uploadedFile) {
      this.upload.emit(this.uploadedFile);
    } else if (this.selectedAvatar) {
      this.select.emit(this.selectedAvatar);
    }
    this.onClose();
  }

  onClose(): void {
    this.selectedAvatar = this.currentAvatar;
    this.uploadedFile = null;
    this.uploadedPreview = null;
    this.fileError = '';
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  isSelected(avatarUrl: string): boolean {
    return this.selectedAvatar === avatarUrl && !this.uploadedPreview;
  }

  canSave(): boolean {
    return !!(this.selectedAvatar || this.uploadedFile) && !this.isLoading;
  }
}

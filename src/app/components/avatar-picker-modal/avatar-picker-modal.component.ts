import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-avatar-picker-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avatar-picker-modal.component.html',
  styleUrl: './avatar-picker-modal.component.css'
})
export class AvatarPickerModalComponent implements OnInit {
  @Input() isOpen: boolean = false;
  @Input() currentAvatar: string = '';
  @Output() select = new EventEmitter<string>();
  @Output() upload = new EventEmitter<File>();
  @Output() close = new EventEmitter<void>();

  // Default preset avatars served from our Cloudflare R2 bucket
  // (springfood-media/avatars/preset/...). To regenerate, run
  // `node scripts/seed-user-avatars.js` in the backend repo and copy
  // the URLs from scripts/seed-avatar-urls.json.
  presetAvatars: string[] = [
    // avataaars (cartoon character)
    'https://pub-db7036086154479380d282adb29af0a4.r2.dev/avatars/preset/avataaars/felix.svg',
    'https://pub-db7036086154479380d282adb29af0a4.r2.dev/avatars/preset/avataaars/aneka.svg',
    'https://pub-db7036086154479380d282adb29af0a4.r2.dev/avatars/preset/avataaars/luna.svg',
    'https://pub-db7036086154479380d282adb29af0a4.r2.dev/avatars/preset/avataaars/max.svg',
    'https://pub-db7036086154479380d282adb29af0a4.r2.dev/avatars/preset/avataaars/bella.svg',
    'https://pub-db7036086154479380d282adb29af0a4.r2.dev/avatars/preset/avataaars/charlie.svg',
    'https://pub-db7036086154479380d282adb29af0a4.r2.dev/avatars/preset/avataaars/lucy.svg',
    'https://pub-db7036086154479380d282adb29af0a4.r2.dev/avatars/preset/avataaars/oliver.svg',
    'https://pub-db7036086154479380d282adb29af0a4.r2.dev/avatars/preset/avataaars/milo.svg',
    'https://pub-db7036086154479380d282adb29af0a4.r2.dev/avatars/preset/avataaars/daisy.svg',
    'https://pub-db7036086154479380d282adb29af0a4.r2.dev/avatars/preset/avataaars/leo.svg',
    'https://pub-db7036086154479380d282adb29af0a4.r2.dev/avatars/preset/avataaars/sophie.svg',
    // lorelei (illustrated portrait)
    'https://pub-db7036086154479380d282adb29af0a4.r2.dev/avatars/preset/lorelei/mira.svg',
    'https://pub-db7036086154479380d282adb29af0a4.r2.dev/avatars/preset/lorelei/kai.svg',
    'https://pub-db7036086154479380d282adb29af0a4.r2.dev/avatars/preset/lorelei/rose.svg',
    'https://pub-db7036086154479380d282adb29af0a4.r2.dev/avatars/preset/lorelei/linh.svg',
    'https://pub-db7036086154479380d282adb29af0a4.r2.dev/avatars/preset/lorelei/tuan.svg',
    'https://pub-db7036086154479380d282adb29af0a4.r2.dev/avatars/preset/lorelei/mai.svg',
    'https://pub-db7036086154479380d282adb29af0a4.r2.dev/avatars/preset/lorelei/an.svg',
    'https://pub-db7036086154479380d282adb29af0a4.r2.dev/avatars/preset/lorelei/hoa.svg',
    'https://pub-db7036086154479380d282adb29af0a4.r2.dev/avatars/preset/lorelei/nam.svg',
    'https://pub-db7036086154479380d282adb29af0a4.r2.dev/avatars/preset/lorelei/hieu.svg',
    'https://pub-db7036086154479380d282adb29af0a4.r2.dev/avatars/preset/lorelei/trang.svg',
    'https://pub-db7036086154479380d282adb29af0a4.r2.dev/avatars/preset/lorelei/phuc.svg',
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

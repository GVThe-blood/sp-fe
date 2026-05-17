import {
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  AddressDetailResponse,
  ProfileApiService
} from '../../services/profile-api.service';

export interface Address {
  id: string;
  name: string;
  phone: string;
  address: string;
  isDefault: boolean;
}

@Component({
  selector: 'app-address-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './address-modal.component.html',
  styleUrl: './address-modal.component.css'
})
export class AddressModalComponent {
  private profileApi = inject(ProfileApiService);

  @Input() isOpen = false;
  @Input() currentAddressId: string | null = null;
  @Output() closeModal = new EventEmitter<void>();
  @Output() selectAddress = new EventEmitter<Address>();
  @Output() addNewAddress = new EventEmitter<void>();

  selectedAddressId = signal<string | null>(null);
  isClosing = signal(false);

  /**
   * Source of truth: ProfileApiService.addresses (signal). Convert sang
   * UI-shape `Address` mỗi khi dữ liệu BE thay đổi.
   */
  readonly addressesSignal = computed<Address[]>(() =>
    this.profileApi.sortedAddresses().map(a => this.toUiAddress(a))
  );

  /** Backward-compat: getter cho template hiện tại đang `*ngFor="let a of addresses"`. */
  get addresses(): Address[] {
    return this.addressesSignal();
  }

  constructor() {
    // Mỗi khi modal mở mà chưa có data → load từ BE.
    effect(() => {
      if (this.isOpen && this.profileApi.addresses().length === 0) {
        this.profileApi.loadAddresses().subscribe({ error: () => {} });
      }
    });
  }

  ngOnChanges(): void {
    if (this.currentAddressId) {
      this.selectedAddressId.set(this.currentAddressId);
    } else {
      const list = this.addressesSignal();
      if (list.length > 0) {
        const def = list.find(a => a.isDefault);
        this.selectedAddressId.set(def?.id ?? list[0].id);
      }
    }
  }

  selectAddressItem(address: Address): void {
    this.selectedAddressId.set(address.id);
  }

  isSelected(addressId: string): boolean {
    return this.selectedAddressId() === addressId;
  }

  onConfirm(): void {
    const list = this.addressesSignal();
    const selected = list.find(a => a.id === this.selectedAddressId());
    if (selected) {
      this.selectAddress.emit(selected);
    }
    this.close();
  }

  onAddNew(): void {
    this.addNewAddress.emit();
    this.close();
  }

  close(): void {
    this.isClosing.set(true);
    setTimeout(() => {
      this.isClosing.set(false);
      this.closeModal.emit();
    }, 200);
  }

  onOverlayClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  // ============= helpers =============

  private toUiAddress(a: AddressDetailResponse): Address {
    return {
      id: a.id,
      name: a.recipientName,
      phone: a.phoneNumber,
      address: this.formatAddress(a),
      isDefault: a.isDefault
    };
  }

  private formatAddress(a: AddressDetailResponse): string {
    return [a.details, a.streetAddress, a.ward, a.district, a.city]
      .filter(s => !!s && s!.trim().length > 0)
      .join(', ');
  }
}

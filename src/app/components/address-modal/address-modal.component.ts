import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  @Input() isOpen = false;
  @Input() currentAddressId: string | null = null;
  @Output() closeModal = new EventEmitter<void>();
  @Output() selectAddress = new EventEmitter<Address>();
  @Output() addNewAddress = new EventEmitter<void>();

  selectedAddressId = signal<string | null>(null);
  isClosing = signal(false);

  // Mock addresses data
  addresses: Address[] = [
    {
      id: '1',
      name: 'Nguyễn Văn A',
      phone: '0912345678',
      address: 'Trung Tâm Pha Sơn Vi Tinh Quang Chinh, Quốc Lộ 32, P.Minh Khai, Q.Bắc Từ Liêm, Hà Nội',
      isDefault: true
    },
    {
      id: '2',
      name: 'Nguyễn Văn A',
      phone: '0912345678',
      address: '123 Đường Láng, Phường Láng Thượng, Quận Đống Đa, Hà Nội',
      isDefault: false
    },
    {
      id: '3',
      name: 'Nguyễn Văn A',
      phone: '0912345678',
      address: '456 Phố Huế, Phường Bùi Thị Xuân, Quận Hai Bà Trưng, Hà Nội',
      isDefault: false
    }
  ];

  ngOnChanges(): void {
    if (this.currentAddressId) {
      this.selectedAddressId.set(this.currentAddressId);
    } else if (this.addresses.length > 0) {
      const defaultAddr = this.addresses.find(a => a.isDefault);
      this.selectedAddressId.set(defaultAddr?.id || this.addresses[0].id);
    }
  }

  selectAddressItem(address: Address): void {
    this.selectedAddressId.set(address.id);
  }

  isSelected(addressId: string): boolean {
    return this.selectedAddressId() === addressId;
  }

  onConfirm(): void {
    const selected = this.addresses.find(a => a.id === this.selectedAddressId());
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
}

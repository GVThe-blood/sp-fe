import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Address } from '../../services/user.service';

@Component({
  selector: 'app-address-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './address-card.component.html',
  styleUrl: './address-card.component.css'
})
export class AddressCardComponent {
  @Input() address!: Address;
  @Input() isDefault: boolean = false;
  @Input() isLoading: boolean = false;
  
  @Output() edit = new EventEmitter<void>();
  @Output() setDefault = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();

  onEdit(): void {
    if (!this.isLoading) {
      this.edit.emit();
    }
  }

  onSetDefault(): void {
    if (!this.isLoading && !this.isDefault) {
      this.setDefault.emit();
    }
  }

  onDelete(): void {
    if (!this.isLoading) {
      this.delete.emit();
    }
  }

  getFullAddress(): string {
    const parts = [
      this.address.streetAddress,
      this.address.ward.name,
      this.address.district.name,
      this.address.province.name
    ];
    return parts.filter(Boolean).join(', ');
  }
}

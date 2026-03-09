import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface PromoCode {
  id: string;
  code: string;
  title: string;
  description: string;
  discount: number;
  discountType: 'percent' | 'fixed';
  maxDiscount?: number;
  minOrderAmount: number;
  expiryDate: Date;
  imageUrl?: string;
  category: 'food' | 'delivery' | 'special';
  isDisabled?: boolean;
  disabledReason?: string;
  conditions?: string[];
}

@Component({
  selector: 'app-promo-code-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './promo-code-modal.component.html',
  styleUrl: './promo-code-modal.component.css'
})
export class PromoCodeModalComponent {
  @Input() isOpen = false;
  @Input() appliedPromoCodes: PromoCode[] = [];
  @Output() closeModal = new EventEmitter<void>();
  @Output() applyPromos = new EventEmitter<PromoCode[]>();

  searchTerm = signal('');
  selectedPromos = signal<Set<string>>(new Set());
  isClosing = signal(false);
  
  // Signals for promo detail modal (task 5.2 / 6)
  showDetailModal = signal<boolean>(false);
  selectedPromoForDetail = signal<PromoCode | null>(null);
  
  // Signal for showing selection limit feedback (task 8.1)
  selectionLimitMessage = signal<string | null>(null);

  // Mock promo codes data
  promoCodes: PromoCode[] = [
    {
      id: '1',
      code: 'CHAOBM',
      title: '[Chào bạn mới] - Giảm 50%, tối đa 25K',
      description: 'Đơn hàng tối thiểu 50.000đ',
      discount: 50,
      discountType: 'percent',
      maxDiscount: 25000,
      minOrderAmount: 50000,
      expiryDate: new Date('2025-11-30'),
      category: 'food',
      isDisabled: false,
      conditions: ['Áp dụng cho đơn hàng từ 50.000đ', 'Giảm tối đa 25.000đ', 'Chỉ áp dụng cho khách hàng mới']
    },
    {
      id: '2',
      code: 'BE160',
      title: 'Giảm 16K, thêm nhiều ưu đãi - BE160',
      description: 'Đơn hàng tối thiểu 70.000đ',
      discount: 16000,
      discountType: 'fixed',
      minOrderAmount: 70000,
      expiryDate: new Date('2025-11-30'),
      category: 'food',
      isDisabled: true,
      disabledReason: 'Đơn hàng chưa đạt 70.000đ',
      conditions: ['Áp dụng cho đơn hàng từ 70.000đ', 'Giảm trực tiếp 16.000đ']
    },
    {
      id: '3',
      code: 'BE90',
      title: 'Giảm 9K, thêm nhiều ưu đãi - BE90',
      description: 'Đơn hàng tối thiểu 40.000đ',
      discount: 9000,
      discountType: 'fixed',
      minOrderAmount: 40000,
      expiryDate: new Date('2025-11-30'),
      category: 'food',
      isDisabled: false,
      conditions: ['Áp dụng cho đơn hàng từ 40.000đ', 'Giảm trực tiếp 9.000đ']
    },
    {
      id: '4',
      code: 'MBBANK10',
      title: 'MB - Giảm 10% (Tối đa 50K) beFood',
      description: 'Thêm nhiều ưu đãi',
      discount: 10,
      discountType: 'percent',
      maxDiscount: 50000,
      minOrderAmount: 0,
      expiryDate: new Date('2025-12-31'),
      category: 'special',
      isDisabled: true,
      disabledReason: 'Chỉ áp dụng khi thanh toán bằng MB Bank',
      conditions: ['Thanh toán bằng MB Bank', 'Giảm 10% tối đa 50.000đ']
    },
    {
      id: '5',
      code: 'FREESHIP',
      title: 'Miễn phí giao hàng',
      description: 'Đơn hàng tối thiểu 100.000đ',
      discount: 15000,
      discountType: 'fixed',
      minOrderAmount: 100000,
      expiryDate: new Date('2025-12-15'),
      category: 'delivery',
      isDisabled: false,
      conditions: ['Áp dụng cho đơn hàng từ 100.000đ', 'Miễn phí giao hàng tối đa 15.000đ']
    },
    {
      id: '6',
      code: 'FREESHIP20',
      title: 'Miễn phí giao hàng 20K',
      description: 'Đơn hàng tối thiểu 150.000đ',
      discount: 20000,
      discountType: 'fixed',
      minOrderAmount: 150000,
      expiryDate: new Date('2025-12-20'),
      category: 'delivery',
      isDisabled: true,
      disabledReason: 'Đơn hàng chưa đạt 150.000đ',
      conditions: ['Áp dụng cho đơn hàng từ 150.000đ', 'Miễn phí giao hàng tối đa 20.000đ']
    }
  ];

  filteredPromoCodes = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.promoCodes;
    return this.promoCodes.filter(promo =>
      promo.code.toLowerCase().includes(term) ||
      promo.title.toLowerCase().includes(term)
    );
  });

  foodPromoCodes = computed(() => 
    this.getDisplayedPromos('food')
  );

  deliveryPromoCodes = computed(() => 
    this.getDisplayedPromos('delivery')
  );

  /**
   * Get displayed promos for a category with sorting and limiting
   * - Sorts available (non-disabled) promos first, then disabled
   * - Limits to maximum 10 promos per category
   * 
   * @param type - The category type ('food' or 'delivery')
   * @returns Array of promos sorted and limited to 10
   * 
   * Requirements: 5.5, 5.6
   */
  getDisplayedPromos(type: 'food' | 'delivery'): PromoCode[] {
    // Filter by category (food includes 'food' and 'special')
    const filtered = this.filteredPromoCodes().filter(p => 
      type === 'food' 
        ? (p.category === 'food' || p.category === 'special')
        : p.category === 'delivery'
    );
    
    // Sort: available (non-disabled) first, then disabled
    const sorted = [...filtered].sort((a, b) => {
      const aDisabled = a.isDisabled === true;
      const bDisabled = b.isDisabled === true;
      if (aDisabled === bDisabled) return 0;
      return aDisabled ? 1 : -1;
    });
    
    // Limit to maximum 10 promos
    return sorted.slice(0, 10);
  }

  selectedCount = computed(() => this.selectedPromos().size);

  ngOnChanges(): void {
    // Initialize selected promos from applied promos
    if (this.appliedPromoCodes.length > 0) {
      const ids = new Set(this.appliedPromoCodes.map(p => p.id));
      this.selectedPromos.set(ids);
    }
  }

  /**
   * Check if a promo code can be selected
   * Returns false if:
   * - Promo is disabled
   * - Same type promo already selected (max 1 per type)
   * 
   * Maximum 2 promo codes allowed: 1 delivery + 1 product (food/special)
   * 
   * Requirements: 5.1, 5.7
   */
  canSelectPromo(promo: PromoCode): boolean {
    if (promo.isDisabled) {
      return false;
    }
    
    // If already selected, can always deselect
    if (this.selectedPromos().has(promo.id)) {
      return true;
    }
    
    // Check if same type already selected
    const selectedIds = this.selectedPromos();
    const selectedPromosList = this.promoCodes.filter(p => selectedIds.has(p.id));
    
    // Determine the promo type category (food/special = product, delivery = delivery)
    const promoTypeCategory = promo.category === 'delivery' ? 'delivery' : 'product';
    
    // Check if we already have a promo of the same type category
    const sameTypeSelected = selectedPromosList.find(p => {
      const selectedTypeCategory = p.category === 'delivery' ? 'delivery' : 'product';
      return selectedTypeCategory === promoTypeCategory;
    });
    
    if (sameTypeSelected) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Get the reason why a promo cannot be selected
   * Used for showing feedback to user
   */
  getSelectionBlockReason(promo: PromoCode): string | null {
    if (promo.isDisabled) {
      return promo.disabledReason || 'Mã không khả dụng';
    }
    
    if (this.selectedPromos().has(promo.id)) {
      return null; // Can deselect
    }
    
    const selectedIds = this.selectedPromos();
    const selectedPromosList = this.promoCodes.filter(p => selectedIds.has(p.id));
    
    const promoTypeCategory = promo.category === 'delivery' ? 'delivery' : 'product';
    const sameTypeSelected = selectedPromosList.find(p => {
      const selectedTypeCategory = p.category === 'delivery' ? 'delivery' : 'product';
      return selectedTypeCategory === promoTypeCategory;
    });
    
    if (sameTypeSelected) {
      if (promoTypeCategory === 'delivery') {
        return 'Đã chọn 1 mã giao hàng. Bỏ chọn mã hiện tại để chọn mã khác.';
      } else {
        return 'Đã chọn 1 mã ưu đãi sản phẩm. Bỏ chọn mã hiện tại để chọn mã khác.';
      }
    }
    
    return null;
  }

  togglePromo(promo: PromoCode): void {
    // Clear any previous message
    this.selectionLimitMessage.set(null);
    
    // Check if already selected (can always deselect)
    if (this.selectedPromos().has(promo.id)) {
      this.selectedPromos.update(selected => {
        const newSet = new Set(selected);
        newSet.delete(promo.id);
        return newSet;
      });
      return;
    }
    
    // Check if can select
    if (!this.canSelectPromo(promo)) {
      // Show feedback message
      const reason = this.getSelectionBlockReason(promo);
      if (reason) {
        this.selectionLimitMessage.set(reason);
        // Auto-clear message after 3 seconds
        setTimeout(() => {
          this.selectionLimitMessage.set(null);
        }, 3000);
      }
      return;
    }
    
    // Add to selection
    this.selectedPromos.update(selected => {
      const newSet = new Set(selected);
      newSet.add(promo.id);
      return newSet;
    });
  }

  isSelected(promoId: string): boolean {
    return this.selectedPromos().has(promoId);
  }

  isPromoDisabled(promo: PromoCode): boolean {
    return promo.isDisabled === true;
  }

  onApply(): void {
    const selectedIds = this.selectedPromos();
    const selectedPromoCodes = this.promoCodes.filter(p => selectedIds.has(p.id));
    this.applyPromos.emit(selectedPromoCodes);
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

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('vi-VN');
  }

  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  formatDiscount(promo: PromoCode): string {
    if (promo.discountType === 'percent') {
      return `${promo.discount}%`;
    } else {
      // Format fixed amount (e.g., 16000 -> 16K)
      if (promo.discount >= 1000) {
        return `${Math.floor(promo.discount / 1000)}K`;
      }
      return `${promo.discount}đ`;
    }
  }

  /**
   * Open the promo detail modal with the selected promo
   * Called when user clicks on the info area of a promo card
   */
  openPromoDetail(promo: PromoCode, event: Event): void {
    event.stopPropagation();
    this.selectedPromoForDetail.set(promo);
    this.showDetailModal.set(true);
  }

  /**
   * Close the detail modal and return to main promo list
   */
  closeDetailModal(): void {
    this.showDetailModal.set(false);
    this.selectedPromoForDetail.set(null);
  }

  /**
   * Close all modals (both detail and main)
   */
  closeAllModals(): void {
    this.closeDetailModal();
    this.close();
  }

  /**
   * Apply promo from detail modal and close
   */
  applyPromoFromDetail(): void {
    const promo = this.selectedPromoForDetail();
    if (promo) {
      // Use togglePromo to handle selection with limit enforcement
      this.togglePromo(promo);
    }
    this.closeDetailModal();
  }
}

import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PromoCodeModalComponent, PromoCode } from '../../components/promo-code-modal/promo-code-modal.component';
import { AddressModalComponent, Address } from '../../components/address-modal/address-modal.component';
import { ProductDetailModalComponent } from '../../components/product-detail-modal/product-detail-modal.component';

interface CartItem {
  id: number;
  name: string;
  options: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  imageUrl: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  sold: number;
  likes: number;
  rating?: number;
  isSoldOut: boolean;
  categoryId: number;
  description?: string;
  customizationGroups?: any[];
}

@Component({
  selector: 'app-order',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule,
    PromoCodeModalComponent, 
    AddressModalComponent,
    ProductDetailModalComponent
  ],
  templateUrl: './order.component.html',
  styleUrl: './order.component.css'
})
export class OrderComponent implements OnInit {
  // Modal states
  isPromoModalOpen = signal(false);
  isAddressModalOpen = signal(false);
  isProductModalOpen = signal(false);

  // Selected data
  selectedAddress = signal<Address | null>(null);
  appliedPromoCodes = signal<PromoCode[]>([]);
  selectedPaymentMethod = signal<'cash' | 'vnpay'>('cash');
  doorDelivery = signal(true);
  driverNote = '';

  // FoodCare insurance state
  foodCareExpanded = signal<boolean>(false);
  foodCareConfirmed = signal<boolean>(true); // Default to confirmed

  // Cart items
  cartItems = signal<CartItem[]>([
    {
      id: 1,
      name: 'Mỳ kim chi hải sản',
      options: 'Cấp độ cay: Cấp 0',
      price: 68000,
      originalPrice: 89000,
      quantity: 1,
      imageUrl: 'https://i.imgur.com/rs23gCq.png'
    },
    {
      id: 2,
      name: 'Cơm chiên hải sản',
      options: 'Size: Lớn, Thêm trứng',
      price: 55000,
      quantity: 2,
      imageUrl: 'https://i.imgur.com/rs23gCq.png'
    }
  ]);

  // Store info
  storeName = signal('Mỳ Cay Jeju - Tu Hoàng');

  // Editing product
  editingProduct = signal<Product | null>(null);
  editingCartItem = signal<{item: any, index: number} | null>(null);

  // Computed values
  subtotal = computed(() => {
    return this.cartItems().reduce((sum, item) => sum + (item.price * item.quantity), 0);
  });

  deliveryFee = computed(() => {
    return this.doorDelivery() ? 20000 : 15000;
  });

  totalDiscount = computed(() => {
    let discount = 0;
    const promos = this.appliedPromoCodes();
    const sub = this.subtotal();
    
    for (const promo of promos) {
      if (sub >= promo.minOrderAmount) {
        if (promo.discountType === 'percent') {
          let d = Math.floor(sub * promo.discount / 100);
          if (promo.maxDiscount) {
            d = Math.min(d, promo.maxDiscount);
          }
          discount += d;
        } else {
          discount += promo.discount;
        }
      }
    }
    return discount;
  });

  // FoodCare insurance price
  foodCarePrice = 1000;

  total = computed(() => {
    const foodCare = this.foodCareConfirmed() ? this.foodCarePrice : 0;
    return this.subtotal() + this.deliveryFee() - this.totalDiscount() + foodCare;
  });

  originalTotal = computed(() => {
    const foodCare = this.foodCareConfirmed() ? this.foodCarePrice : 0;
    return this.subtotal() + this.deliveryFee() + foodCare;
  });

  itemCount = computed(() => {
    return this.cartItems().reduce((sum, item) => sum + item.quantity, 0);
  });

  // Max items to display before scrolling
  maxDisplayItems = 5;

  ngOnInit(): void {
    // Set default address
    this.selectedAddress.set({
      id: '1',
      name: 'Nguyễn Văn A',
      phone: '0912345678',
      address: 'Trung Tâm Pha Sơn Vi Tinh Quang Chinh, Quốc Lộ 32, P.Minh Khai, Q.Bắc Từ Liêm, Hà Nội',
      isDefault: true
    });
  }

  // Promo Modal
  openPromoModal(): void {
    this.isPromoModalOpen.set(true);
  }

  closePromoModal(): void {
    this.isPromoModalOpen.set(false);
  }

  onApplyPromos(promos: PromoCode[]): void {
    this.appliedPromoCodes.set(promos);
  }

  // Address Modal
  openAddressModal(): void {
    this.isAddressModalOpen.set(true);
  }

  closeAddressModal(): void {
    this.isAddressModalOpen.set(false);
  }

  onSelectAddress(address: Address): void {
    this.selectedAddress.set(address);
  }

  onAddNewAddress(): void {
    // Handle add new address - could navigate to address form
    console.log('Add new address');
  }

  // Payment Method
  selectPaymentMethod(method: 'cash' | 'vnpay'): void {
    this.selectedPaymentMethod.set(method);
  }

  // Door Delivery Toggle
  toggleDoorDelivery(): void {
    this.doorDelivery.update(v => !v);
  }

  // FoodCare Insurance Toggle
  toggleFoodCare(): void {
    this.foodCareExpanded.update(v => !v);
  }

  toggleFoodCareConfirm(): void {
    this.foodCareConfirmed.update(v => !v);
  }

  // Cart Item Actions
  removeItem(itemId: number): void {
    this.cartItems.update(items => items.filter(item => item.id !== itemId));
  }

  editItem(item: CartItem, index: number): void {
    // Convert CartItem to Product format for the modal
    const product: Product = {
      id: item.id,
      name: item.name,
      price: item.price,
      originalPrice: item.originalPrice,
      image: item.imageUrl,
      sold: 0,
      likes: 0,
      isSoldOut: false,
      categoryId: 1,
      description: item.options,
      customizationGroups: [
        {
          id: 'spicy',
          name: 'Cấp độ cay',
          required: true,
          maxSelection: 1,
          options: [
            { id: 'level0', name: 'Cấp 0 (Không cay)', priceModifier: 0 },
            { id: 'level1', name: 'Cấp 1 (Ít cay)', priceModifier: 0 },
            { id: 'level2', name: 'Cấp 2 (Cay vừa)', priceModifier: 0 },
            { id: 'level3', name: 'Cấp 3 (Cay nhiều)', priceModifier: 0 }
          ]
        }
      ]
    };
    
    this.editingProduct.set(product);
    this.editingCartItem.set({
      item: {
        product: product,
        quantity: item.quantity,
        note: item.options,
        selectedOptions: new Map([['spicy', 'level0']])
      },
      index: index
    });
    this.isProductModalOpen.set(true);
  }

  closeProductModal(): void {
    this.isProductModalOpen.set(false);
    this.editingProduct.set(null);
    this.editingCartItem.set(null);
  }

  onUpdateCart(event: {index: number, cartItem: any}): void {
    this.cartItems.update(items => {
      const newItems = [...items];
      if (newItems[event.index]) {
        newItems[event.index] = {
          ...newItems[event.index],
          quantity: event.cartItem.quantity,
          options: event.cartItem.note || newItems[event.index].options
        };
      }
      return newItems;
    });
    this.closeProductModal();
  }

  // Place Order
  placeOrder(): void {
    if (!this.selectedAddress()) {
      alert('Vui lòng chọn địa chỉ giao hàng');
      return;
    }
    if (this.cartItems().length === 0) {
      alert('Giỏ hàng trống');
      return;
    }
    
    const orderData = {
      address: this.selectedAddress(),
      items: this.cartItems(),
      paymentMethod: this.selectedPaymentMethod(),
      promos: this.appliedPromoCodes(),
      subtotal: this.subtotal(),
      deliveryFee: this.deliveryFee(),
      discount: this.totalDiscount(),
      total: this.total(),
      driverNote: this.driverNote
    };
    
    console.log('Placing order:', orderData);
    alert('Đặt hàng thành công!');
  }

  // Format price
  formatPrice(price: number): string {
    return price.toLocaleString('vi-VN') + 'đ';
  }

  // Track by function
  trackByItemId(_index: number, item: CartItem): number {
    return item.id;
  }

  // Calculate individual promo discount
  calculatePromoDiscount(promo: PromoCode): number {
    const sub = this.subtotal();
    if (sub < promo.minOrderAmount) return 0;
    
    if (promo.discountType === 'percent') {
      let d = Math.floor(sub * promo.discount / 100);
      if (promo.maxDiscount) {
        d = Math.min(d, promo.maxDiscount);
      }
      return d;
    }
    return promo.discount;
  }
}

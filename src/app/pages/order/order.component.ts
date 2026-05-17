import {
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HotToastService } from '@ngxpert/hot-toast';

import {
  PromoCodeModalComponent,
  PromoCode
} from '../../components/promo-code-modal/promo-code-modal.component';
import {
  AddressModalComponent,
  Address
} from '../../components/address-modal/address-modal.component';
import { ProductDetailModalComponent } from '../../components/product-detail-modal/product-detail-modal.component';

import { CartApiService } from '../../services/cart-api.service';
import { OrderApiService } from '../../services/order-api.service';
import { PaymentApiService } from '../../services/payment-api.service';
import { ProfileApiService } from '../../services/profile-api.service';
import {
  buildShopOrdersFromCart,
  OrderCheckoutRequest,
  PaymentMethod
} from '../../models/order.model';
import { CartItemResponse } from '../../models/cart.model';
import { environment } from '../../../environments/environment';

interface CartItem {
  id: string;             // sku (unique trong cart)
  productId: string;
  shopId?: string;
  shopName?: string;
  name: string;
  options: string;
  /** Giá đã giảm (per unit). */
  price: number;
  /** Giá gốc per unit (chỉ set khi != price → để gạch chân). */
  originalPrice?: number;
  /** % giảm giá (để hiển thị badge). */
  discountPercent?: number;
  /** Tên chương trình khuyến mãi. */
  promotionName?: string;
  quantity: number;
  imageUrl: string;
}

interface Product {
  id: number | string;
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
  private cartApi = inject(CartApiService);
  private orderApi = inject(OrderApiService);
  private paymentApi = inject(PaymentApiService);
  private profileApi = inject(ProfileApiService);
  private router = inject(Router);
  private toast = inject(HotToastService);

  // Modal states
  isPromoModalOpen = signal(false);
  isAddressModalOpen = signal(false);
  isProductModalOpen = signal(false);

  // Selected data
  selectedAddress = signal<Address | null>(null);
  appliedPromoCodes = signal<PromoCode[]>([]);
  /** UI value: cash → COD, vnpay → VNPAY khi gửi BE. */
  selectedPaymentMethod = signal<'cash' | 'vnpay'>('cash');
  doorDelivery = signal(true);
  driverNote = '';

  // FoodCare insurance state
  foodCareExpanded = signal<boolean>(false);
  foodCareConfirmed = signal<boolean>(true);

  // Loading state khi đang submit checkout
  submitting = signal<boolean>(false);

  /**
   * Cart items (chỉ items được "selected" ở trang Cart) — derive từ cartApi.cart().
   */
  cartItems = computed<CartItem[]>(() => {
    const cart = this.cartApi.cart();
    if (!cart) return [];
    const out: CartItem[] = [];
    for (const group of cart.shopGroups) {
      for (const item of group.items) {
        if (!item.selected) continue;
        out.push(this.toCartItem(item, group.shopName));
      }
    }
    return out;
  });

  // Store info — lấy shop đầu tiên có item selected để hiển thị tiêu đề
  storeName = computed<string>(() => {
    const cart = this.cartApi.cart();
    if (!cart) return '';
    const firstShop = cart.shopGroups.find(g =>
      g.items.some(i => i.selected)
    );
    return firstShop?.shopName ?? 'Đơn hàng';
  });

  // Editing product
  editingProduct = signal<Product | null>(null);
  editingCartItem = signal<{ item: any; index: number } | null>(null);

  // ============= Computed totals =============

  /** Tổng tiền hàng SAU khuyến mãi (giá đã giảm × qty). */
  subtotal = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  /** Tổng tiền hàng theo giá GỐC (originalPrice × qty), trước mọi khuyến mãi. */
  originalSubtotal = computed(() =>
    this.cartItems().reduce(
      (sum, item) => sum + (item.originalPrice ?? item.price) * item.quantity,
      0
    )
  );

  /** Tiết kiệm từ chương trình sale (originalSubtotal - subtotal). */
  productSaleDiscount = computed(() =>
    Math.max(0, this.originalSubtotal() - this.subtotal())
  );

  deliveryFee = computed(() => (this.doorDelivery() ? 20000 : 15000));

  /** Tổng giảm giá từ voucher (mã KM) — riêng với sale của shop. */
  totalDiscount = computed(() => {
    let discount = 0;
    const promos = this.appliedPromoCodes();
    const sub = this.subtotal();
    for (const promo of promos) {
      if (sub >= promo.minOrderAmount) {
        if (promo.discountType === 'percent') {
          let d = Math.floor((sub * promo.discount) / 100);
          if (promo.maxDiscount) d = Math.min(d, promo.maxDiscount);
          discount += d;
        } else {
          discount += promo.discount;
        }
      }
    }
    return discount;
  });

  foodCarePrice = 1000;

  /** Tổng số tiền user phải trả. */
  total = computed(() => {
    const foodCare = this.foodCareConfirmed() ? this.foodCarePrice : 0;
    return (
      this.subtotal() + this.deliveryFee() - this.totalDiscount() + foodCare
    );
  });

  /**
   * Giá GỐC trước khi áp dụng bất kỳ giảm giá nào (sale shop + voucher).
   * Dùng để gạch chân ở summary nếu có saving.
   */
  originalTotal = computed(() => {
    const foodCare = this.foodCareConfirmed() ? this.foodCarePrice : 0;
    return this.originalSubtotal() + this.deliveryFee() + foodCare;
  });

  /** TRUE nếu có saving (sale + voucher) → cho UI quyết định gạch chân. */
  hasAnySavings = computed(
    () => this.productSaleDiscount() > 0 || this.totalDiscount() > 0
  );

  itemCount = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.quantity, 0)
  );

  maxDisplayItems = 5;

  ngOnInit(): void {
    // Load cart từ BE (chứa items selected)
    this.cartApi.loadCart().subscribe({
      next: () => {
        if (this.cartItems().length === 0) {
          this.toast.warning(
            'Bạn chưa chọn sản phẩm nào để thanh toán. Quay về giỏ hàng để chọn.'
          );
        }
      },
      error: () => {
        // CartApiService đã toast (nếu không silent)
      }
    });

    // Load địa chỉ và auto chọn default
    this.profileApi.loadAddresses().subscribe({
      next: list => {
        const def = list.find(a => a.isDefault) ?? list[0];
        if (def) {
          this.selectedAddress.set({
            id: def.id,
            name: def.recipientName,
            phone: def.phoneNumber,
            address: this.formatAddress(def),
            isDefault: def.isDefault
          });
        }
      },
      error: () => {}
    });
  }

  // ============= Modal handlers (giữ nguyên hành vi cũ) =============

  openPromoModal(): void {
    this.isPromoModalOpen.set(true);
  }

  closePromoModal(): void {
    this.isPromoModalOpen.set(false);
  }

  onApplyPromos(promos: PromoCode[]): void {
    this.appliedPromoCodes.set(promos);
  }

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
    this.router.navigate(['/profile'], { queryParams: { tab: 'address' } });
  }

  selectPaymentMethod(method: 'cash' | 'vnpay'): void {
    this.selectedPaymentMethod.set(method);
  }

  toggleDoorDelivery(): void {
    this.doorDelivery.update(v => !v);
  }

  toggleFoodCare(): void {
    this.foodCareExpanded.update(v => !v);
  }

  toggleFoodCareConfirm(): void {
    this.foodCareConfirmed.update(v => !v);
  }

  // ============= Cart actions =============

  /**
   * Xoá một sản phẩm khỏi giỏ. Truyền sku (id) đến cart-service.
   */
  removeItem(itemId: string | number): void {
    const sku = String(itemId);
    if (!sku) return;
    this.cartApi.removeItem(sku).subscribe({ error: () => {} });
  }

  editItem(item: CartItem, index: number): void {
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
      customizationGroups: []
    };

    this.editingProduct.set(product);
    this.editingCartItem.set({
      item: {
        product: product,
        quantity: item.quantity,
        note: item.options,
        selectedOptions: new Map<string, string>()
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

  /**
   * Khi user chỉnh số lượng từ modal → gọi update qty trên cart-service.
   */
  onUpdateCart(event: { index: number; cartItem: any }): void {
    const items = this.cartItems();
    const target = items[event.index];
    if (!target) return;
    const newQty = event.cartItem.quantity ?? target.quantity;
    if (newQty === target.quantity) {
      this.closeProductModal();
      return;
    }
    this.cartApi.updateQuantity(target.id, newQty).subscribe({
      next: () => this.closeProductModal(),
      error: () => this.closeProductModal()
    });
  }

  // ============= Place order =============

  placeOrder(): void {
    if (this.submitting()) return;

    const address = this.selectedAddress();
    if (!address) {
      this.toast.warning('Vui lòng chọn địa chỉ giao hàng');
      return;
    }

    const items = this.cartItems();
    if (items.length === 0) {
      this.toast.warning('Giỏ hàng đang trống');
      return;
    }

    // Map UI items → BE CartItemResponse-shape để build shopOrders.
    const cartItemPayloads: CartItemResponse[] = items.map(it => ({
      sku: it.id,
      productId: it.productId,
      productName: it.name,
      productImage: it.imageUrl,
      shopId: it.shopId,
      shopName: it.shopName,
      price: it.price,
      finalPrice: it.price,
      originalPrice: it.originalPrice ?? it.price,
      quantity: it.quantity,
      selected: true
    }));

    const shopOrders = buildShopOrdersFromCart(cartItemPayloads);
    if (shopOrders.length === 0) {
      this.toast.error('Không xác định được shop của sản phẩm. Vui lòng thử lại.');
      return;
    }

    // Gắn note + shippingFee chia đều theo số shop để giữ tổng ổn định
    const feePerShop = Math.floor(this.deliveryFee() / shopOrders.length);
    for (const so of shopOrders) {
      so.shippingFee = feePerShop;
      so.shippingMethod = this.doorDelivery() ? 'DOOR' : 'STANDARD';
      so.note = this.driverNote || undefined;
    }

    const paymentMethod: PaymentMethod =
      this.selectedPaymentMethod() === 'vnpay' ? 'VNPAY' : 'COD';

    const payload: OrderCheckoutRequest = {
      shopOrderItems: shopOrders,
      paymentMethod,
      shippingAddressId: address.id,
      globalVoucher:
        this.appliedPromoCodes().length > 0
          ? this.appliedPromoCodes()
              .map(p => p.code ?? p.id)
              .join(',')
          : undefined
    };

    this.submitting.set(true);
    this.orderApi.checkout(payload).subscribe({
      next: res => {
        // Reset cart cache để badge giảm về 0 cho items đã checkout
        this.cartApi.loadCart().subscribe({ error: () => {} });

        // Nhánh COD: BE chỉ trả referenceId, không có paymentUrl → vào trang success
        if (paymentMethod === 'COD') {
          this.submitting.set(false);
          this.toast.success('Đặt hàng thành công!');
          this.router.navigate(['/order-success'], {
            queryParams: {
              referenceId: res.referenceId,
              method: paymentMethod
            }
          });
          return;
        }

        // Nhánh VNPAY:
        //  - Nếu BE đã build sẵn paymentUrl thì redirect ngay (forward-compat).
        //  - Nếu không thì FE tự gọi /payment/create-payment với txnRef=referenceId
        //    rồi redirect.
        if (res.paymentUrl) {
          this.toast.success('Đang chuyển sang VNPay…');
          window.location.href = res.paymentUrl;
          return;
        }
        this.requestVnpayUrlAndRedirect(res.referenceId, res.amount);
      },
      error: () => {
        this.submitting.set(false);
      }
    });
  }

  private requestVnpayUrlAndRedirect(referenceId: string, _amount: number): void {
    // referenceId từ /order/checkout chính là paymentTransactionId. Gọi
    // endpoint mới /payment/vnpay/from-reference/{id} — payment-service tự
    // load amount/userId từ DB nên FE không cần build payload đầy đủ.
    this.paymentApi.createPaymentUrlByReference(referenceId).subscribe({
      next: r => {
        this.submitting.set(false);
        if (r?.paymentUrl) {
          this.toast.success('Đang chuyển sang VNPay…');
          window.location.href = r.paymentUrl;
        } else {
          this.toast.error('Không lấy được URL thanh toán VNPay');
        }
      },
      error: () => {
        this.submitting.set(false);
      }
    });
  }

  // ============= Helpers =============

  formatPrice(price: number): string {
    return price.toLocaleString('vi-VN') + 'đ';
  }

  trackByItemId(_index: number, item: CartItem): string {
    return item.id;
  }

  calculatePromoDiscount(promo: PromoCode): number {
    const sub = this.subtotal();
    if (sub < promo.minOrderAmount) return 0;
    if (promo.discountType === 'percent') {
      let d = Math.floor((sub * promo.discount) / 100);
      if (promo.maxDiscount) d = Math.min(d, promo.maxDiscount);
      return d;
    }
    return promo.discount;
  }

  // ============= Internal mappers =============

  private toCartItem(it: CartItemResponse, shopName?: string): CartItem {
    const optionsParts: string[] = [];
    if (it.variantName) optionsParts.push(it.variantName);
    if (it.attributes) {
      for (const [k, v] of Object.entries(it.attributes)) {
        optionsParts.push(`${k}: ${v}`);
      }
    }
    const fallbackImg = environment.placeholders?.product ?? '';

    // Cart-service trả 4 field giá:
    //  - originalPrice: giá gốc /unit
    //  - price:        giá hiện tại /unit (đã có sale)
    //  - discountAmount: số tiền giảm /unit
    //  - finalPrice:   tổng đã giảm CHO CẢ DÒNG (price*qty - discount*qty)
    // Vì FE nhân quantity ở subtotal, chúng ta cần unit price thuần.
    // Ưu tiên giá đã có sale → fallback originalPrice → fallback finalPrice/qty.
    const qty = it.quantity || 1;
    const unitPrice =
      it.price ??
      it.originalPrice ??
      (it.finalPrice != null ? it.finalPrice / qty : 0);

    // Chỉ gạch chân khi originalPrice tồn tại VÀ khác price (có sale thật sự).
    const showOriginal =
      it.originalPrice != null &&
      it.originalPrice > 0 &&
      it.originalPrice !== unitPrice;

    return {
      id: it.sku,
      productId: it.productId,
      shopId: it.shopId,
      shopName: shopName ?? it.shopName,
      name: it.productName,
      options: optionsParts.join(', ') || '',
      price: unitPrice,
      originalPrice: showOriginal ? it.originalPrice : undefined,
      discountPercent:
        showOriginal && it.discountPercent ? it.discountPercent : undefined,
      promotionName: it.promotionName,
      quantity: qty,
      imageUrl: it.productImage || fallbackImg
    };
  }

  private formatAddress(a: {
    streetAddress: string;
    ward?: string;
    district?: string;
    city?: string;
    details?: string;
  }): string {
    return [a.details, a.streetAddress, a.ward, a.district, a.city]
      .filter(s => !!s && s!.trim().length > 0)
      .join(', ');
  }
}

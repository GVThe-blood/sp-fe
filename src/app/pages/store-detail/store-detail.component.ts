import { Component, signal, computed, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HotToastService } from '@ngxpert/hot-toast';
import { StarRatingComponent } from '../../components/star-rating/star-rating.component';
import { ProductDetailModalComponent } from '../../components/product-detail-modal/product-detail-modal.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { AuthService } from '../../services/auth.service';
import { CartApiService } from '../../services/cart-api.service';
import { AddToCartRequest } from '../../models/cart.model';
import { ShopService, ShopDetail } from '../../services/shop.service';
import { ProductService, Product as ApiProduct, ShopMenuCategory } from '../../services/product.service';
import { environment } from '../../../environments/environment';

/**
 * UUID v1-v5 case-insensitive matcher. Used to guard against syncing local
 * cart items whose `productId` is not a real BE UUID — cart-service rejects
 * those with 400 (`UUID.fromString` throws `IllegalArgumentException`), so
 * we silently skip the network sync instead.
 */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface Category {
  id: number;
  name: string;
  count: number;
}

interface CustomizationOption {
  id: string;
  name: string;
  priceModifier: number;
}

interface CustomizationGroup {
  id: string;
  name: string;
  required: boolean;
  maxSelection: number;
  options: CustomizationOption[];
}

interface Product {
  id: number | string;  // Support both number and string (UUID from backend)
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  sold?: number;  // Make optional to match cart service
  likes?: number;  // Make optional
  rating?: number; // Added rating
  isSoldOut?: boolean;  // Make optional
  categoryId?: number;  // Make optional
  description?: string;
  customizationGroups?: CustomizationGroup[];
}

interface CartItem {
  product: Product;
  quantity: number;
  note?: string;
  selectedOptions?: Map<string, string>;
}

interface StoreInfo {
  name: string;
  address: string;
  rating: number;
  reviewCount: string;
  openTime: string;
  distance: string;
  image: string;
  bannerImage: string;
}

@Component({
  selector: 'app-store-detail',
  standalone: true,
  imports: [CommonModule, StarRatingComponent, ProductDetailModalComponent, FooterComponent],
  templateUrl: './store-detail.component.html',
  styleUrl: './store-detail.component.css'
})
export class StoreDetailComponent implements OnInit, OnDestroy {
  storeId: string | null = null;
  private intersectionObserver?: IntersectionObserver;

  /**
   * Default banner ảnh dùng cho mọi shop chưa có hero image riêng. BE
   * {@code ShopDetailResponse} chỉ trả {@code logo}, nên chúng ta render banner
   * client-side để giữ visual khi không có cover image.
   */
  private static readonly DEFAULT_BANNER =
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80';

  // Loading & error states cho việc fetch shop detail + products
  isLoadingShop = signal<boolean>(true);
  isLoadingProducts = signal<boolean>(true);
  loadError = signal<string | null>(null);

  // Store info — bắt đầu rỗng, được cập nhật khi gọi API thành công.
  storeInfo: StoreInfo = {
    name: 'Đang tải...',
    address: '',
    rating: 0,
    reviewCount: '0',
    openTime: '',
    distance: '',
    image: '',
    bannerImage: StoreDetailComponent.DEFAULT_BANNER
  };

  // Categories — populated từ {@code GET /products/by-shop/{shopId}/menu}.
  // Mỗi category id là hash ổn định của tên category (do BE tạo) để FE
  // dùng làm scroll anchor {@code #category-{id}}.
  categories = signal<Category[]>([]);

  // Products — flatten từ menu (mỗi sản phẩm có thể xuất hiện nhiều bucket
  // nếu thuộc nhiều category). Template grouping qua {@link groupedProducts}
  // sẽ filter theo {@code categoryId}, nên chúng ta giữ duplicate.
  products = signal<Product[]>([]);

  /**
   * Search keyword used to filter products inside this shop. The input bar
   * in the menu header drives this signal; {@link groupedProducts} reads
   * from it via {@code computed} so the layout updates instantly without
   * extra round-trips. We still keep an API-backed search via
   * {@code productService.searchByShop} for cases where the menu is paged
   * or when the FE wants to reuse the same flow as my-store/admin.
   */
  searchKeyword = signal<string>('');

  // Grouped products — filtered by both category bucket AND search keyword
  groupedProducts = computed(() => {
    const prods = this.products();
    const cats = this.categories();
    const kw = this.searchKeyword().trim().toLowerCase();

    const matches = (p: Product) => {
      if (!kw) return true;
      const haystack = [
        p.name,
        p.description ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(kw);
    };

    return cats
      .map(cat => ({
        ...cat,
        products: prods.filter(p => p.categoryId === cat.id && matches(p))
      }))
      // Hide empty buckets so the section title doesn't appear over a void.
      .filter(group => group.products.length > 0);
  });

  // Favorite Logic
  favoriteProducts = signal<Set<number | string>>(new Set());
  isStoreFavorite = signal<boolean>(false);

  // Active category tracking
  activeCategory = signal<number | null>(null);

  // Modal state
  selectedProduct = signal<Product | null>(null);
  isModalOpen = signal<boolean>(false);

  /**
   * Pending close-timer handle. Used to cancel the deferred
   * `selectedProduct.set(null)` when the user re-opens a different product
   * within the 300ms close animation window.
   */
  private closeModalTimer?: ReturnType<typeof setTimeout>;

  // Cart Logic
  cart = signal<CartItem[]>([]);
  
  // Add-to-cart success animation
  addedToCartProductId = signal<number | string | null>(null);
  
  // Cart edit mode for bulk delete
  isCartEditMode = signal<boolean>(false);
  selectedCartItems = signal<Set<number>>(new Set());
  
  // Track which cart item is being edited
  editingCartItem = signal<{item: CartItem, index: number} | null>(null);
  
  // Fallback images
  private readonly FALLBACK_BANNER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1200" height="250" viewBox="0 0 1200 250"%3E%3Crect fill="%23e5e7eb" width="1200" height="250"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%239ca3af"%3EStore Banner%3C/text%3E%3C/svg%3E';
  private readonly FALLBACK_PRODUCT_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23e5e7eb" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%239ca3af"%3ENo Image%3C/text%3E%3C/svg%3E';

  // Calculate item total with modifiers
  calculateItemTotal(item: CartItem): number {
    let total = item.product.price;
    
    if (item.selectedOptions && item.product.customizationGroups) {
      item.selectedOptions.forEach((optionId, groupId) => {
        const group = item.product.customizationGroups!.find(g => g.id === groupId);
        if (group) {
          const option = group.options.find(o => o.id === optionId);
          if (option) {
            total += option.priceModifier;
          }
        }
      });
    }
    
    return total * item.quantity;
  }

  cartTotal = computed(() => {
    return this.cart().reduce((acc, item) => {
      return acc + this.calculateItemTotal(item);
    }, 0);
  });

  cartCount = computed(() => {
    return this.cart().reduce((acc, item) => acc + item.quantity, 0);
  });

  constructor(private route: ActivatedRoute) {
    this.storeId = this.route.snapshot.paramMap.get('id');
  }

  // ============= Server cart sync =============
  private authService = inject(AuthService);
  private cartApi = inject(CartApiService);
  private toast = inject(HotToastService);
  private shopService = inject(ShopService);
  private productService = inject(ProductService);
  private router = inject(Router);

  /**
   * Reactive auth flag exposed to the template so the checkout CTA can switch
   * between "Đăng nhập để đặt đơn" and "Đặt hàng" without manually wiring the
   * auth signal at every callsite.
   */
  isAuthenticated = computed(() => this.authService.isAuthenticated());

  /**
   * Handler cho CTA dưới sidebar giỏ hàng. Behaviour:
   *  - chưa login → điều hướng tới `/login` kèm returnUrl về trang hiện tại;
   *  - đã login + cart trống → cảnh báo;
   *  - đã login + cart có hàng → đẩy lên `/order` để chọn địa chỉ + thanh toán.
   *
   * Lưu ý: hiện store-detail giữ cart riêng dưới signal {@link cart} (local) và
   * sync về BE qua {@link cartApi}. Button "Đặt hàng" chỉ là entry point chuyển
   * trang; OrderComponent sẽ load cart đầy đủ từ BE.
   */
  proceedToCheckout(): void {
    if (!this.isAuthenticated()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url }
      });
      return;
    }

    if (this.cartCount() === 0) {
      this.toast.warning('Giỏ hàng đang trống. Hãy chọn sản phẩm trước khi đặt đơn.');
      return;
    }

    this.router.navigate(['/order']);
  }

  /**
   * Build payload AddToCartRequest từ CartItem local của store-detail.
   * Sinh SKU theo product id + option ids để khớp logic merge ở BE.
   */
  private buildAddRequest(cartItem: CartItem): AddToCartRequest {
    const product = cartItem.product;
    const sku = this.buildSku(cartItem);
    const variantName = this.formatCartItemOptions(cartItem) || undefined;
    const attributes = this.extractAttributes(cartItem);

    return {
      productId: String(product.id),
      sku,
      productName: product.name,
      productImage: product.image,
      shopId: this.storeId ?? undefined,
      shopName: this.storeInfo.name,
      quantity: cartItem.quantity,
      price: product.price,
      originalPrice: product.originalPrice,
      variantName,
      attributes
    };
  }

  private buildSku(cartItem: CartItem): string {
    const productId = String(cartItem.product.id);
    const opts = cartItem.selectedOptions;
    if (!opts || opts.size === 0) return `P-${productId}`;
    const tail = Array.from(opts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([groupId, optionId]) => `${groupId}:${optionId}`)
      .join('|');
    return `P-${productId}-${tail}`;
  }

  private extractAttributes(cartItem: CartItem): Record<string, string> | undefined {
    const opts = cartItem.selectedOptions;
    const groups = cartItem.product.customizationGroups;
    if (!opts || !groups || opts.size === 0) return undefined;

    const attrs: Record<string, string> = {};
    opts.forEach((optionId, groupId) => {
      const group = groups.find(g => g.id === groupId);
      const option = group?.options.find(o => o.id === optionId);
      if (group && option) {
        attrs[group.name] = option.name;
      }
    });
    return Object.keys(attrs).length > 0 ? attrs : undefined;
  }

  /**
   * Sync 1 cart item lên server cart.
   * Chỉ gọi khi user đã đăng nhập; nếu không thì hiện toast warning.
   */
  private syncAddToServer(cartItem: CartItem): void {
    if (!this.authService.isAuthenticated()) {
      this.toast.warning('Đăng nhập để lưu giỏ hàng vào tài khoản');
      return;
    }

    // Cart-service requires UUIDs for productId / shopId. If the local cart
    // item came from a non-API source (legacy mock, demo seed, etc.) we
    // skip the network sync rather than triggering a 400 from BE.
    const productId = String(cartItem.product.id);
    if (!UUID_REGEX.test(productId)) {
      console.warn(
        '[StoreDetail] skip server sync: productId is not a UUID',
        productId
      );
      return;
    }

    this.cartApi.addItem(this.buildAddRequest(cartItem)).subscribe({
      // CartApiService đã toast lỗi & cập nhật signal cart toàn cục
      error: () => {}
    });
  }

  ngOnInit() {
    this.loadShopDetail();
    this.loadShopMenu();
    this.setupIntersectionObserver();
  }

  /**
   * Fetch shop detail từ {@code GET /shop/{shopId}} và populate
   * {@link storeInfo}. ResponseData wrapper từ BE có shape
   * {@code { code|appStatus, message, data }} nên ta defensive check cả hai.
   */
  private loadShopDetail(): void {
    if (!this.storeId) {
      this.loadError.set('Không tìm thấy shop');
      this.isLoadingShop.set(false);
      return;
    }

    this.isLoadingShop.set(true);
    this.shopService.getShopDetail(this.storeId).subscribe({
      next: (response) => {
        const shop = response?.data;
        if (!shop) {
          this.loadError.set('Không thể tải thông tin shop');
          this.isLoadingShop.set(false);
          return;
        }
        this.applyShopDetail(shop);
        this.isLoadingShop.set(false);
      },
      error: (err) => {
        console.error('[StoreDetail] getShopDetail failed', err);
        this.loadError.set('Không thể tải thông tin shop');
        this.toast.error('Không thể tải thông tin cửa hàng');
        this.isLoadingShop.set(false);
      }
    });
  }

  /**
   * Map {@link ShopDetail} từ BE sang {@link storeInfo} dùng cho template.
   * Giữ fallback cho mọi trường để UI vẫn render khi BE trả null.
   */
  private applyShopDetail(shop: ShopDetail): void {
    const fullAddress = [shop.shopAddress, shop.city, shop.province]
      .filter(part => part && part.trim().length > 0)
      .join(', ');

    this.storeInfo = {
      name: shop.shopName || 'Cửa hàng',
      address: fullAddress || 'Chưa cập nhật địa chỉ',
      // BE trả BigDecimal → có thể là number hoặc string khi qua JSON
      rating: this.toNumber(shop.avgStar) || 0,
      reviewCount: shop.totalFeedback != null ? String(shop.totalFeedback) : '0',
      openTime: shop.activeHours || 'Chưa cập nhật',
      distance: shop.distance != null ? `${shop.distance.toFixed(1)} km` : '',
      image: shop.logo || environment.placeholders.shop,
      // Logo dùng làm banner hero để không phải thêm field mới ở BE.
      bannerImage: shop.logo || StoreDetailComponent.DEFAULT_BANNER
    };
  }

  /**
   * Fetch storefront menu (categories + products mỗi category) trong 1 call
   * tới {@code GET /products/by-shop/{shopId}/menu}.
   *
   * <p>Mỗi {@link ShopMenuCategory} được map thành:</p>
   * <ul>
   *   <li>1 entry trong {@link categories} (id ổn định + name + count).</li>
   *   <li>N entries trong {@link products} với {@code categoryId} match,
   *       để {@link groupedProducts} có thể filter và render đúng section.</li>
   * </ul>
   *
   * <p>Sản phẩm thuộc nhiều category sẽ xuất hiện trong nhiều bucket — đúng
   * với behaviour của BE và là điều người dùng kỳ vọng (chip count phải
   * khớp với số sản phẩm trong section).</p>
   */
  private loadShopMenu(): void {
    if (!this.storeId) {
      this.isLoadingProducts.set(false);
      return;
    }

    this.isLoadingProducts.set(true);
    this.productService.getShopMenu(this.storeId).subscribe({
      next: (response) => {
        const buckets: ShopMenuCategory[] = response?.data ?? [];

        const categories: Category[] = [];
        const flatProducts: Product[] = [];

        for (const bucket of buckets) {
          categories.push({
            id: bucket.id,
            name: bucket.name,
            count: bucket.count
          });
          for (const apiProduct of bucket.products) {
            flatProducts.push(this.mapApiProduct(apiProduct, bucket.id));
          }
        }

        this.categories.set(categories);
        this.products.set(flatProducts);
        if (categories.length > 0) {
          this.activeCategory.set(categories[0].id);
        }
        this.isLoadingProducts.set(false);

        // Re-observe sections sau khi DOM cập nhật.
        setTimeout(() => this.setupIntersectionObserver(), 100);
      },
      error: (err) => {
        console.error('[StoreDetail] getShopMenu failed', err);
        this.toast.error('Không thể tải danh sách sản phẩm');
        this.isLoadingProducts.set(false);
      }
    });
  }

  /**
   * Convert API product (BE shape) sang local {@link Product} cho template.
   * Tận dụng helper từ {@code ProductService} để parse JSON images & price.
   *
   * @param categoryId category bucket the product was emitted under — required
   *                   so {@link groupedProducts} có thể filter chính xác.
   */
  private mapApiProduct(p: ApiProduct, categoryId: number): Product {
    const imagesArr = this.productService.parseImages(p.images);
    const firstImage = imagesArr.length > 0 ? imagesArr[0] : environment.placeholders.product;
    const numericPrice = this.toNumber(p.price) ?? 0;

    return {
      id: p.id,
      name: p.name,
      price: numericPrice,
      image: firstImage,
      sold: 0,
      likes: 0,
      rating: p.averageRating ?? undefined,
      isSoldOut: (p.quantity ?? 0) === 0,
      categoryId,
      description: p.description || undefined
      // customizationGroups: BE chưa expose — modal sẽ tự generate mock.
    };
  }

  /**
   * Coerce giá trị number/string từ JSON về number, trả null khi không hợp lệ.
   */
  private toNumber(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined) return null;
    const n = typeof value === 'number' ? value : parseFloat(value);
    return Number.isFinite(n) ? n : null;
  }

  ngOnDestroy() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }

  private setupIntersectionObserver() {
    const options = {
      root: null,
      rootMargin: '-20% 0px -70% 0px', // Trigger when section is in the top 30% of viewport
      threshold: 0
    };

    this.intersectionObserver = new IntersectionObserver((entries) => {
      // Find the topmost visible category section
      const visibleEntries = entries.filter(entry => entry.isIntersecting);
      
      if (visibleEntries.length > 0) {
        // Sort by position to get the topmost one
        visibleEntries.sort((a, b) => {
          return a.boundingClientRect.top - b.boundingClientRect.top;
        });
        
        const topmostEntry = visibleEntries[0];
        const categoryId = parseInt(topmostEntry.target.id.replace('category-', ''));
        this.activeCategory.set(categoryId);
      }
    }, options);

    // Observe all category sections after a short delay to ensure DOM is ready
    setTimeout(() => {
      this.categories().forEach(cat => {
        const element = document.getElementById(`category-${cat.id}`);
        if (element && this.intersectionObserver) {
          this.intersectionObserver.observe(element);
        }
      });
    }, 100);
  }

  openProductModal(product: Product) {
    if (product.isSoldOut) return;
    // Cancel any pending close timer so back-to-back card clicks don't
    // wipe `selectedProduct` right after the user opens the next one.
    if (this.closeModalTimer) {
      clearTimeout(this.closeModalTimer);
      this.closeModalTimer = undefined;
    }
    this.selectedProduct.set(product);
    this.isModalOpen.set(true);
  }

  closeProductModal() {
    this.isModalOpen.set(false);
    if (this.closeModalTimer) {
      clearTimeout(this.closeModalTimer);
    }
    // Delay clearing the product to allow modal animation to complete.
    // Re-check `isModalOpen` inside the timer so a fast re-open keeps the
    // freshly-set product instead of being nulled out.
    this.closeModalTimer = setTimeout(() => {
      if (!this.isModalOpen()) {
        this.selectedProduct.set(null);
        this.editingCartItem.set(null);
      }
      this.closeModalTimer = undefined;
    }, 300);
  }

  handleAddToCart(cartItem: CartItem) {
    this.cart.update(currentCart => {
      // Check if the same product with same options already exists
      const existingItemIndex = currentCart.findIndex(item => {
        if (item.product.id !== cartItem.product.id) return false;
        
        // Compare selected options
        if (!item.selectedOptions && !cartItem.selectedOptions) return true;
        if (!item.selectedOptions || !cartItem.selectedOptions) return false;
        
        if (item.selectedOptions.size !== cartItem.selectedOptions.size) return false;
        
        for (const [key, value] of item.selectedOptions) {
          if (cartItem.selectedOptions.get(key) !== value) return false;
        }
        
        return true;
      });

      if (existingItemIndex !== -1) {
        // Update quantity of existing item
        return currentCart.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + cartItem.quantity }
            : item
        );
      } else {
        // Add new item
        return [...currentCart, cartItem];
      }
    });
    
    // Show success animation
    this.showAddSuccess(cartItem.product.id);

    // Sync lên server cart (BE) — local sidebar đã update ở trên
    this.syncAddToServer(cartItem);
  }
  
  // Handle cart item update from modal
  handleUpdateCartItem(data: {index: number, cartItem: CartItem}): void {
    let oldItem: CartItem | undefined;
    this.cart.update(currentCart => {
      oldItem = currentCart[data.index];
      const newCart = [...currentCart];
      newCart[data.index] = data.cartItem;
      return newCart;
    });
    this.editingCartItem.set(null);

    // Sync lên server: nếu options đổi → SKU đổi → remove old + add new
    // nếu chỉ đổi quantity → update quantity
    if (oldItem) {
      const oldSku = this.buildSku(oldItem);
      const newSku = this.buildSku(data.cartItem);
      if (oldSku === newSku) {
        this.syncQuantityToServer(data.cartItem);
      } else {
        this.syncRemoveFromServer(oldItem);
        this.syncAddToServer(data.cartItem);
      }
    }
  }
  
  // Open cart item for editing
  editCartItem(item: CartItem, index: number): void {
    this.selectedProduct.set(item.product);
    this.editingCartItem.set({item, index});
    this.isModalOpen.set(true);
  }
  
  showAddSuccess(productId: number | string) {
    this.addedToCartProductId.set(productId);
    setTimeout(() => {
      this.addedToCartProductId.set(null);
    }, 1000);
  }

  addToCart(product: Product) {
    // This method is now used for quick add from product card
    // Open modal for customization
    this.openProductModal(product);
  }

  removeFromCart(productId: number | string) {
    let removedItem: CartItem | undefined;
    let decrementedItem: CartItem | undefined;

    this.cart.update(currentCart => {
      const existingItem = currentCart.find(item => item.product.id === productId);
      if (existingItem && existingItem.quantity > 1) {
        decrementedItem = { ...existingItem, quantity: existingItem.quantity - 1 };
        return currentCart.map(item =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      } else {
        removedItem = existingItem;
        return currentCart.filter(item => item.product.id !== productId);
      }
    });

    // Sync lên server cart
    if (removedItem) {
      this.syncRemoveFromServer(removedItem);
    } else if (decrementedItem) {
      this.syncQuantityToServer(decrementedItem);
    }
  }

  incrementCartItem(item: CartItem) {
    let updated: CartItem | undefined;
    this.cart.update(currentCart => {
      return currentCart.map(cartItem => {
        if (cartItem === item) {
          updated = { ...cartItem, quantity: cartItem.quantity + 1 };
          return updated;
        }
        return cartItem;
      });
    });

    if (updated) {
      this.syncQuantityToServer(updated);
    }
  }

  private syncQuantityToServer(cartItem: CartItem): void {
    if (!this.authService.isAuthenticated()) return;
    const sku = this.buildSku(cartItem);
    this.cartApi.updateQuantity(sku, cartItem.quantity).subscribe({ error: () => {} });
  }

  private syncRemoveFromServer(cartItem: CartItem): void {
    if (!this.authService.isAuthenticated()) return;
    const sku = this.buildSku(cartItem);
    this.cartApi.removeItem(sku).subscribe({ error: () => {} });
  }

  toggleStoreFavorite() {
    this.isStoreFavorite.update(current => !current);
  }

  toggleProductFavorite(productId: number | string) {
    this.favoriteProducts.update(favorites => {
      const newFavorites = new Set(favorites);
      if (newFavorites.has(productId)) {
        newFavorites.delete(productId);
      } else {
        newFavorites.add(productId);
      }
      return newFavorites;
    });
  }

  isProductFavorite(productId: number | string): boolean {
    return this.favoriteProducts().has(productId);
  }

  toggleLike(product: Product) {
    console.log('Liked', product.name);
  }

  /**
   * Bound to the menu's "Tìm kiếm trong nhà hàng" input. Updates the
   * {@link searchKeyword} signal which the {@link groupedProducts}
   * computed reads to filter the menu in-place. Lightweight (client-side
   * only) since the entire shop menu is already loaded — no extra HTTP
   * call needed for the typing case.
   */
  onMenuSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchKeyword.set(input.value ?? '');
  }

  /** Clear the menu search input and reset the filter. */
  clearMenuSearch(): void {
    this.searchKeyword.set('');
  }

  scrollToCategory(categoryId: number) {
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Update active category immediately when clicking
      this.activeCategory.set(categoryId);
    }
  }

  isCategoryActive(categoryId: number): boolean {
    return this.activeCategory() === categoryId;
  }

  // TrackBy functions for performance optimization
  trackByCategory(index: number, category: Category): number {
    return category.id;
  }

  trackByProduct(index: number, product: Product): number | string {
    return product.id;
  }

  trackByCartItem(index: number, item: CartItem): number | string {
    return item.product.id;
  }

  trackByGroup(index: number, group: any): number {
    return group.id;
  }
  
  // Format cart item options for display
  formatCartItemOptions(item: CartItem): string {
    if (!item.selectedOptions || !item.product.customizationGroups) {
      return '';
    }
    
    const options: string[] = [];
    item.selectedOptions.forEach((optionId, groupId) => {
      const group = item.product.customizationGroups!.find(g => g.id === groupId);
      if (group) {
        const option = group.options.find(o => o.id === optionId);
        if (option) {
          let optionText = option.name;
          if (option.priceModifier > 0) {
            optionText += ` (+${option.priceModifier.toLocaleString()}đ)`;
          }
          options.push(optionText);
        }
      }
    });
    
    return options.join(', ');
  }
  
  // Toggle cart edit mode
  toggleCartEditMode(): void {
    this.isCartEditMode.update(v => !v);
    if (!this.isCartEditMode()) {
      this.selectedCartItems.set(new Set());
    }
  }
  
  // Toggle cart item selection
  toggleCartItemSelection(index: number): void {
    this.selectedCartItems.update(selected => {
      const newSet = new Set(selected);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }
  
  // Handle keyboard navigation for cart edit mode
  handleCartKeyDown(event: KeyboardEvent, index: number): void {
    if (!this.isCartEditMode()) return;
    
    // Space key to toggle selection
    if (event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      this.toggleCartItemSelection(index);
    }
    
    // Enter key to toggle selection
    if (event.key === 'Enter') {
      event.preventDefault();
      this.toggleCartItemSelection(index);
    }
  }
  
  // Select all cart items
  selectAllCartItems(): void {
    const allIndices = this.cart().map((_, i) => i);
    this.selectedCartItems.set(new Set(allIndices));
  }
  
  // Check if all items are selected
  areAllItemsSelected(): boolean {
    const cartLength = this.cart().length;
    const selectedLength = this.selectedCartItems().size;
    return cartLength > 0 && cartLength === selectedLength;
  }
  
  // Toggle select all
  toggleSelectAll(): void {
    if (this.areAllItemsSelected()) {
      this.selectedCartItems.set(new Set());
    } else {
      this.selectAllCartItems();
    }
  }
  
  // Delete selected cart items
  deleteSelectedCartItems(): void {
    const selected = this.selectedCartItems();
    if (selected.size === 0) return;

    const itemsToRemove = this.cart().filter((_, index) => selected.has(index));

    this.cart.update(currentCart => 
      currentCart.filter((_, index) => !selected.has(index))
    );
    this.selectedCartItems.set(new Set());
    this.isCartEditMode.set(false);

    // Sync lên server cho từng item
    itemsToRemove.forEach(item => this.syncRemoveFromServer(item));
  }
  
  // Check if delete button should be disabled
  isDeleteDisabled(): boolean {
    return this.selectedCartItems().size === 0;
  }
  
  // Error handling for images
  onBannerImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    // Prevent infinite loop by checking if already on fallback
    if (!img.src.startsWith('data:image/svg+xml')) {
      img.src = this.FALLBACK_BANNER_IMAGE;
    }
  }
  
  onProductImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    // Prevent infinite loop by checking if already on fallback
    if (!img.src.startsWith('data:image/svg+xml')) {
      img.src = this.FALLBACK_PRODUCT_IMAGE;
    }
  }
}

import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { HotToastService } from '@ngxpert/hot-toast';
import { ColorRibbonComponent } from '../../components/color-ribbon/color-ribbon.component';
import { HeroCarouselComponent } from '../../components/hero-carousel/hero-carousel.component';
import { FeaturedProductsComponent } from '../../components/featured-products/featured-products.component';
import { FeaturedShopsComponent } from '../../components/featured-shops/featured-shops.component';
import { ProductDetailModalComponent } from '../../components/product-detail-modal/product-detail-modal.component';
import { FloatingCartButtonComponent } from '../../components/floating-cart-button/floating-cart-button.component';
import { ProductItem } from '../../components/product-item/product-item.component';
import { CartService, Product, CartItem, CustomizationGroup } from '../../services/cart.service';
import { CartApiService } from '../../services/cart-api.service';
import { AuthService } from '../../services/auth.service';
import { AddToCartRequest } from '../../models/cart.model';
import { ProductService } from '../../services/product.service';
import { CategoryService, CategoryView } from '../../services/category.service';

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
  /** Display name (Vietnamese-friendly). Comes from BE category {@code name}. */
  name: string;
  /** Stable BE-side slug used as query-param when navigating to /search. */
  slug: string;
  icon: string;
  iconFill: boolean;
}

/**
 * Best-guess Material Symbol for a category name. The BE only stores name +
 * slug + description, so we map common Vietnamese food taxonomy keywords to
 * icons here. Anything unmatched falls back to {@code restaurant_menu} so
 * every chip still has an icon, no blank squares.
 */
const CATEGORY_ICON_RULES: ReadonlyArray<{ pattern: RegExp; icon: string }> = [
  { pattern: /chính|cơm|rice|main/i, icon: 'restaurant' },
  { pattern: /uống|cafe|cà phê|drink|trà|tea|nước/i, icon: 'local_cafe' },
  { pattern: /tráng|miệng|dessert|bánh ngọt|kem|ice/i, icon: 'cake' },
  { pattern: /vặt|snack|fast/i, icon: 'tapas' },
  { pattern: /chay|vegan|veget/i, icon: 'eco' },
  { pattern: /thịt|meat|bbq|nướng/i, icon: 'outdoor_grill' },
  { pattern: /hải sản|seafood|cá|tôm|cua/i, icon: 'set_meal' },
  { pattern: /pizza|pasta|mì ý/i, icon: 'local_pizza' },
  { pattern: /sushi|nhật|japan/i, icon: 'ramen_dining' },
  { pattern: /trái cây|fruit|hoa quả/i, icon: 'nutrition' },
  { pattern: /bánh|bakery|bread/i, icon: 'bakery_dining' },
  { pattern: /sạch|tươi|organic|fresh/i, icon: 'spa' },
];

function pickCategoryIcon(name: string): string {
  for (const { pattern, icon } of CATEGORY_ICON_RULES) {
    if (pattern.test(name)) return icon;
  }
  return 'restaurant_menu';
}

/**
 * HomeComponent - Main homepage container
 * 
 * Orchestrates homepage sections based on Stitch design:
 * - Hero Carousel (auto-rotating banners with flash sale, promotions, announcements)
 * - Category Chips
 * - Delivery Location Bar
 * - Featured Products section
 * - Featured Shops section
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.7, 3.8
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    ColorRibbonComponent,
    HeroCarouselComponent,
    FeaturedProductsComponent,
    FeaturedShopsComponent,
    ProductDetailModalComponent,
    FloatingCartButtonComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {
  private toast = inject(HotToastService);
  private translate = inject(TranslateService);
  private cartService = inject(CartService);
  private cartApi = inject(CartApiService);
  private authService = inject(AuthService);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  
  // Delivery address
  deliveryAddress = signal('123 Nguyễn Văn Linh, Quận 7, TP.HCM');

  // Categories for chips — populated from the BE on init. Falls back to a
  // small static list so the homepage isn't blank during the first paint
  // (or when the categories endpoint is unreachable).
  categories = signal<Category[]>([
    { id: 1, name: 'Món Chính', slug: 'mon-chinh', icon: 'restaurant', iconFill: true },
    { id: 2, name: 'Đồ Uống', slug: 'do-uong', icon: 'local_cafe', iconFill: false },
    { id: 3, name: 'Tráng Miệng', slug: 'trang-mieng', icon: 'cake', iconFill: false },
    { id: 4, name: 'Ăn Vặt', slug: 'an-vat', icon: 'tapas', iconFill: false },
    { id: 5, name: 'Đồ Chay', slug: 'do-chay', icon: 'eco', iconFill: false },
  ]);

  /** Tracks the visually selected chip. Doesn't gate navigation — the click
   * handler always navigates regardless, this is purely cosmetic for the
   * brief moment between click and route change. */
  activeCategoryId = signal(0);
  
  // Scroll state for categories
  canScrollLeft = signal(false);
  canScrollRight = signal(false);
  
  // Modal state
  selectedProduct = signal<Product | null>(null);
  isModalOpen = signal<boolean>(false);
  editingCartItem = signal<{item: CartItem, index: number} | null>(null);

  /**
   * Pending close-timer handle. Used to cancel the deferred
   * `selectedProduct.set(null)` when the user re-opens a different product
   * within the 300ms close animation window.
   */
  private closeModalTimer?: ReturnType<typeof setTimeout>;
  
  setActiveCategory(id: number) {
    this.activeCategoryId.set(id);
  }

  /**
   * Click handler for the home category chips. Navigates to the search
   * results page with the slug as a query param so the page can deep-link
   * (refresh-friendly) and share-friendly URLs.
   */
  onCategoryClick(category: Category): void {
    this.activeCategoryId.set(category.id);
    this.router.navigate(['/search'], {
      queryParams: { category: category.slug, name: category.name },
    });
  }

  /**
   * Pull system-wide categories from the BE and replace the static fallback
   * list. Active categories only — the BE flag is honoured here so admins
   * can hide categories without redeploying.
   */
  private loadCategories(): void {
    this.categoryService.listSystem().subscribe({
      next: (rows: CategoryView[]) => {
        const active = rows.filter(c => c.isActive !== false);
        if (!active.length) return; // keep fallback chips
        const mapped: Category[] = active.slice(0, 12).map((c, i) => ({
          id: i + 1,
          name: c.name,
          slug: c.slug || c.name,
          icon: pickCategoryIcon(c.name),
          iconFill: i === 0,
        }));
        this.categories.set(mapped);
        this.activeCategoryId.set(0);
      },
      error: (err) => {
        console.warn('[Home] failed to load categories, using fallback chips', err);
      },
    });
  }

  /**
   * Honour {@code /?productId=…} so deep links from the header search bar
   * land on the homepage with the correct product modal already open.
   *
   * Subscribing to {@code queryParamMap} (instead of reading the snapshot
   * once) lets the user click another search result without leaving the
   * route — the param changes, the effect fires again, the modal swaps to
   * the new product.
   */
  ngOnInit(): void {
    this.loadCategories();

    this.route.queryParamMap.subscribe(params => {
      const productId = params.get('productId');
      if (!productId) return;

      this.productService.getProductById(productId).subscribe({
        next: (response) => {
          const apiProduct = response?.data;
          if (!apiProduct) return;

          // Reuse the same mapper used when clicking a product card so the
          // modal sees a consistent shape (price as number, customization
          // groups, etc.).
          const fakeItem: ProductItem = {
            id: apiProduct.id,
            name: apiProduct.name,
            shopName: apiProduct.shopName,
            description: apiProduct.description,
            image: this.productService.getFirstImage(apiProduct),
            price: typeof apiProduct.price === 'number'
              ? apiProduct.price
              : parseFloat(apiProduct.price ?? '0'),
            sold: 0,
            rating: apiProduct.averageRating ?? 0,
            isSoldOut: (apiProduct.quantity ?? 0) === 0
          };
          this.openProductModal(this.mapApiProductToModalProduct(apiProduct, fakeItem));
        },
        error: (err) => {
          console.warn('[Home] failed to open product from query param', err);
        }
      });
    });
  }
  
  /**
   * Handle product click - open product detail modal.
   *
   * The modal opens IMMEDIATELY with the basic product info from the card.
   * The modal itself fetches the full detail via {@code getProductById}
   * once it sees a new `product` input — so we deliberately DO NOT prefetch
   * here. Prefetching duplicated the call and caused 2-3 identical
   * `GET /products/{id}` requests for one click, contributing to the
   * "everything is pending" feel.
   */
  onProductClick(product: ProductItem): void {
    this.openProductModal(this.mapProductItemToProduct(product));
  }
  
  /**
   * Handle add to cart click - identical behaviour to onProductClick. We
   * keep two methods so downstream analytics can still differentiate intent.
   */
  onAddToCartClick(product: ProductItem): void {
    this.openProductModal(this.mapProductItemToProduct(product));
  }
  
  /**
   * Map ProductItem to Product (fallback when API fails)
   */
  private mapProductItemToProduct(item: ProductItem): Product {
    return {
      id: item.id,
      name: item.name,
      price: item.price,
      originalPrice: item.originalPrice,
      image: item.image,
      sold: item.sold || 0,
      rating: item.rating,
      isSoldOut: item.isSoldOut || false,
      description: item.description,
      shopName: item.shopName,
      customizationGroups: this.generateMockCustomizationGroups({})
    };
  }
  
  /**
   * Map API Product response to modal Product with customization groups
   */
  private mapApiProductToModalProduct(apiProduct: any, originalItem: ProductItem): Product {
    // Parse images
    const images = this.productService.parseImages(apiProduct.images);
    const firstImage = images.length > 0 ? images[0] : originalItem.image;

    // BE serialises BigDecimal as JSON number; defensive parse handles
    // both string and number representations.
    const rawPrice: any = apiProduct.price;
    const numericPrice =
      typeof rawPrice === 'number' ? rawPrice : parseFloat(rawPrice ?? '0');

    // BE thêm `originalPrice` khi product đang có sale active (xem
    // ProductDetail.java + SaleApplier ở backend). Nếu không có thì rơi
    // về `originalItem.originalPrice` (data từ list view) hoặc undefined.
    const rawOriginal: any = apiProduct.originalPrice;
    const numericOriginal =
      rawOriginal != null
        ? (typeof rawOriginal === 'number'
            ? rawOriginal
            : parseFloat(rawOriginal))
        : originalItem.originalPrice;

    // TODO: Load customization groups from API when available
    // For now, generate mock customization groups based on product type
    const customizationGroups = this.generateMockCustomizationGroups(apiProduct);

    return {
      id: apiProduct.id,
      name: apiProduct.name,
      price: numericPrice,
      originalPrice:
        numericOriginal != null && numericOriginal > numericPrice
          ? numericOriginal
          : undefined,
      image: firstImage,
      sold: originalItem.sold || 0,
      rating: apiProduct.averageRating || originalItem.rating,
      isSoldOut: apiProduct.quantity === 0,
      description: apiProduct.description,
      shopName: originalItem.shopName,
      customizationGroups: customizationGroups
    };
  }
  
  /**
   * Generate mock customization groups
   * TODO: Replace with API call when backend supports customization groups
   */
  private generateMockCustomizationGroups(product: any): CustomizationGroup[] {
    // Basic customization groups for food/beverage products
    return [
      {
        id: 'size-1',
        name: 'Kích cỡ',
        required: true,
        maxSelection: 1,
        options: [
          { id: 'medium', name: 'Vừa', priceModifier: 0 },
          { id: 'large', name: 'Lớn', priceModifier: 10000 }
        ]
      },
      {
        id: 'note-1',
        name: 'Ghi chú đặc biệt',
        required: false,
        maxSelection: 1,
        options: [
          { id: 'none', name: 'Không', priceModifier: 0 },
          { id: 'less-spicy', name: 'Ít cay', priceModifier: 0 },
          { id: 'no-onion', name: 'Không hành', priceModifier: 0 }
        ]
      }
    ];
  }
  
  /**
   * Open product detail modal
   */
  openProductModal(product: Product): void {
    if (product.isSoldOut) return;
    // Cancel any pending close timer so a fast click→close→click sequence
    // doesn't end up with selectedProduct being cleared right after the
    // user opened the next product. Without this, the modal "flickers"
    // open and immediately disappears for the second click.
    if (this.closeModalTimer) {
      clearTimeout(this.closeModalTimer);
      this.closeModalTimer = undefined;
    }
    this.selectedProduct.set(product);
    this.isModalOpen.set(true);
  }
  
  /**
   * Close product detail modal
   */
  closeProductModal(): void {
    this.isModalOpen.set(false);
    if (this.closeModalTimer) {
      clearTimeout(this.closeModalTimer);
    }
    this.closeModalTimer = setTimeout(() => {
      // Only clear if the modal is still closed — guards against the user
      // re-opening another product within the 300ms animation window.
      if (!this.isModalOpen()) {
        this.selectedProduct.set(null);
        this.editingCartItem.set(null);
      }
      this.closeModalTimer = undefined;
    }, 300);
  }
  
  /**
   * Handle add to cart from modal
   */
  handleAddToCart(cartItem: CartItem): void {
    // Always update local preview cart (used by FloatingCartButton + non-logged-in users)
    this.cartService.addToCart(cartItem);
    this.toast.success(
      this.translate.instant('cart.itemAdded', { name: cartItem.product.name })
    );

    // Sync to server cart when logged in so the badge in header + /cart page stay consistent.
    // Cart-service requires UUIDs for productId; skip when local item came
    // from a non-API source (mock/demo) to avoid a 400 round-trip.
    if (
      this.authService.isAuthenticated() &&
      UUID_REGEX.test(String(cartItem.product.id))
    ) {
      this.cartApi.addItem(this.buildAddRequest(cartItem)).subscribe({
        // CartApiService đã toast lỗi & cập nhật signal cart toàn cục
        error: () => {}
      });
    }
  }
  
  /**
   * Handle update cart item from modal
   */
  handleUpdateCartItem(data: {index: number, cartItem: CartItem}): void {
    this.cartService.updateCartItem(data.index, data.cartItem);
    this.editingCartItem.set(null);
    this.toast.success(
      this.translate.instant('cart.itemUpdated')
    );

    // Sync update lên server cart (re-add as new SKU; BE merge by SKU)
    if (
      this.authService.isAuthenticated() &&
      UUID_REGEX.test(String(data.cartItem.product.id))
    ) {
      this.cartApi.addItem(this.buildAddRequest(data.cartItem)).subscribe({
        error: () => {}
      });
    }
  }

  /**
   * Build the AddToCartRequest payload from a local CartItem.
   * SKU is derived from product id + selected option ids so that two
   * items with different customizations produce different SKUs and can
   * be merged on the server side by SKU.
   */
  private buildAddRequest(cartItem: CartItem): AddToCartRequest {
    const product = cartItem.product;
    const sku = this.buildSku(cartItem);

    const variantName = this.cartService.formatCartItemOptions(cartItem) || undefined;
    const attributes = this.extractAttributes(cartItem);

    const price =
      typeof product.price === 'string'
        ? parseFloat(product.price)
        : product.price;
    const originalPrice = product.originalPrice;

    // Khi product có sale (originalPrice > price), tính discountAmount /unit
    // và truyền lên cart-service để BE tính finalPrice chuẩn.
    const discountAmount =
      originalPrice != null && originalPrice > price
        ? originalPrice - price
        : undefined;

    return {
      productId: String(product.id),
      sku,
      productName: product.name,
      productImage: product.image,
      shopId: undefined,
      shopName: product.shopName,
      quantity: cartItem.quantity,
      price,
      originalPrice,
      discountAmount,
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
   * Scroll categories left
   */
  scrollCategoriesLeft(container: HTMLElement) {
    container.scrollBy({ left: -200, behavior: 'smooth' });
    setTimeout(() => this.updateScrollButtons(container), 300);
  }
  
  /**
   * Scroll categories right
   */
  scrollCategoriesRight(container: HTMLElement) {
    container.scrollBy({ left: 200, behavior: 'smooth' });
    setTimeout(() => this.updateScrollButtons(container), 300);
  }
  
  /**
   * Update scroll button visibility
   */
  updateScrollButtons(container: HTMLElement) {
    this.canScrollLeft.set(container.scrollLeft > 0);
    this.canScrollRight.set(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
  }
  
  /**
   * Initialize scroll buttons on container
   */
  onCategoryContainerInit(container: HTMLElement) {
    this.updateScrollButtons(container);
    container.addEventListener('scroll', () => this.updateScrollButtons(container));
  }
}

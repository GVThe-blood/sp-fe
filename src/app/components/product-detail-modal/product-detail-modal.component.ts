import { Component, Input, Output, EventEmitter, signal, computed, effect, OnDestroy, OnChanges, SimpleChanges, ElementRef, ViewChild, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { animate, style, transition, trigger } from '@angular/animations';
import { StarRatingComponent } from '../star-rating/star-rating.component';
import { ProductService, Product as ApiProduct } from '../../services/product.service';
import { FeedbackService, FeedbackResponse } from '../../services/feedback.service';
import { AuthService } from '../../services/auth.service';
import { HotToastService } from '@ngxpert/hot-toast';

/**
 * UUID v1-v5 validator. We only fetch / submit feedback when the product id
 * is a real backend UUID — local mock products (numeric ids, demo seeds)
 * would otherwise round-trip a 400 from product-service.
 */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
  id: number | string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];  // Multiple images from API
  sold?: number;  // Make optional to match cart service
  likes?: number;  // Make optional
  rating?: number;
  isSoldOut?: boolean;  // Make optional to match cart service
  categoryId?: number;
  description?: string;
  customizationGroups?: CustomizationGroup[];
  shopName?: string;
  quantity?: number;  // Stock quantity from API
}

interface CartItem {
  product: Product;
  quantity: number;
  note?: string;
  selectedOptions?: Map<string, string>;
}

@Component({
  selector: 'app-product-detail-modal',
  imports: [CommonModule, FormsModule, StarRatingComponent],
  templateUrl: './product-detail-modal.component.html',
  styleUrl: './product-detail-modal.component.css',
  animations: [
    /**
     * Cross-fade + soft zoom for the product gallery image. Bound to
     * {@code currentImageIndex()} so it runs every time the user clicks
     * prev/next or thumbnail. Kept short (180ms) and uses a fast-out easing
     * so the swap feels reactive, not animated for the sake of it.
     */
    trigger('imageSwap', [
      transition('* => *', [
        style({ opacity: 0, transform: 'scale(1.04)' }),
        animate(
          '180ms cubic-bezier(0.22, 1, 0.36, 1)',
          style({ opacity: 1, transform: 'scale(1)' }),
        ),
      ]),
    ]),
  ],
})
export class ProductDetailModalComponent implements OnChanges, OnDestroy, AfterViewInit {
  @Input() product: Product | null = null;
  @Input() isOpen: boolean = false;
  @Input() editingCartItem: {item: CartItem, index: number} | null = null;
  @Output() addToCart = new EventEmitter<CartItem>();
  @Output() updateCart = new EventEmitter<{index: number, cartItem: CartItem}>();
  @Output() close = new EventEmitter<void>();
  
  @ViewChild('modalContent') modalContent?: ElementRef;
  
  // Inject services
  private productService = inject(ProductService);
  private feedbackService = inject(FeedbackService);
  private authService = inject(AuthService);
  private toast = inject(HotToastService);

  selectedOptions = signal<Map<string, string>>(new Map());
  quantity = signal<number>(1);
  customerNote = signal<string>('');
  isAddingToCart = signal<boolean>(false);
  isClosing = signal<boolean>(false);
  validationErrors = signal<Map<string, string>>(new Map());
  isEditMode = signal<boolean>(false);
  editingCartItemIndex = signal<number | null>(null);
  
  // Loading state for API calls
  isLoadingProductDetail = signal<boolean>(false);
  productDetailError = signal<string | null>(null);
  
  // Enhanced product with API data
  enhancedProduct = signal<Product | null>(null);
  
  // Current image index for gallery
  currentImageIndex = signal<number>(0);
  
  // Product review modal state
  showReviewModal = signal<boolean>(false);
  isReviewModalClosing = signal<boolean>(false);
  newComment = signal<string>('');
  newCommentValue = ''; // Two-way binding property for immediate UI updates
  newRating = signal<number>(5);
  
  /**
   * Local UI shape used by the review modal. The list is hydrated from
   * {@link FeedbackService.listByProduct} when a product opens; new
   * comments submitted by the user are prepended optimistically and the
   * BE-assigned id is patched in once the network call resolves.
   */
  productReviews = signal<Array<{
    id: number | string;
    userName: string;
    userAvatar: string;
    rating: number;
    comment: string;
    date: string;
  }>>([]);

  /** Loading state for the reviews list (skeleton in modal). */
  isLoadingReviews = signal<boolean>(false);

  /** Submit-in-flight flag so the user can't double-tap "Send". */
  isSubmittingComment = signal<boolean>(false);

  // ============= Related products (carousel + swap navigation) =============
  /**
   * Cached related products for the currently displayed product.
   *
   * UX strategy:
   *  - Render as a horizontal scroll strip at the bottom of the modal.
   *  - Click on a card → SWAP the modal content to that product (no second
   *    modal stacked on top). We push the previously-shown product onto
   *    {@link relatedHistory} so the user can hit "← Quay lại" to walk back.
   *  - We DO NOT close + reopen the modal — the container stays mounted so
   *    the position never jumps and the dual-review side-panel can keep its
   *    own state if it was open.
   *  - During the swap we briefly fade the inner content (`isSwapping`)
   *    so users see "something happened" before the new data lands.
   *
   * Backend already provides aggressive caching (Redis + product-relate job),
   * so we hit `/products/randomRelated/{id}` once per product and stash the
   * result in `relatedCache` for the lifetime of the modal session — back
   * navigation is then instant.
   */
  relatedProducts = signal<Product[]>([]);
  isLoadingRelated = signal<boolean>(false);
  isSwapping = signal<boolean>(false);

  /**
   * Stack of products the user navigated through via "related" clicks.
   * The top of the stack is the *previous* product (what "Back" returns to).
   * Bounded to {@link RELATED_HISTORY_LIMIT} so endless drilling doesn't
   * leak memory in long sessions.
   */
  private relatedHistory: Product[] = [];
  private static readonly RELATED_HISTORY_LIMIT = 12;

  /** Memo cache so back-navigation doesn't re-fetch the same list. */
  private relatedCache = new Map<string, Product[]>();

  /** Inflight token so a fast double-click doesn't fire stale API calls. */
  private relatedInflightProductId: string | null = null;

  /** Computed: shows the "Back" pill in the related strip header. */
  hasRelatedHistory = computed(() => this.relatedHistory.length > 0);
  
  private readonly FALLBACK_PRODUCT_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"%3E%3Crect fill="%23e5e7eb" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="%239ca3af"%3ENo Image%3C/text%3E%3C/svg%3E';
  private addToCartTimeout?: ReturnType<typeof setTimeout>;
  private previouslyFocusedElement?: HTMLElement;
  private focusableElements: HTMLElement[] = [];
  private keydownListener?: (e: KeyboardEvent) => void;

  totalPrice = computed(() => {
    const product = this.getDisplayProduct();
    if (!product) return 0;
    
    const basePrice = product.price;
    let optionsTotal = 0;
    
    if (product.customizationGroups) {
      this.selectedOptions().forEach((optionId, groupId) => {
        const group = product.customizationGroups!.find(g => g.id === groupId);
        if (group) {
          const option = group.options.find(o => o.id === optionId);
          if (option) {
            optionsTotal += option.priceModifier;
          }
        }
      });
    }
    
    return (basePrice + optionsTotal) * this.quantity();
  });

  /**
   * Angular lifecycle hook - called after view initialization
   */
  ngAfterViewInit(): void {
    // Setup will happen when modal opens
  }

  /**
   * Angular lifecycle hook - called when input properties change
   * Ensures modal data is reset whenever the product input changes
   */
  ngOnChanges(changes: SimpleChanges): void {
    // Reset modal data whenever the product input changes
    if (changes['product']) {
      const currentProduct = changes['product'].currentValue;
      const previousProduct = changes['product'].previousValue;
      
      // Reset if we have a new product (different from previous)
      if (currentProduct && currentProduct !== previousProduct) {
        // Parent (re)sent a fresh product → wipe our internal navigation
        // history. Otherwise the user would back into a product from a
        // previously-closed modal session, which is confusing.
        this.relatedHistory = [];

        this.resetModalData();
        // Fetch full product details from API
        this.fetchProductDetail(currentProduct.id);
        // Hydrate reviews from feedback API in parallel.
        this.loadReviews(currentProduct.id);
        // Hydrate the related-products strip in parallel — BE caches the
        // result so subsequent visits to the same product are instant.
        this.loadRelated(currentProduct.id);
      }
    }
    
    // Handle edit mode when editingCartItem changes
    if (changes['editingCartItem']) {
      const editingItem = changes['editingCartItem'].currentValue;
      if (editingItem) {
        this.openForEdit(editingItem.item, editingItem.index);
      } else {
        this.isEditMode.set(false);
        this.editingCartItemIndex.set(null);
      }
    }
    
    // Setup focus trap when modal opens
    if (changes['isOpen']) {
      if (changes['isOpen'].currentValue) {
        setTimeout(() => this.setupFocusTrap(), 100);
      } else {
        this.teardownFocusTrap();
      }
    }
  }

  /**
   * Fetch full product details from API.
   *
   * The BE wraps responses as `ResponseData<T>` whose actual JSON shape is
   * `{ appStatus, message, data }` — Lombok `@Getter` only emits `appStatus`,
   * so we must NOT key off the `code` field (which never exists in the wire
   * format). Earlier this branch checked `response.code === 200` and the body
   * never met the predicate, so the loading skeleton stayed forever and the
   * modal looked "broken/empty".
   */
  private fetchProductDetail(productId: number | string): void {
    this.isLoadingProductDetail.set(true);
    this.productDetailError.set(null);

    this.productService.getProductById(productId.toString()).subscribe({
      next: (response) => {
        const status = response.appStatus ?? response.code;
        const apiProduct = response?.data;

        if (status === 200 && apiProduct) {
          // Parse images from JSON string
          const images = this.productService.parseImages(apiProduct.images);

          // BE serialises BigDecimal as JSON number; defensive parse handles
          // both string and number representations.
          const rawPrice: any = apiProduct.price;
          const numericPrice =
            typeof rawPrice === 'number' ? rawPrice : parseFloat(rawPrice ?? '0');

          // Merge API data with existing product
          const enhanced: Product = {
            ...this.product!,
            id: apiProduct.id,
            name: apiProduct.name,
            description: apiProduct.description,
            price: numericPrice,
            images: images,
            image: images.length > 0 ? images[0] : this.product!.image,
            rating: apiProduct.averageRating || this.product!.rating,
            quantity: apiProduct.quantity,
            isSoldOut: apiProduct.quantity === 0,
            // TODO: Add customization groups from API when available
            customizationGroups:
              this.product!.customizationGroups ||
              this.generateMockCustomizationGroups(apiProduct)
          };

          this.enhancedProduct.set(enhanced);
          this.currentImageIndex.set(0);
        } else {
          // Fall back to whatever data the parent passed us so the modal still
          // has *something* to render rather than spinning forever.
          console.warn('[ProductDetailModal] unexpected response shape', response);
          this.enhancedProduct.set(this.product);
        }

        this.isLoadingProductDetail.set(false);
      },
      error: (error) => {
        console.error('[ProductDetailModal] getProductById failed', error);
        this.productDetailError.set('Không thể tải chi tiết sản phẩm');
        this.isLoadingProductDetail.set(false);
        // Use original product as fallback so the modal can still render.
        this.enhancedProduct.set(this.product);
      }
    });
  }

  /**
   * Load paginated reviews for the open product. Skip silently if the
   * caller passed a non-UUID id (mock/demo product) — there's nothing for
   * BE to find and we'd round-trip a 400.
   */
  private loadReviews(productId: number | string): void {
    const idStr = String(productId);
    if (!UUID_REGEX.test(idStr)) {
      // Non-API product (mock/demo) — clear list, no fetch.
      this.productReviews.set([]);
      return;
    }

    this.isLoadingReviews.set(true);
    this.feedbackService.listByProduct(idStr, 0, 20).subscribe({
      next: (response) => {
        const page = response?.data;
        const items = page?.content ?? [];
        this.productReviews.set(items.map(this.mapFeedbackToReview.bind(this)));
        this.isLoadingReviews.set(false);
      },
      error: (error) => {
        console.warn('[ProductDetailModal] loadReviews failed', error);
        this.productReviews.set([]);
        this.isLoadingReviews.set(false);
      }
    });
  }

  /**
   * Adapt {@link FeedbackResponse} to the local UI shape used by the
   * review list. Some fields aren't surfaced by BE yet — we fall back to
   * sensible defaults so the layout never breaks.
   */
  private mapFeedbackToReview(feedback: FeedbackResponse): {
    id: number | string;
    userName: string;
    userAvatar: string;
    rating: number;
    comment: string;
    date: string;
  } {
    return {
      id: feedback.id ?? feedback.userId ?? Date.now(),
      userName: feedback.createdBy
        ?? (feedback.userId ? `Người dùng ${feedback.userId.slice(0, 8)}` : 'Người dùng ẩn danh'),
      userAvatar: 'assets/avatars/default.png',
      rating: feedback.rate ?? 5,
      comment: feedback.content ?? '',
      date: this.formatReviewDate(feedback.createdAt ?? feedback.updatedAt)
    };
  }

  /** Format BE ISO datetime into the user-facing "HH:mm dd/MM/yyyy" form. */
  private formatReviewDate(iso?: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // ============= Related products =============

  /**
   * Load the "related products" strip for the currently displayed product.
   *
   * Behaviour:
   *  - Skips if the id isn't a real BE UUID (mock/demo product).
   *  - Memoised through {@link relatedCache} so back-navigation is instant.
   *  - Tags each in-flight call with {@link relatedInflightProductId} so a
   *    fast follow-up swap can ignore stale responses.
   *  - Falls back to the paginated {@code /products/related/{id}} endpoint
   *    when the random one is unavailable for some reason — both share the
   *    same cache key on BE, so this is essentially "best-effort".
   */
  private loadRelated(productId: number | string): void {
    const idStr = String(productId);
    if (!UUID_REGEX.test(idStr)) {
      this.relatedProducts.set([]);
      return;
    }

    // Cache hit → no network call needed.
    const cached = this.relatedCache.get(idStr);
    if (cached) {
      this.relatedProducts.set(cached);
      this.isLoadingRelated.set(false);
      return;
    }

    this.isLoadingRelated.set(true);
    this.relatedInflightProductId = idStr;

    this.productService.getRandomRelatedProducts(idStr).subscribe({
      next: (response) => {
        // Stale guard: a newer load() may already have run.
        if (this.relatedInflightProductId !== idStr) return;

        const items = (response?.data ?? []).filter(p => String(p.id) !== idStr);
        const list = items.map(p => this.adaptApiProductForRelated(p));
        this.relatedCache.set(idStr, list);
        this.relatedProducts.set(list);
        this.isLoadingRelated.set(false);
        this.relatedInflightProductId = null;
      },
      error: (error) => {
        if (this.relatedInflightProductId !== idStr) return;
        console.warn('[ProductDetailModal] loadRelated failed', error);
        this.relatedProducts.set([]);
        this.isLoadingRelated.set(false);
        this.relatedInflightProductId = null;
      }
    });
  }

  /**
   * Adapt a {@link ApiProduct} (DTO from BE) into the {@link Product} shape
   * the modal expects internally (number price, primary image, etc.).
   */
  private adaptApiProductForRelated(apiProduct: ApiProduct): Product {
    const images = this.productService.parseImages(apiProduct.images);
    const firstImage = images.length > 0 ? images[0] : this.FALLBACK_PRODUCT_IMAGE;
    const rawPrice: any = apiProduct.price;
    const numericPrice =
      typeof rawPrice === 'number' ? rawPrice : parseFloat(rawPrice ?? '0');

    return {
      id: apiProduct.id,
      name: apiProduct.name,
      price: numericPrice,
      image: firstImage,
      images,
      sold: 0,
      rating: apiProduct.averageRating ?? 0,
      isSoldOut: (apiProduct.quantity ?? 0) === 0,
      description: apiProduct.description,
      shopName: apiProduct.shopName
    };
  }

  /**
   * User clicked a related-product card. Swap the modal content to that
   * product without closing/reopening the modal; push the current product
   * onto {@link relatedHistory} so a later "Back" press can return.
   *
   * UX details:
   *  - Triggers a 180ms swap animation via {@link isSwapping} so the
   *    transition feels intentional rather than a content "snap".
   *  - Opens the brand-new product right inside the same modal instance —
   *    avoids stacking 2 modals on top of each other (bad on mobile).
   *  - Closes the side review panel if it was open since it's tied to
   *    the previous product's reviews.
   */
  openRelatedProduct(product: Product): void {
    if (!product || product.isSoldOut) return;

    const current = this.getDisplayProduct() ?? this.product;
    if (current) {
      this.relatedHistory.push(current);
      // Bound history so it doesn't grow forever in long sessions.
      if (this.relatedHistory.length > ProductDetailModalComponent.RELATED_HISTORY_LIMIT) {
        this.relatedHistory.shift();
      }
    }

    this.swapToProduct(product);
  }

  /**
   * Pop the most-recent product off {@link relatedHistory} and swap to it.
   * Disabled when history is empty (the chevron pill hides via
   * {@link hasRelatedHistory}).
   */
  goBackToPreviousProduct(): void {
    const previous = this.relatedHistory.pop();
    if (!previous) return;
    this.swapToProduct(previous);
  }

  /**
   * Internal helper that performs the in-place swap. Drives the fade
   * animation, updates the {@link product} input slot, then restarts the
   * normal "open product" pipeline (fetch detail + reviews + related).
   */
  private swapToProduct(next: Product): void {
    this.isSwapping.set(true);

    // Close any stacked side review panel — its content was tied to the
    // outgoing product.
    if (this.showReviewModal()) {
      this.isReviewModalClosing.set(true);
      setTimeout(() => {
        this.showReviewModal.set(false);
        this.isReviewModalClosing.set(false);
      }, 250);
    }

    // Imperatively replace the input. We can't @Output the change because
    // the parent isn't necessarily wired to react — modal owns navigation
    // when the strip is used.
    this.product = next;

    // Rerun the normal data-fetch pipeline so we don't duplicate logic.
    this.resetModalData();
    this.fetchProductDetail(next.id);
    this.loadReviews(next.id);
    this.loadRelated(next.id);

    // Scroll back to the top so the user sees the product image, not the
    // bottom of the previous modal (which is where the related strip is).
    setTimeout(() => {
      const scrollEl = document.querySelector('.modal-scroll-content') as HTMLElement;
      if (scrollEl) scrollEl.scrollTop = 0;
      this.isSwapping.set(false);
    }, 200);
  }
  
  /**
   * Generate mock customization groups
   * TODO: Replace with API call when backend supports customization groups
   */
  private generateMockCustomizationGroups(apiProduct: ApiProduct): CustomizationGroup[] {
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
   * Get display product (enhanced if available, otherwise original)
   */
  getDisplayProduct(): Product | null {
    return this.enhancedProduct() || this.product;
  }
  
  /**
   * Navigate to previous image
   */
  previousImage(): void {
    const product = this.getDisplayProduct();
    if (!product?.images || product.images.length <= 1) return;
    
    this.currentImageIndex.update(index => 
      index === 0 ? product.images!.length - 1 : index - 1
    );
  }
  
  /**
   * Navigate to next image
   */
  nextImage(): void {
    const product = this.getDisplayProduct();
    if (!product?.images || product.images.length <= 1) return;
    
    this.currentImageIndex.update(index => 
      index === product.images!.length - 1 ? 0 : index + 1
    );
  }
  
  /**
   * Get current image URL
   */
  getCurrentImage(): string {
    const product = this.getDisplayProduct();
    if (!product) return this.FALLBACK_PRODUCT_IMAGE;
    
    if (product.images && product.images.length > 0) {
      return product.images[this.currentImageIndex()];
    }
    
    return product.image || this.FALLBACK_PRODUCT_IMAGE;
  }
  
  /**
   * Check if product has multiple images
   */
  hasMultipleImages(): boolean {
    const product = this.getDisplayProduct();
    return (product?.images?.length || 0) > 1;
  }
  
  /**
   * Reset all modal data to default values
   * Called when product changes to ensure clean state
   */
  private resetModalData(): void {
    // Reset quantity to 1
    this.quantity.set(1);
    
    // Clear customer note
    this.customerNote.set('');
    
    // Clear validation errors
    this.validationErrors.set(new Map());
    
    // Reset image index
    this.currentImageIndex.set(0);
    
    // Clear enhanced product
    this.enhancedProduct.set(null);
    
    // Reset selectedOptions to defaults (required groups only)
    const newSelections = new Map<string, string>();
    if (this.product?.customizationGroups) {
      this.product.customizationGroups.forEach(group => {
        if (group.required && group.options.length > 0) {
          newSelections.set(group.id, group.options[0].id);
        }
      });
    }
    this.selectedOptions.set(newSelections);
  }

  onOverlayClick() {
    this.closeModal();
  }

  closeModal() {
    // Close review modal first if open
    if (this.showReviewModal()) {
      this.isReviewModalClosing.set(true);
    }
    
    // Trigger closing animation
    this.isClosing.set(true);
    
    // Teardown focus trap
    this.teardownFocusTrap();
    
    // Wait for animation to complete before actually closing
    setTimeout(() => {
      this.isClosing.set(false);
      this.showReviewModal.set(false);
      this.isReviewModalClosing.set(false);
      this.close.emit();
      
      // Restore focus to previously focused element
      if (this.previouslyFocusedElement) {
        this.previouslyFocusedElement.focus();
        this.previouslyFocusedElement = undefined;
      }
    }, 300); // Match animation duration
  }

  incrementQuantity() {
    this.quantity.update(q => q + 1);
  }

  decrementQuantity() {
    this.quantity.update(q => Math.max(1, q - 1));
  }

  selectOption(groupId: string, optionId: string) {
    this.selectedOptions.update(options => {
      const newOptions = new Map(options);
      newOptions.set(groupId, optionId);
      return newOptions;
    });
    
    // Clear validation error for this group when an option is selected
    this.validationErrors.update(errors => {
      const newErrors = new Map(errors);
      newErrors.delete(groupId);
      return newErrors;
    });
  }

  isOptionSelected(groupId: string, optionId: string): boolean {
    return this.selectedOptions().get(groupId) === optionId;
  }
  
  // Validate that all required customization options are selected
  private validateSelections(): boolean {
    const product = this.getDisplayProduct();
    if (!product || !product.customizationGroups) return true;
    
    const errors = new Map<string, string>();
    
    for (const group of product.customizationGroups) {
      if (group.required) {
        const selectedOption = this.selectedOptions().get(group.id);
        if (!selectedOption) {
          errors.set(group.id, 'Vui lòng chọn một tùy chọn');
        }
      }
    }
    
    this.validationErrors.set(errors);
    return errors.size === 0;
  }
  
  // Check if there are any validation errors for a specific group
  getValidationError(groupId: string): string | undefined {
    return this.validationErrors().get(groupId);
  }

  onAddToCart() {
    const product = this.getDisplayProduct();
    if (!product || this.isAddingToCart()) return;
    
    // Check if product is sold out
    if (product.isSoldOut || (product.quantity !== undefined && product.quantity === 0)) {
      this.toast.error('Sản phẩm đã hết hàng');
      return;
    }
    
    // Validate selections before proceeding
    if (!this.validateSelections()) {
      return; // Show validation errors, don't proceed
    }
    
    this.isAddingToCart.set(true);

    const cartItem: CartItem = {
      product: product,
      quantity: this.quantity(),
      note: this.customerNote() || undefined,
      selectedOptions: new Map(this.selectedOptions())
    };

    // Debounce to prevent rapid clicks - emit after 500ms
    this.addToCartTimeout = setTimeout(() => {
      if (this.isEditMode()) {
        // Update existing cart item
        this.updateCart.emit({
          index: this.editingCartItemIndex()!,
          cartItem: cartItem
        });
      } else {
        // Add new cart item
        this.addToCart.emit(cartItem);
      }
      this.isAddingToCart.set(false);
      this.addToCartTimeout = undefined;
      this.closeModal();
    }, 500);
  }
  
  // Open modal for editing existing cart item
  openForEdit(cartItem: CartItem, index: number): void {
    this.isEditMode.set(true);
    this.editingCartItemIndex.set(index);
    this.quantity.set(cartItem.quantity);
    this.customerNote.set(cartItem.note || '');
    
    // Pre-select options from cart item
    if (cartItem.selectedOptions) {
      this.selectedOptions.set(new Map(cartItem.selectedOptions));
    }
  }

  formatPrice(price: number): string {
    return price.toLocaleString('vi-VN');
  }

  // Categorize customization groups into small (2-column) and large (full-width)
  getSmallGroups(): CustomizationGroup[] {
    const product = this.getDisplayProduct();
    if (!product?.customizationGroups) return [];
    
    // Small groups: size, temperature, ice level, sugar level (typically 2-4 options)
    const smallGroupNames = ['size', 'kích thước', 'temperature', 'nhiệt độ', 'ice', 'đá', 'sugar', 'đường'];
    
    return product.customizationGroups.filter(group => {
      const groupNameLower = group.name.toLowerCase();
      const hasSmallName = smallGroupNames.some(name => groupNameLower.includes(name));
      const hasFewerOptions = group.options.length <= 4;
      return hasSmallName || hasFewerOptions;
    });
  }

  getLargeGroups(): CustomizationGroup[] {
    const product = this.getDisplayProduct();
    if (!product?.customizationGroups) return [];
    
    const smallGroups = this.getSmallGroups();
    const smallGroupIds = new Set(smallGroups.map(g => g.id));
    
    return product.customizationGroups.filter(group => !smallGroupIds.has(group.id));
  }

  // TrackBy functions for performance optimization
  trackByGroup(index: number, group: CustomizationGroup): string {
    return group.id;
  }

  trackByOption(index: number, option: CustomizationOption): string {
    return option.id;
  }
  
  // Error handling for images
  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    // Prevent infinite loop by checking if already on fallback
    if (!img.src.startsWith('data:image/svg+xml')) {
      img.src = this.FALLBACK_PRODUCT_IMAGE;
    }
  }
  
  // Open review modal
  openReviewModal() {
    this.showReviewModal.set(true);
    this.isReviewModalClosing.set(false);
  }
  
  // Close review modal only (keep product modal open)
  closeReviewModal() {
    this.isReviewModalClosing.set(true);
    setTimeout(() => {
      this.showReviewModal.set(false);
      this.isReviewModalClosing.set(false);
    }, 300);
  }
  
  // Close both modals
  closeAllModals() {
    // First close review modal
    if (this.showReviewModal()) {
      this.isReviewModalClosing.set(true);
    }
    // Then close product modal
    this.closeModal();
  }
  
  // Calculate average rating
  getAverageRating(): number {
    const reviews = this.productReviews();
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }
  
  // Get rating circle size based on rating (scales from 36px at 1 star to 72px at 5 stars)
  getRatingCircleSize(): number {
    const rating = this.getAverageRating();
    const minSize = 36; // Minimum size at rating 1
    const maxSize = 72; // Maximum size at rating 5
    // Linear interpolation: size = minSize + (rating - 1) * (maxSize - minSize) / 4
    return Math.round(minSize + (rating - 1) * (maxSize - minSize) / 4);
  }
  
  // Get font size for rating number (scales proportionally with circle)
  getRatingFontSize(): number {
    const circleSize = this.getRatingCircleSize();
    return Math.round(circleSize * 0.3); // Font is ~30% of circle size
  }
  
  // Get star badge size (scales proportionally with circle)
  getStarBadgeSize(): number {
    const circleSize = this.getRatingCircleSize();
    return Math.round(circleSize * 0.35); // Badge is ~35% of circle size
  }
  
  // Get star fill percentage for partial star display (1-indexed)
  getStarFillPercentage(starIndex: number): number {
    const rating = this.getAverageRating();
    const fillAmount = rating - (starIndex - 1);
    return Math.max(0, Math.min(1, fillAmount)) * 100;
  }
  
  // Calculate rating distribution (percentage for each star level)
  getRatingDistribution(): { star: number; count: number; percentage: number }[] {
    const reviews = this.productReviews();
    const total = reviews.length;
    
    // Count reviews for each star level (5 to 1)
    const distribution = [5, 4, 3, 2, 1].map(star => {
      const count = reviews.filter(r => r.rating === star).length;
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
      return { star, count, percentage };
    });
    
    return distribution;
  }
  
  // Set rating for new comment
  setNewRating(rating: number) {
    this.newRating.set(rating);
  }
  
  // Check if comment is valid (has non-whitespace content)
  isCommentValid(): boolean {
    return this.newCommentValue.trim().length > 0;
  }
  
  /**
   * Submit a new review. The flow:
   * 1. Validate inputs (must be logged in, comment non-empty, real product UUID).
   * 2. Optimistically prepend a placeholder so the user sees their comment instantly.
   * 3. Call POST /feedback. On success → patch the placeholder with the
   *    BE-assigned id; on failure → roll back the optimistic insert and toast.
   */
  submitComment() {
    const comment = this.newCommentValue.trim();
    if (!comment) return;
    if (this.isSubmittingComment()) return;

    if (!this.authService.isAuthenticated()) {
      this.toast.error('Vui lòng đăng nhập để đánh giá sản phẩm');
      return;
    }

    const product = this.getDisplayProduct();
    const productId = product ? String(product.id) : '';
    if (!UUID_REGEX.test(productId)) {
      this.toast.error('Sản phẩm này chưa hỗ trợ đánh giá');
      return;
    }

    const tempId = `local-${Date.now()}`;
    const optimistic = {
      id: tempId,
      userName: 'Bạn',
      userAvatar: 'assets/avatars/default.png',
      rating: this.newRating(),
      comment: comment,
      date: new Date().toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    };

    this.productReviews.update(reviews => [optimistic, ...reviews]);
    this.isSubmittingComment.set(true);

    this.feedbackService
      .create({
        productId,
        rating: this.newRating(),
        content: comment,
        type: 'PRODUCT_FEEDBACK'
      })
      .subscribe({
        next: (response) => {
          const created = response?.data;
          if (created) {
            // Patch the optimistic row with the persisted feedback fields so
            // a subsequent edit/delete can target the BE id.
            this.productReviews.update(list =>
              list.map(r =>
                r.id === tempId ? this.mapFeedbackToReview(created) : r
              )
            );
          }
          this.toast.success('Cảm ơn đánh giá của bạn');
          this.isSubmittingComment.set(false);
          this.resetCommentInput();
        },
        error: (error) => {
          console.error('[ProductDetailModal] submitComment failed', error);
          // Roll back the optimistic insert so the user knows it didn't go through.
          this.productReviews.update(list => list.filter(r => r.id !== tempId));
          this.toast.error(
            error?.error?.message ?? 'Không thể gửi đánh giá, thử lại sau'
          );
          this.isSubmittingComment.set(false);
        }
      });
  }

  /** Reset the textarea + rating after a successful submission. */
  private resetCommentInput(): void {
    this.newCommentValue = '';
    this.newComment.set('');
    this.newRating.set(5);
    const textarea = document.querySelector('.comment-textarea') as HTMLTextAreaElement;
    if (textarea) {
      textarea.style.height = '44px';
    }
  }
  
  // Handle comment input - updates value immediately on each keystroke
  onCommentInput(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    this.newCommentValue = textarea.value;
    
    // Auto-expand textarea
    textarea.style.height = '44px'; // Reset to min height (matches button height)
    const scrollHeight = textarea.scrollHeight;
    const maxHeight = 120; // Max height in pixels
    textarea.style.height = Math.min(scrollHeight, maxHeight) + 'px';
  }
  
  // Auto-expand textarea as user types (kept for backward compatibility)
  autoExpandTextarea(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = '44px'; // Reset to min height (matches button height)
    const scrollHeight = textarea.scrollHeight;
    const maxHeight = 120; // Max height in pixels
    textarea.style.height = Math.min(scrollHeight, maxHeight) + 'px';
  }
  
  ngOnDestroy() {
    // Clean up timeout on component destroy
    if (this.addToCartTimeout) {
      clearTimeout(this.addToCartTimeout);
    }
    
    // Clean up focus trap
    this.teardownFocusTrap();
  }
  
  /**
   * Setup focus trap to keep focus within modal
   */
  private setupFocusTrap(): void {
    // Store currently focused element to restore later
    this.previouslyFocusedElement = document.activeElement as HTMLElement;
    
    // Get all focusable elements within modal
    const modalElement = document.querySelector('[role="dialog"]');
    if (!modalElement) return;
    
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');
    
    this.focusableElements = Array.from(
      modalElement.querySelectorAll(focusableSelectors)
    ) as HTMLElement[];
    
    // Focus first focusable element (close button)
    if (this.focusableElements.length > 0) {
      this.focusableElements[0].focus();
    }
    
    // Add keyboard event listener
    this.keydownListener = (e: KeyboardEvent) => this.handleKeyDown(e);
    document.addEventListener('keydown', this.keydownListener);
  }
  
  /**
   * Teardown focus trap
   */
  private teardownFocusTrap(): void {
    if (this.keydownListener) {
      document.removeEventListener('keydown', this.keydownListener);
      this.keydownListener = undefined;
    }
    this.focusableElements = [];
  }
  
  /**
   * Handle keyboard navigation within modal
   */
  private handleKeyDown(e: KeyboardEvent): void {
    // Close modal on Escape key
    if (e.key === 'Escape') {
      e.preventDefault();
      this.closeModal();
      return;
    }
    
    // Handle Tab key for focus trap
    if (e.key === 'Tab') {
      if (this.focusableElements.length === 0) return;
      
      const firstElement = this.focusableElements[0];
      const lastElement = this.focusableElements[this.focusableElements.length - 1];
      
      if (e.shiftKey) {
        // Shift + Tab: move focus backwards
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: move focus forwards
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  }
}

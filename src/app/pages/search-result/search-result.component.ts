import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HotToastService } from '@ngxpert/hot-toast';
import { map, Observable, of } from 'rxjs';

import {
  ProductItem,
  ProductItemComponent,
} from '../../components/product-item/product-item.component';
import { ProductDetailModalComponent } from '../../components/product-detail-modal/product-detail-modal.component';
import { FloatingCartButtonComponent } from '../../components/floating-cart-button/floating-cart-button.component';

import {
  Product as ApiProduct,
  ProductService,
} from '../../services/product.service';
import { CategoryService, CategoryView } from '../../services/category.service';
import {
  CartItem,
  CartService,
  CustomizationGroup,
  Product,
} from '../../services/cart.service';
import { CartApiService } from '../../services/cart-api.service';
import { AuthService } from '../../services/auth.service';
import { AddToCartRequest } from '../../models/cart.model';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const PAGE_SIZE = 20;

/**
 * Possible search "modes" inferred from the query params.
 *
 * - {@code keyword}  — header search submission. Hits {@code /products/search?keyword=}.
 * - {@code category} — chip click on the homepage. Resolved to a category
 *   name + slug; products are pulled via the same {@code /products/search}
 *   endpoint with the keyword set to the category display name. The BE
 *   currently has no first-class "by-category" public endpoint that spans
 *   shops, but the search endpoint matches name/description (case-insensitive
 *   contains) which is good enough for our seed data + display labels. When
 *   the BE adds a real category filter, swap the loader call below.
 * - {@code none}     — no params; renders an empty-state CTA.
 */
type SearchMode = 'keyword' | 'category' | 'none';

interface SearchRequest {
  mode: SearchMode;
  keyword: string;
  categorySlug: string;
  categoryName: string;
  page: number;
}

interface ProductPage {
  items: ApiProduct[];
  total: number;
  totalPages: number;
}

/**
 * Public search-results page.
 *
 * <p>Driven entirely by query params so the URL is shareable / refreshable:</p>
 * <ul>
 *   <li>{@code /search?keyword=foo} — header search submission</li>
 *   <li>{@code /search?category=mon-chinh&name=Món+Chính} — homepage chip click</li>
 * </ul>
 *
 * <p>Reuses the existing {@link ProductItemComponent} and product detail
 * modal so the visual + interaction language matches the rest of the app
 * (favorite toggle, add to cart, modal customisation, etc.).</p>
 */
@Component({
  selector: 'app-search-result',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    ProductItemComponent,
    ProductDetailModalComponent,
    FloatingCartButtonComponent,
  ],
  templateUrl: './search-result.component.html',
  styleUrl: './search-result.component.css',
})
export class SearchResultComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private toast = inject(HotToastService);

  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private cartService = inject(CartService);
  private cartApi = inject(CartApiService);
  private authService = inject(AuthService);

  // -----------------------------------------------------------------
  // Query-param state
  // -----------------------------------------------------------------
  protected readonly keyword = signal('');
  protected readonly categorySlug = signal('');
  protected readonly categoryName = signal('');
  protected readonly page = signal(0);
  /** Live-edit value bound to the page's input; submitted via Enter / button. */
  protected readonly draftKeyword = signal('');

  protected readonly mode = computed<SearchMode>(() => {
    if (this.categorySlug()) return 'category';
    if (this.keyword()) return 'keyword';
    return 'none';
  });

  protected readonly headerTitle = computed(() => {
    const cat = this.categoryName() || this.categorySlug();
    const kw = this.keyword();
    if (this.mode() === 'category') {
      return kw
        ? `${cat || 'Danh mục'} · "${kw}"`
        : (cat || 'Danh mục');
    }
    if (this.mode() === 'keyword') return `Kết quả cho "${kw}"`;
    return 'Tìm kiếm sản phẩm';
  });

  /** Light fallback list of all categories (system-wide) for the side panel. */
  private readonly allCategories = signal<CategoryView[]>([]);
  protected readonly displayedCategories = computed(() =>
    this.allCategories()
      .filter(c => c.isActive !== false)
      .slice(0, 16)
  );

  constructor() {
    // Bind URL → signals once. queryParamMap is a stream so back/forward
    // navigation re-runs this without reloading the route component.
    this.route.queryParamMap.subscribe(params => {
      this.keyword.set((params.get('keyword') ?? '').trim());
      this.categorySlug.set((params.get('category') ?? '').trim());
      this.categoryName.set((params.get('name') ?? '').trim());
      const rawPage = parseInt(params.get('page') ?? '0', 10);
      this.page.set(Number.isFinite(rawPage) && rawPage >= 0 ? rawPage : 0);
      this.draftKeyword.set(this.keyword());
    });

    // Resolve a missing display name when only the slug is provided in the
    // URL (e.g. user shared a `/search?category=mon-chinh` link). Only fires
    // when the side category cache + slug both have values.
    effect(() => {
      const slug = this.categorySlug();
      if (!slug) return;
      if (this.categoryName()) return;
      const found = this.allCategories().find(c => c.slug === slug);
      if (found) this.categoryName.set(found.name);
    });

    // Lazy-load the category list once on mount. Used by the inferred
    // display-name effect above + the "browse other categories" sidebar.
    this.categoryService.listSystem().subscribe({
      next: rows => this.allCategories.set(rows ?? []),
      error: err =>
        console.warn('[SearchResult] failed to load category sidebar', err),
    });
  }

  // -----------------------------------------------------------------
  // Data loading
  // -----------------------------------------------------------------
  /**
   * Build the search request that drives the {@code rxResource} loader. We
   * compute it as a signal so {@link rxResource} re-fetches whenever any of
   * the URL-driven signals change.
   */
  private readonly request = computed<SearchRequest>(() => ({
    mode: this.mode(),
    keyword: this.keyword(),
    categorySlug: this.categorySlug(),
    categoryName: this.categoryName(),
    page: this.page(),
  }));

  protected readonly products = rxResource<ProductPage, SearchRequest>({
    request: () => this.request(),
    loader: ({ request }) => {
      // Category mode → hit the dedicated cross-shop category endpoint, which
      // matches by slug OR display name and returns proper Page<ProductDetail>
      // straight from `springfood_product.product_categories`. The optional
      // keyword still narrows results within the category.
      if (request.mode === 'category') {
        const key = request.categorySlug || request.categoryName;
        if (!key) return of<ProductPage>({ items: [], total: 0, totalPages: 0 });
        return this.productService
          .searchByCategory(key, request.keyword, request.page, PAGE_SIZE)
          .pipe(
            map(res => {
              const data = res?.data;
              return {
                items: data?.content ?? [],
                total: data?.totalElements ?? 0,
                totalPages: data?.totalPages ?? 0,
              } as ProductPage;
            })
          );
      }

      // Keyword mode (header search submission) → the global keyword search.
      // No keyword + no category → render an empty state without hitting BE.
      if (!request.keyword) {
        return of<ProductPage>({ items: [], total: 0, totalPages: 0 });
      }
      return this.productService
        .searchByKeyword(request.keyword, request.page, PAGE_SIZE)
        .pipe(
          map(res => {
            const data = res?.data;
            return {
              items: data?.content ?? [],
              total: data?.totalElements ?? 0,
              totalPages: data?.totalPages ?? 0,
            } as ProductPage;
          })
        );
    },
  });

  protected readonly isLoading = computed(() => this.products.isLoading());
  protected readonly errorMessage = computed(() => {
    const err = this.products.error() as { message?: string } | undefined;
    return err?.message ?? null;
  });
  protected readonly items = computed(
    () => this.products.value()?.items ?? []
  );
  protected readonly totalItems = computed(
    () => this.products.value()?.total ?? 0
  );
  protected readonly totalPages = computed(
    () => this.products.value()?.totalPages ?? 0
  );
  protected readonly hasResults = computed(() => this.items().length > 0);

  // -----------------------------------------------------------------
  // Search submission (keyword input on the page itself)
  // -----------------------------------------------------------------
  protected onDraftInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.draftKeyword.set(value);
  }

  protected submitSearch(): void {
    const term = this.draftKeyword().trim();
    // In category mode we keep the category filter and use the keyword as
    // an in-category narrower (BE supports this). In keyword/none mode the
    // keyword fully drives the URL.
    if (this.mode() === 'category') {
      const merged: Record<string, string | number> = {
        category: this.categorySlug(),
        page: 0,
      };
      if (this.categoryName()) merged['name'] = this.categoryName();
      if (term) merged['keyword'] = term;
      this.router.navigate(['/search'], { queryParams: merged });
      return;
    }
    if (!term) return;
    this.router.navigate(['/search'], {
      queryParams: { keyword: term, page: 0 },
    });
  }

  protected clearKeyword(): void {
    this.draftKeyword.set('');
  }

  protected jumpToCategory(c: CategoryView): void {
    this.router.navigate(['/search'], {
      queryParams: { category: c.slug || c.name, name: c.name, page: 0 },
    });
  }

  // -----------------------------------------------------------------
  // Pagination
  // -----------------------------------------------------------------
  protected prevPage(): void {
    if (this.page() <= 0) return;
    this.gotoPage(this.page() - 1);
  }
  protected nextPage(): void {
    if (this.page() + 1 >= this.totalPages()) return;
    this.gotoPage(this.page() + 1);
  }
  private gotoPage(target: number): void {
    const merged = {
      ...this.route.snapshot.queryParams,
      page: target,
    };
    this.router.navigate(['/search'], { queryParams: merged });
  }

  // -----------------------------------------------------------------
  // Convert API product → ProductItem for rendering
  // -----------------------------------------------------------------
  protected toProductItem(p: ApiProduct): ProductItem {
    const price =
      typeof p.price === 'number' ? p.price : parseFloat(p.price ?? '0');
    const original =
      p.originalPrice != null
        ? typeof p.originalPrice === 'number'
          ? p.originalPrice
          : parseFloat(p.originalPrice as string)
        : undefined;
    return {
      id: p.id,
      name: p.name,
      shopName: p.shopName,
      description: p.description,
      image: this.productService.getFirstImage(p),
      price,
      originalPrice: original != null && original > price ? original : undefined,
      sold: 0,
      rating: p.averageRating ?? 0,
      isSoldOut: (p.quantity ?? 0) === 0,
    };
  }

  // -----------------------------------------------------------------
  // Modal — same UX as homepage
  // -----------------------------------------------------------------
  protected readonly selectedProduct = signal<Product | null>(null);
  protected readonly isModalOpen = signal(false);
  private closeModalTimer?: ReturnType<typeof setTimeout>;

  protected onProductClick(item: ProductItem): void {
    const apiProduct = this.items().find(p => p.id === item.id);
    if (!apiProduct) {
      this.openProductModal(this.mapItemToModal(item));
      return;
    }

    // Fetch the full detail to honour BE-side variants / sale fields, then
    // open. Falls back to the list-row data on error so the modal still
    // shows the product the user picked.
    this.productService.getProductById(apiProduct.id).subscribe({
      next: res => {
        const fresh = res?.data ?? apiProduct;
        this.openProductModal(this.mapApiToModal(fresh, item));
      },
      error: () => this.openProductModal(this.mapItemToModal(item)),
    });
  }

  protected onAddToCartClick(item: ProductItem): void {
    this.onProductClick(item);
  }

  protected closeProductModal(): void {
    this.isModalOpen.set(false);
    if (this.closeModalTimer) clearTimeout(this.closeModalTimer);
    this.closeModalTimer = setTimeout(() => {
      if (!this.isModalOpen()) this.selectedProduct.set(null);
    }, 300);
  }

  private openProductModal(p: Product): void {
    if (p.isSoldOut) return;
    if (this.closeModalTimer) {
      clearTimeout(this.closeModalTimer);
      this.closeModalTimer = undefined;
    }
    this.selectedProduct.set(p);
    this.isModalOpen.set(true);
  }

  private mapItemToModal(item: ProductItem): Product {
    return {
      id: item.id,
      name: item.name,
      price: item.price,
      originalPrice: item.originalPrice,
      image: item.image,
      sold: item.sold ?? 0,
      rating: item.rating ?? 0,
      isSoldOut: item.isSoldOut ?? false,
      description: item.description,
      shopName: item.shopName,
      customizationGroups: this.defaultCustomizationGroups(),
    };
  }

  private mapApiToModal(api: ApiProduct, fallback: ProductItem): Product {
    const price =
      typeof api.price === 'number' ? api.price : parseFloat(api.price ?? '0');
    const original =
      api.originalPrice != null
        ? typeof api.originalPrice === 'number'
          ? api.originalPrice
          : parseFloat(api.originalPrice as string)
        : fallback.originalPrice;
    return {
      id: api.id,
      name: api.name,
      price,
      originalPrice:
        original != null && original > price ? original : undefined,
      image: this.productService.getFirstImage(api) || fallback.image,
      sold: fallback.sold ?? 0,
      rating: api.averageRating ?? fallback.rating ?? 0,
      isSoldOut: (api.quantity ?? 0) === 0,
      description: api.description ?? fallback.description,
      shopName: api.shopName ?? fallback.shopName,
      customizationGroups: this.defaultCustomizationGroups(),
    };
  }

  private defaultCustomizationGroups(): CustomizationGroup[] {
    return [
      {
        id: 'size-1',
        name: 'Kích cỡ',
        required: true,
        maxSelection: 1,
        options: [
          { id: 'medium', name: 'Vừa', priceModifier: 0 },
          { id: 'large', name: 'Lớn', priceModifier: 10000 },
        ],
      },
      {
        id: 'note-1',
        name: 'Ghi chú đặc biệt',
        required: false,
        maxSelection: 1,
        options: [
          { id: 'none', name: 'Không', priceModifier: 0 },
          { id: 'less-spicy', name: 'Ít cay', priceModifier: 0 },
          { id: 'no-onion', name: 'Không hành', priceModifier: 0 },
        ],
      },
    ];
  }

  // -----------------------------------------------------------------
  // Cart sync — mirrors HomeComponent
  // -----------------------------------------------------------------
  protected handleAddToCart(cartItem: CartItem): void {
    this.cartService.addToCart(cartItem);
    this.toast.success(
      this.translate.instant('cart.itemAdded', { name: cartItem.product.name })
    );
    if (
      this.authService.isAuthenticated() &&
      UUID_REGEX.test(String(cartItem.product.id))
    ) {
      this.cartApi.addItem(this.buildAddRequest(cartItem)).subscribe({
        error: () => {},
      });
    }
  }

  protected handleUpdateCartItem(data: {
    index: number;
    cartItem: CartItem;
  }): void {
    this.cartService.updateCartItem(data.index, data.cartItem);
    this.toast.success(this.translate.instant('cart.itemUpdated'));
    if (
      this.authService.isAuthenticated() &&
      UUID_REGEX.test(String(data.cartItem.product.id))
    ) {
      this.cartApi.addItem(this.buildAddRequest(data.cartItem)).subscribe({
        error: () => {},
      });
    }
  }

  private buildAddRequest(cartItem: CartItem): AddToCartRequest {
    const product = cartItem.product;
    const price =
      typeof product.price === 'string'
        ? parseFloat(product.price)
        : product.price;
    const originalPrice = product.originalPrice;
    const discountAmount =
      originalPrice != null && originalPrice > price
        ? originalPrice - price
        : undefined;
    const variantName =
      this.cartService.formatCartItemOptions(cartItem) || undefined;

    const sku = this.buildSku(cartItem);

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

  protected formatNumber(n: number | null | undefined): string {
    return new Intl.NumberFormat('vi-VN').format(Number(n) || 0);
  }
}

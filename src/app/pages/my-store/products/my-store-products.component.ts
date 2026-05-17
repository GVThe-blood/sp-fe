import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HotToastService } from '@ngxpert/hot-toast';
import {
  ProductService,
  Product,
  CategoryOption,
  CreateProductRequest
} from '../../../services/product.service';
import { ShopOwnerService } from '../../../services/shop-owner.service';
import { ProfileSidebarComponent } from '../../../components/profile-sidebar/profile-sidebar.component';
import { StoreSidebarComponent } from '../../../components/store-sidebar/store-sidebar.component';

/**
 * Form-shape of the product editor — uses primitive types so two-way binding
 * with native inputs stays simple.
 */
interface ProductFormState {
  id: string | null;
  name: string;
  description: string;
  price: string;
  wholesalePrice: string;
  quantity: number;
  sku: string;
  status: 'AVAILABLE' | 'OUT_OF_STOCK' | 'DISABLED';
  /** Selected category slug names (each one is a primary key in `categories`). */
  selectedCategories: string[];
  /** Comma-separated image URLs entered by the user. */
  imagesText: string;
  msg: string;
  exp: string;
}

const EMPTY_FORM = (): ProductFormState => ({
  id: null,
  name: '',
  description: '',
  price: '',
  wholesalePrice: '',
  quantity: 0,
  sku: '',
  status: 'AVAILABLE',
  selectedCategories: [],
  imagesText: '',
  msg: '',
  exp: ''
});

/**
 * MyStoreProductsComponent — shop-owner CRUD for products.
 *
 * Wires the shop-owner side of the product-service REST API:
 *  • GET    /products/shop          — listing (signal `products`)
 *  • POST   /products/              — create
 *  • PUT    /products/{id}          — update
 *  • DELETE /products/{id}          — delete
 *  • GET    /products/categories    — pick-list when editing
 *
 * The form is intentionally compact: we ask only for the fields the BE
 * `ProductRequest` validates against. Image upload to MinIO is left for a
 * future iteration — for now the user pastes image URLs (matches how the
 * Excel batch import populates them).
 */
@Component({
  selector: 'app-my-store-products',
  standalone: true,
  imports: [CommonModule, FormsModule, ProfileSidebarComponent, StoreSidebarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './my-store-products.component.html',
  styleUrl: './my-store-products.component.css'
})
export class MyStoreProductsComponent {
  private productService = inject(ProductService);
  private shopOwnerService = inject(ShopOwnerService);
  private toast = inject(HotToastService);

  // === State signals ===
  protected shop = this.shopOwnerService.shop;
  protected hasShop = this.shopOwnerService.hasShop;

  protected products = signal<Product[]>([]);
  protected totalElements = signal(0);
  protected page = signal(0);
  protected pageSize = signal(10);
  protected loading = signal(false);
  protected error = signal<string | null>(null);

  /**
   * Server-side keyword used by {@link loadProducts}. We debounce keyboard
   * input via {@link onSearchInput} (300ms) so each keystroke doesn't
   * trigger a network call.
   */
  protected searchKeyword = signal<string>('');
  private searchDebounce?: ReturnType<typeof setTimeout>;

  protected categories = signal<CategoryOption[]>([]);

  // Editor state
  protected showEditor = signal(false);
  protected isSaving = signal(false);
  protected form = signal<ProductFormState>(EMPTY_FORM());

  // Derived
  protected isEditing = computed(() => this.form().id !== null);
  protected totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalElements() / this.pageSize()))
  );

  constructor() {
    // Resolve shop info first (sidebar relies on it), then fetch products.
    effect(() => {
      // Triggers when shop signal flips to non-null
      if (this.hasShop()) {
        this.loadProducts();
        this.loadCategories();
      }
    });

    // Kick off shop fetch if not already loaded
    if (!this.shopOwnerService.loaded()) {
      this.shopOwnerService.refresh().subscribe();
    }
  }

  // ============= Loaders =============

  protected loadProducts(): void {
    this.loading.set(true);
    this.error.set(null);

    const shopId = this.shop()?.shopId;
    const keyword = this.searchKeyword().trim();

    // When the shop owner types a keyword we hit the per-shop search
    // endpoint so the backend filters server-side (the legacy
    // {@code getMyShopProducts} doesn't support keyword filtering).
    const request$ = keyword && shopId
      ? this.productService.searchByShop(shopId, keyword, this.page(), this.pageSize())
      : this.productService.getMyShopProducts(this.page(), this.pageSize());

    request$.subscribe({
      next: res => {
        this.products.set(res.data?.content ?? []);
        this.totalElements.set(res.data?.totalElements ?? 0);
        this.loading.set(false);
      },
      error: err => {
        console.error('[MyStoreProducts] loadProducts failed', err);
        this.error.set(err?.error?.message ?? 'Không tải được danh sách sản phẩm');
        this.loading.set(false);
      }
    });
  }

  /**
   * Bound to the search input. Resets to page 0 and debounces 300ms so the
   * BE only gets one call per "burst of typing".
   */
  protected onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value ?? '';
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.searchKeyword.set(value);
      this.page.set(0);
      this.loadProducts();
    }, 300);
  }

  protected clearSearch(): void {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchKeyword.set('');
    this.page.set(0);
    this.loadProducts();
  }

  private loadCategories(): void {
    this.productService.getCategories().subscribe({
      next: res => this.categories.set(res.data ?? []),
      error: err => console.warn('[MyStoreProducts] loadCategories failed', err)
    });
  }

  // ============= Pagination =============

  protected goToPage(p: number): void {
    if (p < 0 || p >= this.totalPages()) return;
    this.page.set(p);
    this.loadProducts();
  }

  protected previousPage(): void {
    this.goToPage(this.page() - 1);
  }

  protected nextPage(): void {
    this.goToPage(this.page() + 1);
  }

  // ============= Editor =============

  protected openCreate(): void {
    this.form.set(EMPTY_FORM());
    this.showEditor.set(true);
  }

  protected openEdit(product: Product): void {
    const images = this.productService.parseImages(product.images);
    this.form.set({
      id: product.id,
      name: product.name,
      description: product.description ?? '',
      price: product.price,
      // BE doesn't return wholesalePrice on the listing endpoint; keep empty
      // so user re-confirms intentionally.
      wholesalePrice: '',
      quantity: product.quantity,
      sku: '',
      status: 'AVAILABLE',
      selectedCategories: [],
      imagesText: images.join(', '),
      msg: '',
      exp: ''
    });
    this.showEditor.set(true);
  }

  protected closeEditor(): void {
    this.showEditor.set(false);
    this.isSaving.set(false);
  }

  protected toggleCategory(name: string): void {
    this.form.update(f => {
      const set = new Set(f.selectedCategories);
      if (set.has(name)) set.delete(name); else set.add(name);
      return { ...f, selectedCategories: Array.from(set) };
    });
  }

  protected isCategorySelected(name: string): boolean {
    return this.form().selectedCategories.includes(name);
  }

  protected updateField<K extends keyof ProductFormState>(
    field: K,
    value: ProductFormState[K]
  ): void {
    this.form.update(f => ({ ...f, [field]: value }));
  }

  // ============= Save =============

  protected save(): void {
    const f = this.form();
    const shopId = this.shop()?.shopId;

    if (!shopId) {
      this.toast.error('Không xác định được cửa hàng của bạn');
      return;
    }
    if (!f.name.trim() || f.name.length < 3) {
      this.toast.error('Tên sản phẩm phải có ít nhất 3 ký tự');
      return;
    }
    if (!f.sku.trim() && !this.isEditing()) {
      this.toast.error('SKU là bắt buộc khi tạo mới');
      return;
    }
    if (!f.price.trim() || isNaN(parseFloat(f.price))) {
      this.toast.error('Giá bán không hợp lệ');
      return;
    }
    if (!f.wholesalePrice.trim() || isNaN(parseFloat(f.wholesalePrice))) {
      this.toast.error('Giá vốn không hợp lệ');
      return;
    }
    if (f.selectedCategories.length === 0) {
      this.toast.error('Chọn ít nhất một danh mục');
      return;
    }

    // Pack image URLs as JSON array string per BE contract
    const imageList = f.imagesText
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    const imagesJson = JSON.stringify(imageList.length > 0 ? imageList : ['']);

    const payload: CreateProductRequest = {
      shopId,
      categoryNames: f.selectedCategories.join(','),
      name: f.name.trim(),
      description: f.description?.trim() || undefined,
      price: f.price.trim(),
      images: imagesJson,
      quantity: f.quantity,
      sku: f.sku.trim() || `SKU-${Date.now()}`,
      msg: f.msg || undefined,
      exp: f.exp || undefined,
      status: f.status,
      wholesalePrice: f.wholesalePrice.trim()
    };

    this.isSaving.set(true);

    const op$ = this.isEditing()
      ? this.productService.updateProduct(f.id!, payload)
      : this.productService.createProduct(payload);

    op$.subscribe({
      next: () => {
        this.toast.success(this.isEditing() ? 'Đã cập nhật sản phẩm' : 'Đã tạo sản phẩm mới');
        this.isSaving.set(false);
        this.showEditor.set(false);
        this.loadProducts();
      },
      error: err => {
        console.error('[MyStoreProducts] save failed', err);
        this.toast.error(err?.error?.message ?? 'Không lưu được sản phẩm');
        this.isSaving.set(false);
      }
    });
  }

  // ============= Delete =============

  protected deleteProduct(product: Product): void {
    const ok = confirm(`Xoá sản phẩm "${product.name}"? Hành động này không thể hoàn tác.`);
    if (!ok) return;

    this.productService.deleteProduct(product.id).subscribe({
      next: () => {
        this.toast.success('Đã xoá sản phẩm');
        this.loadProducts();
      },
      error: err => {
        console.error('[MyStoreProducts] delete failed', err);
        this.toast.error(err?.error?.message ?? 'Không xoá được sản phẩm');
      }
    });
  }

  // ============= Helpers used by template =============

  protected getProductImage(product: Product): string {
    return this.productService.getFirstImage(product);
  }

  protected formatPrice(price: string): string {
    const n = parseFloat(price);
    if (isNaN(n)) return price;
    return n.toLocaleString('vi-VN');
  }

  protected stockStatus(product: Product): { label: string; tone: 'ok' | 'warn' | 'danger' } {
    if (product.quantity === 0) return { label: 'Hết hàng', tone: 'danger' };
    if (product.quantity < 10) return { label: `Còn ${product.quantity}`, tone: 'warn' };
    return { label: `Còn ${product.quantity}`, tone: 'ok' };
  }

  protected onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src =
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"%3E%3Crect fill="%23e5e7eb" width="80" height="80"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="10" fill="%239ca3af"%3ENo Image%3C/text%3E%3C/svg%3E';
  }
}

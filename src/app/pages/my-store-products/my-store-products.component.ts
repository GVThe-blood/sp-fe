import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { HotToastService } from '@ngxpert/hot-toast';
import { firstValueFrom, map } from 'rxjs';
import { StoreSidebarComponent } from '../../components/store-sidebar/store-sidebar.component';
import {
  CategoryService,
  CategoryView,
} from '../../services/category.service';
import {
  CreateProductRequest,
  Product,
  ProductPage,
  ProductService,
} from '../../services/product.service';
import { ShopOwnerService } from '../../services/shop-owner.service';

interface ProductsRequest {
  page: number;
  size: number;
  // bumped to invalidate the resource and force a refetch.
  refreshSeq: number;
}

const VND = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

@Component({
  selector: 'app-my-store-products',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, StoreSidebarComponent],
  templateUrl: './my-store-products.component.html',
  styleUrl: './my-store-products.component.css',
})
export class MyStoreProductsComponent {
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private shopOwnerService = inject(ShopOwnerService);
  private toast = inject(HotToastService);

  // -------------------------------------------------------------------------
  // Pagination + table data
  // -------------------------------------------------------------------------
  protected page = signal(0);
  protected size = signal(10);
  private refreshSeq = signal(0);

  protected products = rxResource<ProductPage, ProductsRequest>({
    request: () => ({ page: this.page(), size: this.size(), refreshSeq: this.refreshSeq() }),
    loader: ({ request }) =>
      this.productService
        .getMyShopProducts(request.page, request.size)
        .pipe(map((res) => res.data)),
  });

  protected items = computed<Product[]>(() => this.products.value()?.content ?? []);
  protected totalElements = computed<number>(() => this.products.value()?.totalElements ?? 0);
  protected totalPages = computed<number>(() => this.products.value()?.totalPages ?? 0);

  protected categories = rxResource<CategoryView[], void>({
    request: () => undefined,
    loader: () => this.categoryService.listVisible(),
  });

  protected errorMessage = computed(() => {
    const err = this.products.error() as { error?: { message?: string }; message?: string; status?: number } | undefined;
    if (!err) return '';
    if (err.status === 401 || err.status === 403) {
      return 'Bạn cần đăng nhập với tài khoản chủ shop để xem sản phẩm.';
    }
    return err.error?.message ?? err.message ?? 'Không tải được danh sách sản phẩm.';
  });

  // -------------------------------------------------------------------------
  // Modal create/edit
  // -------------------------------------------------------------------------
  protected showModal = signal(false);
  protected modalMode = signal<'create' | 'edit'>('create');
  protected editingId = signal<string | null>(null);
  protected submitting = signal(false);

  protected form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    sku: ['', [Validators.required]],
    categoryName: ['', [Validators.required]],
    price: [0, [Validators.required, Validators.min(0)]],
    wholesalePrice: [0, [Validators.required, Validators.min(0)]],
    quantity: [0, [Validators.required, Validators.min(0)]],
    description: [''],
    images: [''], // newline- or comma-separated URLs
    msg: [''],
    exp: [''],
    status: ['AVAILABLE'],
  });

  /** Pre-load both data sources when the page boots. */
  constructor() {
    // Lazy-trigger shop ownership refresh so we have shopId when creating.
    effect(() => {
      const shop = this.shopOwnerService.shop();
      if (!shop && !this.shopOwnerService.loaded()) {
        this.shopOwnerService.refresh().subscribe();
      }
    });
  }

  // -------------------------------------------------------------------------
  // Pagination handlers
  // -------------------------------------------------------------------------
  protected nextPage(): void {
    if (this.page() + 1 < this.totalPages()) this.page.update((p) => p + 1);
  }
  protected prevPage(): void {
    if (this.page() > 0) this.page.update((p) => p - 1);
  }
  protected reload(): void {
    this.refreshSeq.update((s) => s + 1);
  }

  // -------------------------------------------------------------------------
  // Modal lifecycle
  // -------------------------------------------------------------------------
  protected openCreate(): void {
    this.modalMode.set('create');
    this.editingId.set(null);
    this.form.reset({
      name: '', sku: '', categoryName: '', price: 0, wholesalePrice: 0,
      quantity: 0, description: '', images: '', msg: '', exp: '', status: 'AVAILABLE',
    });
    this.showModal.set(true);
  }

  protected openEdit(product: Product): void {
    this.modalMode.set('edit');
    this.editingId.set(product.id);
    const images = this.parseImages(product.images);
    // Owner-side `Product` được trả với đầy đủ sku/wholesalePrice/status/
    // categoryName từ {@code GET /products/shop} (xem ProductDetail BE),
    // nên form edit có thể prefill an toàn — không còn ghi đè default khi
    // submit lại.
    const wholesale =
      product.wholesalePrice == null ? 0 : Number(product.wholesalePrice);
    const status: 'AVAILABLE' | 'OUT_OF_STOCK' | 'DISABLED' =
      (product.status as any) === 'OUT_OF_STOCK'
        ? 'OUT_OF_STOCK'
        : (product.status as any) === 'DISABLED'
          ? 'DISABLED'
          : 'AVAILABLE';
    this.form.reset({
      name: product.name,
      sku: product.sku ?? '',
      categoryName: product.categoryName ?? '',
      price: Number(product.price ?? 0),
      wholesalePrice: wholesale,
      quantity: product.quantity ?? 0,
      description: product.description ?? '',
      images: images.join('\n'),
      msg: product.msg ?? '',
      exp: product.exp ?? '',
      status,
    });
    this.showModal.set(true);
  }

  protected closeModal(): void {
    this.showModal.set(false);
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const shopId = this.shopOwnerService.shop()?.shopId;
    if (!shopId) {
      this.toast.error('Không xác định được cửa hàng.');
      return;
    }

    const v = this.form.getRawValue();
    const imageList = this.normalizeImages(v.images);

    const payload: CreateProductRequest = {
      shopId,
      categoryNames: v.categoryName,
      name: v.name.trim(),
      sku: v.sku.trim(),
      price: String(v.price ?? 0),
      wholesalePrice: String(v.wholesalePrice ?? 0),
      quantity: Number(v.quantity ?? 0),
      description: v.description || undefined,
      images: JSON.stringify(imageList),
      msg: v.msg || undefined,
      exp: v.exp || undefined,
      status: v.status,
    };

    this.submitting.set(true);
    try {
      if (this.modalMode() === 'create') {
        await firstValueFrom(this.productService.createProduct(payload));
        this.toast.success('Đã tạo sản phẩm');
      } else {
        const id = this.editingId();
        if (!id) return;
        await firstValueFrom(this.productService.updateProduct(id, payload));
        this.toast.success('Đã cập nhật sản phẩm');
      }
      this.showModal.set(false);
      this.reload();
    } catch (err: any) {
      this.toast.error(err?.error?.message ?? 'Thao tác thất bại');
    } finally {
      this.submitting.set(false);
    }
  }

  protected async confirmDelete(product: Product): Promise<void> {
    if (!confirm(`Xóa sản phẩm "${product.name}"?`)) return;
    this.submitting.set(true);
    try {
      await firstValueFrom(this.productService.deleteProduct(product.id));
      this.toast.success('Đã xóa sản phẩm');
      this.reload();
    } catch (err: any) {
      this.toast.error(err?.error?.message ?? 'Không thể xóa sản phẩm');
    } finally {
      this.submitting.set(false);
    }
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------
  protected formatPrice(value: number | string | null | undefined): string {
    if (value == null || value === '') return '—';
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (Number.isNaN(num)) return '—';
    return VND.format(num);
  }

  protected previewImage(product: Product): string {
    const images = this.parseImages(product.images);
    return images[0] || '/assets/images/placeholder-product.png';
  }

  private parseImages(raw: string | null | undefined): string[] {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private normalizeImages(value: string): string[] {
    if (!value) return [];
    return value
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
}

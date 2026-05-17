import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { HotToastService } from '@ngxpert/hot-toast';

import { environment } from '../../../../environments/environment';
import {
  AdminProductListPage,
  AdminProductRow,
  AdminProductService,
  ProductStatusValue,
} from '../../../services/admin-product.service';

const PAGE_SIZE = 20;

const ALL_STATUSES: ProductStatusValue[] = ['AVAILABLE', 'OUT_OF_STOCK', 'UNLISTED', 'DISCONTINUED'];

const STATUS_LABEL: Record<string, string> = {
  AVAILABLE: 'Đang bán',
  OUT_OF_STOCK: 'Hết hàng',
  UNLISTED: 'Đã ẩn',
  DISCONTINUED: 'Ngừng KD',
};

const STATUS_CLASS: Record<string, string> = {
  AVAILABLE: 'available',
  OUT_OF_STOCK: 'out_of_stock',
  UNLISTED: 'unlisted',
  DISCONTINUED: 'discontinued',
};

/**
 * Admin Products — list cross-shop với stats + force status change.
 *
 * <p>Khác store-products page (per-shop) ở chỗ admin xem mọi sản phẩm bất kể
 * shop. Quick actions:
 *   - "Ẩn" (AVAILABLE → UNLISTED) khi sản phẩm đang bán.
 *   - "Hiện lại" (UNLISTED → AVAILABLE) khi đang ẩn.
 *   - Detail modal cho phép pick status bất kỳ.
 *   - "Xoá hẳn" → hard delete (chỉ thành công nếu không có FK ràng buộc).</p>
 */
@Component({
  selector: 'app-admin-products',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './admin-products.component.html',
  styleUrl: './admin-products.component.css',
})
export class AdminProductsComponent {
  private api = inject(AdminProductService);
  private toast = inject(HotToastService);

  protected readonly placeholderProduct = environment.placeholders.product;
  protected readonly allStatuses: ReadonlyArray<ProductStatusValue> = ALL_STATUSES;

  // -----------------------------------------------------------------
  // Filters & pagination
  // -----------------------------------------------------------------
  protected readonly statusFilter = signal<'all' | ProductStatusValue>('all');
  protected readonly search = signal<string>('');
  protected readonly page = signal<number>(0);

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  protected onSearchChange(value: string): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.search.set(value);
      this.page.set(0);
    }, 300);
  }

  protected onStatusFilter(v: 'all' | ProductStatusValue): void {
    this.statusFilter.set(v);
    this.page.set(0);
  }

  // -----------------------------------------------------------------
  // Resources
  // -----------------------------------------------------------------
  private readonly products$ = rxResource<
    AdminProductListPage,
    { status: 'all' | ProductStatusValue; keyword: string; page: number }
  >({
    request: () => ({
      status: this.statusFilter(),
      keyword: this.search(),
      page: this.page(),
    }),
    loader: ({ request }) =>
      this.api.list({
        status: request.status,
        keyword: request.keyword,
        page: request.page,
        size: PAGE_SIZE,
      }),
  });

  private readonly statsResource = rxResource({
    request: () => ({}),
    loader: () => this.api.getStats(),
  });

  protected readonly stats = computed(() => this.statsResource.value() ?? null);
  protected readonly isLoading = computed(() => this.products$.isLoading());
  protected readonly errorMessage = computed(() => {
    const e1 = this.products$.error() as { status?: number; message?: string } | undefined;
    const e2 = this.statsResource.error() as { status?: number; message?: string } | undefined;
    const err = e1 ?? e2;
    if (!err) return null;
    if (err.status === 401 || err.status === 403) {
      return 'Bạn cần quyền ADMIN để xem trang này.';
    }
    return err.message ?? 'Không tải được danh sách sản phẩm.';
  });

  protected readonly products = computed<AdminProductRow[]>(
    () => this.products$.value()?.items ?? [],
  );
  protected readonly totalItems = computed(() => this.products$.value()?.totalItems ?? 0);
  protected readonly totalPages = computed(() => this.products$.value()?.totalPages ?? 0);
  protected readonly rangeFrom = computed(() =>
    this.totalItems() === 0 ? 0 : this.page() * PAGE_SIZE + 1,
  );
  protected readonly rangeTo = computed(() =>
    Math.min((this.page() + 1) * PAGE_SIZE, this.totalItems()),
  );

  protected reload(): void {
    this.products$.reload();
    this.statsResource.reload();
  }

  protected prevPage(): void {
    if (this.page() > 0) this.page.update((p) => p - 1);
  }
  protected nextPage(): void {
    if (this.page() + 1 < this.totalPages()) this.page.update((p) => p + 1);
  }

  // -----------------------------------------------------------------
  // Detail modal
  // -----------------------------------------------------------------
  protected readonly detailModal = signal<AdminProductRow | null>(null);
  protected readonly newStatus = signal<string>('');
  protected readonly busyId = signal<string | null>(null);

  protected openDetail(p: AdminProductRow): void {
    this.detailModal.set(p);
    this.newStatus.set('');
  }

  protected closeDetail(): void {
    if (this.busyId()) return;
    this.detailModal.set(null);
  }

  protected applyStatusChange(): void {
    const p = this.detailModal();
    if (!p) return;
    const target = this.newStatus() as ProductStatusValue;
    if (!target || target === p.productStatus) return;

    this.busyId.set(p.productId);
    this.api.changeStatus(p.productId, target).subscribe({
      next: (updated) => {
        this.busyId.set(null);
        this.toast.success(`Đã đổi sang ${this.statusLabel(target)}`);
        this.detailModal.set(updated);
        this.newStatus.set('');
        this.reload();
      },
      error: (err) => {
        this.busyId.set(null);
        this.toast.error(this.extractMessage(err, 'Không thể đổi trạng thái.'));
      },
    });
  }

  // -----------------------------------------------------------------
  // Quick actions (hide / show / delete)
  // -----------------------------------------------------------------
  protected quickHide(p: AdminProductRow): void {
    if (this.busyId()) return;
    const ok = confirm(`Ẩn sản phẩm "${p.name}" khỏi storefront?`);
    if (!ok) return;
    this.busyId.set(p.productId);
    this.api.changeStatus(p.productId, 'UNLISTED').subscribe({
      next: () => {
        this.busyId.set(null);
        this.toast.success('Đã ẩn sản phẩm');
        this.reload();
      },
      error: (err) => {
        this.busyId.set(null);
        this.toast.error(this.extractMessage(err, 'Không thể ẩn sản phẩm.'));
      },
    });
  }

  protected quickShow(p: AdminProductRow): void {
    if (this.busyId()) return;
    this.busyId.set(p.productId);
    this.api.changeStatus(p.productId, 'AVAILABLE').subscribe({
      next: () => {
        this.busyId.set(null);
        this.toast.success('Đã hiện lại sản phẩm');
        this.reload();
      },
      error: (err) => {
        this.busyId.set(null);
        this.toast.error(this.extractMessage(err, 'Không thể hiện sản phẩm.'));
      },
    });
  }

  protected confirmDelete(p: AdminProductRow): void {
    if (this.busyId()) return;
    const ok = confirm(
      `Xoá hẳn "${p.name}"? Không thể khôi phục. Nếu sản phẩm đã từng có đơn hàng, có thể bị từ chối — hãy dùng "Ngừng KD" thay vì xoá.`,
    );
    if (!ok) return;
    this.busyId.set(p.productId);
    this.api.remove(p.productId).subscribe({
      next: () => {
        this.busyId.set(null);
        this.toast.success('Đã xoá sản phẩm');
        if (this.detailModal()?.productId === p.productId) this.detailModal.set(null);
        this.reload();
      },
      error: (err) => {
        this.busyId.set(null);
        // FK violation rất phổ biến → suggest dùng DISCONTINUED.
        const fallback =
          'Không thể xoá. Có thể sản phẩm đang được tham chiếu bởi đơn hàng — hãy chuyển sang "Ngừng KD" thay vì xoá.';
        this.toast.error(this.extractMessage(err, fallback));
      },
    });
  }

  // -----------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------
  protected statusLabel(status: string | null | undefined): string {
    if (!status) return '—';
    return STATUS_LABEL[status.toUpperCase()] ?? status;
  }
  protected statusClass(status: string | null | undefined): string {
    if (!status) return '';
    return STATUS_CLASS[status.toUpperCase()] ?? '';
  }

  protected formatDate(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  protected formatNumber(n: number | null | undefined): string {
    return new Intl.NumberFormat('vi-VN').format(Number(n) || 0);
  }

  protected formatVnd(n: number | null | undefined): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(Number(n) || 0);
  }

  protected formatVndShort(n: number | null | undefined): string {
    const v = Number(n) || 0;
    if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B ₫`;
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}tr ₫`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k ₫`;
    return `${v.toLocaleString('vi-VN')} ₫`;
  }

  protected onThumbError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = this.placeholderProduct;
  }

  private extractMessage(err: unknown, fallback: string): string {
    if (err && typeof err === 'object') {
      const e = err as { error?: { message?: string }; message?: string; status?: number };
      if (e.status === 401 || e.status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
      if (e.error?.message) return e.error.message;
      if (e.message) return e.message;
    }
    return fallback;
  }
}

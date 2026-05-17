import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { HotToastService } from '@ngxpert/hot-toast';

import {
  AdminSaleService,
  SaleListPage,
  SaleResponse,
  SaleUpsertRequest,
} from '../../../services/admin-sale.service';

const PAGE_SIZE = 20;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface SaleFormState {
  title: string;
  description: string;
  /** UI giữ string (input number trả string) — convert tại submit. */
  discountPercentage: string;
  conditions: string;
  /** ISO datetime-local format ('YYYY-MM-DDTHH:mm'); empty = không chọn. */
  startDate: string;
  endDate: string;
  productIds: string[];
}

const EMPTY_FORM: SaleFormState = {
  title: '',
  description: '',
  discountPercentage: '0',
  conditions: '',
  startDate: '',
  endDate: '',
  productIds: [],
};

/**
 * Admin Sales — quản lý chương trình khuyến mãi.
 *
 * <p>Khác các page admin khác ở chỗ status (đang chạy / sắp diễn ra / đã hết)
 * được tính client-side dựa trên {@code startDate}/{@code endDate} so với now,
 * không phụ thuộc field BE trả ra (BE có {@code active} flag nhưng chỉ
 * true/false; FE muốn 3 trạng thái nên tính lại).</p>
 */
@Component({
  selector: 'app-admin-sales',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './admin-sales.component.html',
  styleUrl: './admin-sales.component.css',
})
export class AdminSalesComponent {
  private api = inject(AdminSaleService);
  private toast = inject(HotToastService);

  // -----------------------------------------------------------------
  // Filter & pagination
  // -----------------------------------------------------------------
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

  // -----------------------------------------------------------------
  // Data resource
  // -----------------------------------------------------------------
  private readonly sales = rxResource<SaleListPage, { keyword: string; page: number }>({
    request: () => ({ keyword: this.search(), page: this.page() }),
    loader: ({ request }) =>
      this.api.list({ keyword: request.keyword, page: request.page, size: PAGE_SIZE }),
  });

  protected readonly isLoading = computed(() => this.sales.isLoading());
  protected readonly errorMessage = computed(() => {
    const err = this.sales.error() as { status?: number; message?: string } | undefined;
    if (!err) return null;
    if (err.status === 401 || err.status === 403) {
      return 'Bạn cần quyền ADMIN để xem trang này.';
    }
    return err.message ?? 'Không tải được danh sách chương trình.';
  });

  protected readonly items = computed<SaleResponse[]>(() => this.sales.value()?.items ?? []);
  protected readonly totalItems = computed(() => this.sales.value()?.totalItems ?? 0);
  protected readonly totalPages = computed(() => this.sales.value()?.totalPages ?? 0);
  protected readonly rangeFrom = computed(() =>
    this.totalItems() === 0 ? 0 : this.page() * PAGE_SIZE + 1,
  );
  protected readonly rangeTo = computed(() =>
    Math.min((this.page() + 1) * PAGE_SIZE, this.totalItems()),
  );

  /**
   * Stats cards: count theo từng status. Tính dựa trên items page hiện tại
   * vì BE chưa expose stats endpoint riêng — accept rằng count chỉ chính xác
   * trong phạm vi page (admin có thể thấy "5 đang diễn ra" trong khi tổng
   * thực sự cao hơn). Acceptable trade-off vì admin sẽ nhanh chóng ấn search
   * để khoanh vùng.
   */
  protected readonly liveCount = computed(() => this.items().filter((s) => this.isLive(s)).length);
  protected readonly upcomingCount = computed(
    () => this.items().filter((s) => this.isUpcoming(s)).length,
  );
  protected readonly expiredCount = computed(
    () => this.items().filter((s) => this.isExpired(s)).length,
  );

  protected reload(): void {
    this.sales.reload();
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
  protected readonly detailModal = signal<SaleResponse | null>(null);

  protected openDetail(sale: SaleResponse): void {
    // Fetch product list nếu BE chưa nhúng (depends on impl). Tạm dùng row sẵn có.
    if (sale.productIds && sale.productIds.length > 0) {
      this.detailModal.set(sale);
      return;
    }
    this.api.getProducts(sale.id).subscribe({
      next: (ids) => this.detailModal.set({ ...sale, productIds: ids }),
      error: () => this.detailModal.set(sale),
    });
  }

  protected closeDetail(): void {
    this.detailModal.set(null);
  }

  // -----------------------------------------------------------------
  // Edit modal
  // -----------------------------------------------------------------
  protected readonly editModal = signal<boolean>(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly saving = signal<boolean>(false);
  protected readonly formError = signal<string | null>(null);
  protected form: SaleFormState = { ...EMPTY_FORM };
  protected readonly newProductId = signal<string>('');

  protected openCreate(): void {
    this.editingId.set(null);
    this.form = { ...EMPTY_FORM };
    this.formError.set(null);
    this.newProductId.set('');
    this.editModal.set(true);
  }

  protected openEdit(sale: SaleResponse): void {
    this.editingId.set(sale.id);
    this.form = {
      title: sale.title ?? '',
      description: sale.description ?? '',
      discountPercentage: String(sale.discountPercentage ?? 0),
      conditions: sale.conditions ?? '',
      startDate: this.toDateTimeLocalString(sale.startDate),
      endDate: this.toDateTimeLocalString(sale.endDate),
      productIds: [...(sale.productIds ?? [])],
    };
    this.formError.set(null);
    this.newProductId.set('');
    this.detailModal.set(null);
    this.editModal.set(true);

    // Load product list nếu chưa có để khi edit không bị mất.
    if (!sale.productIds || sale.productIds.length === 0) {
      this.api.getProducts(sale.id).subscribe({
        next: (ids) => {
          if (ids.length > 0) {
            this.form = { ...this.form, productIds: ids };
          }
        },
      });
    }
  }

  protected closeEdit(): void {
    if (this.saving()) return;
    this.editModal.set(false);
  }

  protected onField<K extends keyof SaleFormState>(field: K, value: string): void {
    this.form = { ...this.form, [field]: value as SaleFormState[K] };
  }

  protected addProductId(): void {
    const id = this.newProductId().trim();
    if (!id) return;
    if (!UUID_PATTERN.test(id)) {
      this.toast.error('UUID không hợp lệ');
      return;
    }
    if (this.form.productIds.includes(id)) {
      this.toast.warning('Đã có trong danh sách');
      return;
    }
    this.form = { ...this.form, productIds: [...this.form.productIds, id] };
    this.newProductId.set('');
  }

  protected removeProductId(id: string): void {
    this.form = {
      ...this.form,
      productIds: this.form.productIds.filter((x) => x !== id),
    };
  }

  protected submitEdit(): void {
    if (this.saving()) return;
    const validation = this.validate();
    if (validation) {
      this.formError.set(validation);
      return;
    }
    this.formError.set(null);
    this.saving.set(true);

    const payload: SaleUpsertRequest = {
      title: this.form.title.trim(),
      description: this.form.description.trim() || undefined,
      discountPercentage: parseFloat(this.form.discountPercentage) || 0,
      conditions: this.form.conditions.trim() || undefined,
      startDate: this.form.startDate ? this.fromDateTimeLocalString(this.form.startDate) : undefined,
      endDate: this.form.endDate ? this.fromDateTimeLocalString(this.form.endDate) : undefined,
      // BE rule: null = giữ nguyên mapping; rỗng/list mới = thay thế. Tôi luôn gửi list để rõ ràng.
      productIds: this.form.productIds,
    };

    const editingId = this.editingId();
    const obs = editingId ? this.api.update(editingId, payload) : this.api.create(payload);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.editModal.set(false);
        this.toast.success(editingId ? 'Đã cập nhật chương trình' : 'Đã tạo chương trình mới');
        this.reload();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(this.extractMessage(err, 'Không thể lưu chương trình.'));
      },
    });
  }

  private validate(): string | null {
    if (!this.form.title.trim()) return 'Tiêu đề bắt buộc.';
    const pct = parseFloat(this.form.discountPercentage);
    if (Number.isNaN(pct) || pct < 0 || pct > 100) {
      return 'Phần trăm giảm phải nằm trong khoảng 0–100.';
    }
    if (this.form.startDate && this.form.endDate) {
      const start = new Date(this.form.startDate).getTime();
      const end = new Date(this.form.endDate).getTime();
      if (start > end) {
        return 'Ngày bắt đầu phải trước ngày kết thúc.';
      }
    }
    return null;
  }

  // -----------------------------------------------------------------
  // Delete
  // -----------------------------------------------------------------
  protected readonly busyId = signal<string | null>(null);

  protected confirmDelete(sale: SaleResponse): void {
    if (this.busyId()) return;
    const ok = confirm(`Xoá chương trình "${sale.title}"? Sản phẩm sẽ trở về giá gốc.`);
    if (!ok) return;
    this.busyId.set(sale.id);
    this.api.remove(sale.id).subscribe({
      next: () => {
        this.busyId.set(null);
        this.toast.success('Đã xoá chương trình');
        this.reload();
      },
      error: (err) => {
        this.busyId.set(null);
        this.toast.error(this.extractMessage(err, 'Không thể xoá.'));
      },
    });
  }

  // -----------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------
  protected isLive(s: SaleResponse): boolean {
    const now = Date.now();
    const start = s.startDate ? new Date(s.startDate).getTime() : -Infinity;
    const end = s.endDate ? new Date(s.endDate).getTime() : Infinity;
    return start <= now && now <= end;
  }

  protected isUpcoming(s: SaleResponse): boolean {
    if (!s.startDate) return false;
    return new Date(s.startDate).getTime() > Date.now();
  }

  protected isExpired(s: SaleResponse): boolean {
    if (!s.endDate) return false;
    return new Date(s.endDate).getTime() < Date.now();
  }

  protected statusLabel(s: SaleResponse): string {
    if (this.isLive(s)) return 'Đang diễn ra';
    if (this.isUpcoming(s)) return 'Sắp diễn ra';
    if (this.isExpired(s)) return 'Đã kết thúc';
    return 'Không thời gian';
  }

  protected statusClass(s: SaleResponse): string {
    if (this.isLive(s)) return 'live';
    if (this.isUpcoming(s)) return 'upcoming';
    if (this.isExpired(s)) return 'expired';
    return '';
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

  /**
   * Convert ISO/Java LocalDateTime string sang giá trị mà input
   * type=datetime-local nhận được ('YYYY-MM-DDTHH:mm'). Lưu ý không append Z
   * vì input không hiểu timezone offset.
   */
  private toDateTimeLocalString(iso: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  /**
   * datetime-local trả 'YYYY-MM-DDTHH:mm' không kèm timezone. BE Java
   * {@code @DateTimeFormat ISO.DATE_TIME} chấp nhận format 'YYYY-MM-DDTHH:mm:ss'.
   * Append ':00' để chắc chắn.
   */
  private fromDateTimeLocalString(value: string): string {
    if (!value) return '';
    return value.length >= 16 && !value.includes(':', 14) ? value + ':00' :
      (value.length === 16 ? value + ':00' : value);
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

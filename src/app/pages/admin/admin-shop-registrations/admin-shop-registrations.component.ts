import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { HotToastService } from '@ngxpert/hot-toast';

import {
  AdminRegistrationPage,
  AdminShopRegistrationService,
  AdminShopRegistrationView,
  RegistrationStatusFilter,
} from '../../../services/admin-shop-registration.service';

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Nháp',
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Đã từ chối',
};

const STATUS_CLASS: Record<string, string> = {
  DRAFT: 'draft',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

const PENDING_PAGE_SIZE = 20;
const PROCESSED_PAGE_SIZE = 20;

/**
 * Admin Shop Registrations — split-view layout:
 *
 * <ul>
 *   <li><b>Section trên</b>: Đơn chờ duyệt (status=PENDING). Đây là to-do list
 *       của admin nên ưu tiên hiển thị trên cùng, sort theo {@code createdAt DESC}
 *       (mới nhất trước).</li>
 *   <li><b>Section dưới</b>: Đơn đã xử lý (APPROVED hoặc REJECTED), có filter
 *       riêng để xem chỉ approved hay chỉ rejected. Sort theo
 *       {@code reviewedAt DESC} không khả dụng (BE chưa support nhiều sort key)
 *       nên fallback {@code createdAt DESC}.</li>
 * </ul>
 *
 * <p>Search bar dùng chung cho cả hai section — admin thường tìm theo shop
 * name/email và muốn thấy mọi trạng thái.</p>
 */
@Component({
  selector: 'app-admin-shop-registrations',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './admin-shop-registrations.component.html',
  styleUrl: './admin-shop-registrations.component.css',
})
export class AdminShopRegistrationsComponent {
  private api = inject(AdminShopRegistrationService);
  private toast = inject(HotToastService);

  // -----------------------------------------------------------------
  // Filter & pagination state
  // -----------------------------------------------------------------
  protected readonly search = signal<string>('');
  protected readonly pendingPage = signal<number>(0);
  protected readonly processedPage = signal<number>(0);
  protected readonly processedStatus = signal<'all' | 'APPROVED' | 'REJECTED'>('all');

  /**
   * Debounce search bằng setTimeout — gộp nhiều keystroke trong 300ms.
   * Khi search thay đổi cũng reset 2 page về 0 để tránh page out-of-range.
   */
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  protected onSearchChange(value: string): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.search.set(value);
      this.pendingPage.set(0);
      this.processedPage.set(0);
    }, 300);
  }

  protected onProcessedStatusChange(value: 'all' | 'APPROVED' | 'REJECTED'): void {
    this.processedStatus.set(value);
    this.processedPage.set(0);
  }

  // -----------------------------------------------------------------
  // Two independent rxResource — pending vs processed.
  //
  // BE list endpoint accept 1 status filter; với "processed all" ta phải gọi
  // 2 lần hoặc dùng status='all' rồi filter client. Dùng status='all' đơn giản
  // hơn: BE đã hỗ trợ và khi user chọn 'APPROVED' hay 'REJECTED' thì chuyển
  // qua filter chính xác.
  // -----------------------------------------------------------------

  private readonly pendingResource = rxResource<AdminRegistrationPage, RegistrationStatusFilter>({
    request: () => ({
      status: 'PENDING',
      search: this.search(),
      page: this.pendingPage(),
      size: PENDING_PAGE_SIZE,
    }),
    loader: ({ request }) => this.api.list(request),
  });

  private readonly processedResource = rxResource<AdminRegistrationPage, RegistrationStatusFilter>({
    request: () => {
      const ps = this.processedStatus();
      // Khi filter là 'all' ta chỉ muốn processed (APPROVED + REJECTED), không
      // bao gồm PENDING/DRAFT. BE chưa có status='processed' magic value, nên
      // FE sẽ filter post-fetch dựa trên cờ này.
      return {
        status: ps === 'all' ? 'all' : ps,
        search: this.search(),
        page: this.processedPage(),
        size: PROCESSED_PAGE_SIZE,
      };
    },
    loader: ({ request }) => this.api.list(request),
  });

  protected readonly isPendingLoading = computed(() => this.pendingResource.isLoading());
  protected readonly isProcessedLoading = computed(() => this.processedResource.isLoading());

  protected readonly errorMessage = computed(() => {
    const e1 = this.pendingResource.error() as { status?: number; message?: string } | undefined;
    const e2 = this.processedResource.error() as { status?: number; message?: string } | undefined;
    const err = e1 ?? e2;
    if (!err) return null;
    if (err.status === 401 || err.status === 403) {
      return 'Bạn cần quyền ADMIN để xem trang này.';
    }
    return err.message ?? 'Không tải được danh sách đơn đăng ký.';
  });

  protected readonly pendingItems = computed<AdminShopRegistrationView[]>(
    () => this.pendingResource.value()?.items ?? [],
  );
  protected readonly pendingTotal = computed(() => this.pendingResource.value()?.totalItems ?? 0);
  protected readonly pendingTotalPages = computed(
    () => this.pendingResource.value()?.totalPages ?? 0,
  );

  /**
   * Items processed — khi filter='all' phải bỏ DRAFT/PENDING ở client. Khi đã
   * lọc theo APPROVED/REJECTED riêng thì BE đã filter sẵn, dùng nguyên xi.
   */
  protected readonly processedItems = computed<AdminShopRegistrationView[]>(() => {
    const raw = this.processedResource.value()?.items ?? [];
    if (this.processedStatus() === 'all') {
      return raw.filter((r) => r.status === 'APPROVED' || r.status === 'REJECTED');
    }
    return raw;
  });
  protected readonly processedTotal = computed(
    () => this.processedResource.value()?.totalItems ?? 0,
  );
  protected readonly processedTotalPages = computed(
    () => this.processedResource.value()?.totalPages ?? 0,
  );

  protected reload(): void {
    this.pendingResource.reload();
    this.processedResource.reload();
  }

  // Pagination handlers cho từng section
  protected pendingPrev(): void {
    if (this.pendingPage() > 0) this.pendingPage.update((p) => p - 1);
  }
  protected pendingNext(): void {
    if (this.pendingPage() + 1 < this.pendingTotalPages()) this.pendingPage.update((p) => p + 1);
  }
  protected processedPrev(): void {
    if (this.processedPage() > 0) this.processedPage.update((p) => p - 1);
  }
  protected processedNext(): void {
    if (this.processedPage() + 1 < this.processedTotalPages())
      this.processedPage.update((p) => p + 1);
  }

  protected pendingRangeFrom = computed(() =>
    this.pendingTotal() === 0 ? 0 : this.pendingPage() * PENDING_PAGE_SIZE + 1,
  );
  protected pendingRangeTo = computed(() =>
    Math.min((this.pendingPage() + 1) * PENDING_PAGE_SIZE, this.pendingTotal()),
  );
  protected processedRangeFrom = computed(() =>
    this.processedTotal() === 0 ? 0 : this.processedPage() * PROCESSED_PAGE_SIZE + 1,
  );
  protected processedRangeTo = computed(() =>
    Math.min((this.processedPage() + 1) * PROCESSED_PAGE_SIZE, this.processedTotal()),
  );

  // -----------------------------------------------------------------
  // Detail modal
  // -----------------------------------------------------------------
  protected readonly detailModal = signal<AdminShopRegistrationView | null>(null);

  protected openDetail(req: AdminShopRegistrationView): void {
    this.detailModal.set(req);
  }

  protected closeDetail(): void {
    this.detailModal.set(null);
  }

  // -----------------------------------------------------------------
  // Reject modal
  // -----------------------------------------------------------------
  protected readonly rejectModal = signal<AdminShopRegistrationView | null>(null);
  protected readonly rejectReason = signal<string>('');
  protected readonly rejectError = signal<string | null>(null);

  protected openReject(req: AdminShopRegistrationView): void {
    this.rejectModal.set(req);
    this.rejectReason.set('');
    this.rejectError.set(null);
    this.detailModal.set(null);
  }

  protected closeReject(): void {
    if (this.busyId()) return;
    this.rejectModal.set(null);
  }

  protected onRejectReasonChange(value: string): void {
    this.rejectReason.set(value);
  }

  protected submitReject(): void {
    const req = this.rejectModal();
    if (!req) return;
    const reason = this.rejectReason().trim();
    if (!reason) {
      this.rejectError.set('Vui lòng nhập lý do.');
      return;
    }
    if (reason.length < 8) {
      this.rejectError.set('Lý do quá ngắn (ít nhất 8 ký tự).');
      return;
    }
    this.rejectError.set(null);
    this.busyId.set(req.requestId);

    this.api.reject(req.requestId, reason).subscribe({
      next: () => {
        this.busyId.set(null);
        this.rejectModal.set(null);
        this.toast.success('Đã từ chối đơn đăng ký');
        this.reload();
      },
      error: (err) => {
        this.busyId.set(null);
        this.rejectError.set(this.extractMessage(err, 'Không thể từ chối đơn.'));
      },
    });
  }

  // -----------------------------------------------------------------
  // Approve action
  // -----------------------------------------------------------------
  protected readonly busyId = signal<string | null>(null);

  protected approve(req: AdminShopRegistrationView): void {
    if (this.busyId()) return;
    const ok = confirm(`Duyệt đơn đăng ký của "${req.shopName}"?`);
    if (!ok) return;

    this.busyId.set(req.requestId);
    this.api.approve(req.requestId).subscribe({
      next: () => {
        this.busyId.set(null);
        this.toast.success('Đã duyệt — shop được kích hoạt');
        if (this.detailModal()?.requestId === req.requestId) {
          this.detailModal.set(null);
        }
        this.reload();
      },
      error: (err) => {
        this.busyId.set(null);
        this.toast.error(this.extractMessage(err, 'Không thể duyệt đơn.'));
      },
    });
  }

  // -----------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------
  protected statusLabel(status: string | null): string {
    if (!status) return '—';
    return STATUS_LABEL[status.toUpperCase()] ?? status;
  }

  protected statusClass(status: string | null): string {
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

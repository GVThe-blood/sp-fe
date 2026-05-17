import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { HotToastService } from '@ngxpert/hot-toast';

import { environment } from '../../../../environments/environment';
import {
  AdminShopListPage,
  AdminShopRow,
  AdminShopService,
  AdminShopUpdatePayload,
  ShopStatusValue,
} from '../../../services/admin-shop.service';

interface ShopEditFormState {
  shopName: string;
  logo: string;
  introduction: string;
  shopType: string;
  businessType: string;
  email: string;
  phoneNumber: string;
  taxId: string;
  shopAddress: string;
  city: string;
  province: string;
  postalCode: string;
  activeHours: string;
}

const EMPTY_EDIT_FORM: ShopEditFormState = {
  shopName: '',
  logo: '',
  introduction: '',
  shopType: '',
  businessType: '',
  email: '',
  phoneNumber: '',
  taxId: '',
  shopAddress: '',
  city: '',
  province: '',
  postalCode: '',
  activeHours: '',
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Đang hoạt động',
  INACTIVE: 'Tạm dừng',
  BANNED: 'Bị ban',
  CLOSED: 'Đã đóng',
  PENDING_APPROVAL: 'Chờ duyệt',
};

const STATUS_CLASS: Record<string, string> = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  BANNED: 'banned',
  CLOSED: 'closed',
  PENDING_APPROVAL: 'pending_approval',
};

const PAGE_SIZE = 20;

/**
 * Admin Shops — list + stats + ban/unban + edit + close.
 *
 * <p>Pattern dữ liệu giống AdminShopRegistrations: 1 rxResource chính cho list
 * + stats fetch riêng (refresh ít hơn). Sau mỗi mutation tự reload cả 2.</p>
 */
@Component({
  selector: 'app-admin-shops',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './admin-shops.component.html',
  styleUrl: './admin-shops.component.css',
})
export class AdminShopsComponent {
  private api = inject(AdminShopService);
  private toast = inject(HotToastService);

  protected readonly placeholderShop = environment.placeholders.shop;

  // -----------------------------------------------------------------
  // Filters & pagination
  // -----------------------------------------------------------------
  protected readonly status = signal<'all' | ShopStatusValue>('all');
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

  protected onStatusChange(value: 'all' | ShopStatusValue): void {
    this.status.set(value);
    this.page.set(0);
  }

  // -----------------------------------------------------------------
  // Data resources
  // -----------------------------------------------------------------
  private readonly shops = rxResource<
    AdminShopListPage,
    { status: 'all' | ShopStatusValue; search: string; page: number }
  >({
    request: () => ({ status: this.status(), search: this.search(), page: this.page() }),
    loader: ({ request }) =>
      this.api.list({
        status: request.status,
        search: request.search,
        page: request.page,
        size: PAGE_SIZE,
      }),
  });

  /**
   * Stats fetch tách riêng: thay đổi status filter / search không làm stats
   * tính sai (stats luôn là toàn nền tảng). Reload sau mutation.
   */
  private readonly statsResource = rxResource({
    request: () => ({}),
    loader: () => this.api.getStats(),
  });

  protected readonly stats = computed(() => this.statsResource.value() ?? null);

  protected readonly isLoading = computed(() => this.shops.isLoading());
  protected readonly errorMessage = computed(() => {
    const e1 = this.shops.error() as { status?: number; message?: string } | undefined;
    const e2 = this.statsResource.error() as { status?: number; message?: string } | undefined;
    const err = e1 ?? e2;
    if (!err) return null;
    if (err.status === 401 || err.status === 403) {
      return 'Bạn cần quyền ADMIN để xem danh sách này.';
    }
    return err.message ?? 'Không tải được danh sách shop.';
  });

  protected readonly items = computed<AdminShopRow[]>(() => this.shops.value()?.items ?? []);
  protected readonly totalItems = computed(() => this.shops.value()?.totalItems ?? 0);
  protected readonly totalPages = computed(() => this.shops.value()?.totalPages ?? 0);
  protected readonly rangeFrom = computed(() =>
    this.totalItems() === 0 ? 0 : this.page() * PAGE_SIZE + 1,
  );
  protected readonly rangeTo = computed(() =>
    Math.min((this.page() + 1) * PAGE_SIZE, this.totalItems()),
  );

  protected reload(): void {
    this.shops.reload();
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
  protected readonly detailModal = signal<AdminShopRow | null>(null);
  protected openDetail(s: AdminShopRow): void {
    this.detailModal.set(s);
  }
  protected closeDetail(): void {
    this.detailModal.set(null);
  }

  // -----------------------------------------------------------------
  // Edit modal
  // -----------------------------------------------------------------
  protected readonly editModal = signal<AdminShopRow | null>(null);
  protected editForm: ShopEditFormState = { ...EMPTY_EDIT_FORM };
  protected readonly editError = signal<string | null>(null);

  protected openEdit(s: AdminShopRow): void {
    this.editModal.set(s);
    this.editForm = {
      shopName: s.shopName ?? '',
      logo: s.logoUrl ?? '',
      introduction: '',
      shopType: s.shopType ?? '',
      businessType: s.businessType ?? '',
      email: s.email ?? '',
      phoneNumber: s.phoneNumber ?? '',
      taxId: '',
      shopAddress: '',
      city: s.city ?? '',
      province: s.province ?? '',
      postalCode: '',
      activeHours: '',
    };
    this.editError.set(null);
    this.detailModal.set(null);
  }

  protected closeEdit(): void {
    if (this.busyId()) return;
    this.editModal.set(null);
  }

  protected onEditField<K extends keyof ShopEditFormState>(field: K, value: string): void {
    this.editForm = { ...this.editForm, [field]: value as ShopEditFormState[K] };
  }

  protected submitEdit(): void {
    const shop = this.editModal();
    if (!shop) return;

    // Chỉ gửi field user thay đổi (so với row hiện tại) — tránh overwrite null không cố ý.
    const payload: AdminShopUpdatePayload = {};
    if (this.editForm.shopName !== (shop.shopName ?? '')) payload.shopName = this.editForm.shopName;
    if (this.editForm.shopType !== (shop.shopType ?? '')) payload.shopType = this.editForm.shopType;
    if (this.editForm.businessType !== (shop.businessType ?? '')) payload.businessType = this.editForm.businessType;
    if (this.editForm.email !== (shop.email ?? '')) payload.email = this.editForm.email;
    if (this.editForm.phoneNumber !== (shop.phoneNumber ?? '')) payload.phoneNumber = this.editForm.phoneNumber;
    if (this.editForm.city !== (shop.city ?? '')) payload.city = this.editForm.city;
    if (this.editForm.province !== (shop.province ?? '')) payload.province = this.editForm.province;
    // Các field row hiện tại không trả ra (taxId, shopAddress, postalCode, intro, activeHours, logo)
    // → chỉ gửi nếu user nhập vào (non-empty).
    if (this.editForm.taxId.trim()) payload.taxId = this.editForm.taxId;
    if (this.editForm.shopAddress.trim()) payload.shopAddress = this.editForm.shopAddress;
    if (this.editForm.postalCode.trim()) payload.postalCode = this.editForm.postalCode;
    if (this.editForm.activeHours.trim()) payload.activeHours = this.editForm.activeHours;
    if (this.editForm.introduction.trim()) payload.introduction = this.editForm.introduction;
    if (this.editForm.logo.trim()) payload.logo = this.editForm.logo;

    if (Object.keys(payload).length === 0) {
      this.editError.set('Chưa có thay đổi nào.');
      return;
    }
    this.editError.set(null);
    this.busyId.set(shop.shopId);

    this.api.update(shop.shopId, payload).subscribe({
      next: () => {
        this.busyId.set(null);
        this.editModal.set(null);
        this.toast.success('Đã cập nhật shop');
        this.reload();
      },
      error: (err) => {
        this.busyId.set(null);
        this.editError.set(this.extractMessage(err, 'Không thể cập nhật shop.'));
      },
    });
  }

  // -----------------------------------------------------------------
  // Ban modal
  // -----------------------------------------------------------------
  protected readonly banModal = signal<AdminShopRow | null>(null);
  protected readonly banReason = signal<string>('');
  protected readonly banError = signal<string | null>(null);

  protected openBan(shop: AdminShopRow): void {
    this.banModal.set(shop);
    this.banReason.set('');
    this.banError.set(null);
    this.detailModal.set(null);
  }

  protected closeBan(): void {
    if (this.busyId()) return;
    this.banModal.set(null);
  }

  protected onBanReasonChange(v: string): void {
    this.banReason.set(v);
  }

  protected submitBan(): void {
    const shop = this.banModal();
    if (!shop) return;
    const reason = this.banReason().trim();
    if (!reason) {
      this.banError.set('Vui lòng nhập lý do.');
      return;
    }
    if (reason.length < 8) {
      this.banError.set('Lý do quá ngắn (ít nhất 8 ký tự).');
      return;
    }
    this.banError.set(null);
    this.busyId.set(shop.shopId);

    this.api.ban(shop.shopId, reason).subscribe({
      next: () => {
        this.busyId.set(null);
        this.banModal.set(null);
        this.toast.success('Đã ban shop');
        this.reload();
      },
      error: (err) => {
        this.busyId.set(null);
        this.banError.set(this.extractMessage(err, 'Không thể ban shop.'));
      },
    });
  }

  // -----------------------------------------------------------------
  // Other actions
  // -----------------------------------------------------------------
  protected readonly busyId = signal<string | null>(null);

  protected unban(shop: AdminShopRow): void {
    if (this.busyId()) return;
    const ok = confirm(`Bỏ ban "${shop.shopName}"?`);
    if (!ok) return;

    this.busyId.set(shop.shopId);
    this.api.unban(shop.shopId).subscribe({
      next: () => {
        this.busyId.set(null);
        this.toast.success('Đã unban shop — status chuyển về ACTIVE');
        this.reload();
      },
      error: (err) => {
        this.busyId.set(null);
        this.toast.error(this.extractMessage(err, 'Không thể unban shop.'));
      },
    });
  }

  protected confirmClose(shop: AdminShopRow): void {
    if (this.busyId()) return;
    const ok = confirm(
      `Đóng cửa shop "${shop.shopName}"? Status sẽ chuyển về CLOSED — không thể mở lại.`,
    );
    if (!ok) return;

    this.busyId.set(shop.shopId);
    this.api.remove(shop.shopId).subscribe({
      next: () => {
        this.busyId.set(null);
        this.toast.success('Đã đóng cửa shop');
        this.reload();
      },
      error: (err) => {
        this.busyId.set(null);
        this.toast.error(this.extractMessage(err, 'Không thể đóng shop.'));
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

  protected formatNumber(n: number | null | undefined): string {
    return new Intl.NumberFormat('vi-VN').format(Number(n) || 0);
  }

  protected formatVnd(n: number | null | undefined): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(
      Number(n) || 0,
    );
  }

  /** Format ngắn cho cell num: 1.2tr / 12tr / 1.5B. */
  protected formatVndShort(n: number | null | undefined): string {
    const v = Number(n) || 0;
    if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B ₫`;
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}tr ₫`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k ₫`;
    return `${v.toLocaleString('vi-VN')} ₫`;
  }

  protected onLogoError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = this.placeholderShop;
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

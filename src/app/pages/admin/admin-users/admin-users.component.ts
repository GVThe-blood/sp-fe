import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { HotToastService } from '@ngxpert/hot-toast';

import {
  AdminUserListPage,
  AdminUserRow,
  AdminUserService,
  UserRoleValue,
  UserStatusValue,
} from '../../../services/admin-user.service';

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  BANNED: 'Banned',
  DELETED: 'Deleted',
};

const STATUS_CLASS: Record<string, string> = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  BANNED: 'banned',
  DELETED: 'deleted',
};

const ALL_ROLES: UserRoleValue[] = ['ADMIN', 'CUSTOMER', 'SHOP_OWNER', 'STAFF'];
const PAGE_SIZE = 20;

/**
 * Admin Users — list + stats + ban/unban + role management + soft delete.
 *
 * <p>Lưu ý: BE chặn admin tự ban / xoá / revoke role chính mình. FE cũng disable
 * action này từ phía UI (kiểm tra qua roles của user — admin không thể ban/del
 * admin khác). Đây là defence-in-depth: BE vẫn enforce, FE chỉ cải thiện UX.</p>
 */
@Component({
  selector: 'app-admin-users',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css',
})
export class AdminUsersComponent {
  private api = inject(AdminUserService);
  private toast = inject(HotToastService);

  // -----------------------------------------------------------------
  // Filter & pagination state
  // -----------------------------------------------------------------
  protected readonly statusFilter = signal<'all' | UserStatusValue>('all');
  protected readonly roleFilter = signal<'all' | UserRoleValue>('all');
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

  protected onStatusFilter(v: 'all' | UserStatusValue): void {
    this.statusFilter.set(v);
    this.page.set(0);
  }

  protected onRoleFilter(v: 'all' | UserRoleValue): void {
    this.roleFilter.set(v);
    this.page.set(0);
  }

  // -----------------------------------------------------------------
  // Data resources
  // -----------------------------------------------------------------
  private readonly users = rxResource<
    AdminUserListPage,
    {
      status: 'all' | UserStatusValue;
      role: 'all' | UserRoleValue;
      search: string;
      page: number;
    }
  >({
    request: () => ({
      status: this.statusFilter(),
      role: this.roleFilter(),
      search: this.search(),
      page: this.page(),
    }),
    loader: ({ request }) =>
      this.api.list({
        status: request.status,
        role: request.role,
        search: request.search,
        page: request.page,
        size: PAGE_SIZE,
      }),
  });

  private readonly statsResource = rxResource({
    request: () => ({}),
    loader: () => this.api.getStats(),
  });

  protected readonly stats = computed(() => this.statsResource.value() ?? null);

  protected readonly isLoading = computed(() => this.users.isLoading());
  protected readonly errorMessage = computed(() => {
    const e1 = this.users.error() as { status?: number; message?: string } | undefined;
    const e2 = this.statsResource.error() as { status?: number; message?: string } | undefined;
    const err = e1 ?? e2;
    if (!err) return null;
    if (err.status === 401 || err.status === 403) {
      return 'Bạn cần quyền ADMIN để xem trang này.';
    }
    return err.message ?? 'Không tải được danh sách người dùng.';
  });

  protected readonly items = computed<AdminUserRow[]>(() => this.users.value()?.items ?? []);
  protected readonly totalItems = computed(() => this.users.value()?.totalItems ?? 0);
  protected readonly totalPages = computed(() => this.users.value()?.totalPages ?? 0);
  protected readonly rangeFrom = computed(() =>
    this.totalItems() === 0 ? 0 : this.page() * PAGE_SIZE + 1,
  );
  protected readonly rangeTo = computed(() =>
    Math.min((this.page() + 1) * PAGE_SIZE, this.totalItems()),
  );

  protected reload(): void {
    this.users.reload();
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
  protected readonly detailModal = signal<AdminUserRow | null>(null);
  protected readonly newRole = signal<string>('');

  protected openDetail(u: AdminUserRow): void {
    this.detailModal.set(u);
    this.newRole.set('');
  }
  protected closeDetail(): void {
    this.detailModal.set(null);
  }

  /** Roles còn lại có thể gán (loại trừ những roles user đã có). */
  protected assignableRoles(user: AdminUserRow): UserRoleValue[] {
    const have = new Set(user.roles.map((r) => r.toUpperCase()));
    return ALL_ROLES.filter((r) => !have.has(r));
  }

  // -----------------------------------------------------------------
  // Ban modal
  // -----------------------------------------------------------------
  protected readonly banModal = signal<AdminUserRow | null>(null);
  protected readonly banReason = signal<string>('');
  protected readonly banError = signal<string | null>(null);

  protected openBan(user: AdminUserRow): void {
    this.banModal.set(user);
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
    const user = this.banModal();
    if (!user) return;
    const reason = this.banReason().trim();
    if (!reason) return this.banError.set('Vui lòng nhập lý do.');
    if (reason.length < 8) return this.banError.set('Lý do quá ngắn (ít nhất 8 ký tự).');

    this.banError.set(null);
    this.busyId.set(user.userId);
    this.api.ban(user.userId, reason).subscribe({
      next: () => {
        this.busyId.set(null);
        this.banModal.set(null);
        this.toast.success('Đã ban user');
        this.reload();
      },
      error: (err) => {
        this.busyId.set(null);
        this.banError.set(this.extractMessage(err, 'Không thể ban user.'));
      },
    });
  }

  // -----------------------------------------------------------------
  // Other actions
  // -----------------------------------------------------------------
  protected readonly busyId = signal<string | null>(null);

  protected unban(user: AdminUserRow): void {
    if (this.busyId()) return;
    const ok = confirm(`Bỏ ban "${user.username}"?`);
    if (!ok) return;

    this.busyId.set(user.userId);
    this.api.unban(user.userId).subscribe({
      next: () => {
        this.busyId.set(null);
        this.toast.success('Đã unban user');
        if (this.detailModal()?.userId === user.userId) this.detailModal.set(null);
        this.reload();
      },
      error: (err) => {
        this.busyId.set(null);
        this.toast.error(this.extractMessage(err, 'Không thể unban.'));
      },
    });
  }

  protected confirmDelete(user: AdminUserRow): void {
    if (this.busyId()) return;
    const ok = confirm(
      `Xoá user "${user.username}"? Account sẽ không đăng nhập được. Đơn hàng cũ vẫn còn.`,
    );
    if (!ok) return;

    this.busyId.set(user.userId);
    this.api.remove(user.userId).subscribe({
      next: () => {
        this.busyId.set(null);
        this.toast.success('Đã xoá user');
        this.reload();
      },
      error: (err) => {
        this.busyId.set(null);
        this.toast.error(this.extractMessage(err, 'Không thể xoá.'));
      },
    });
  }

  protected assignRole(user: AdminUserRow): void {
    const role = this.newRole() as UserRoleValue;
    if (!role) return;
    this.busyId.set(user.userId);
    this.api.assignRole(user.userId, role).subscribe({
      next: (updated) => {
        this.busyId.set(null);
        this.newRole.set('');
        this.toast.success(`Đã gán vai trò ${role}`);
        // Update detail modal in-place + reload list để đồng bộ.
        this.detailModal.set(updated);
        this.reload();
      },
      error: (err) => {
        this.busyId.set(null);
        this.toast.error(this.extractMessage(err, 'Không thể gán vai trò.'));
      },
    });
  }

  protected confirmRevokeRole(user: AdminUserRow, role: string): void {
    if (this.busyId()) return;
    const ok = confirm(`Thu hồi vai trò "${role}" của ${user.username}?`);
    if (!ok) return;

    this.busyId.set(user.userId);
    this.api.revokeRole(user.userId, role.toUpperCase() as UserRoleValue).subscribe({
      next: (updated) => {
        this.busyId.set(null);
        this.toast.success(`Đã thu hồi vai trò ${role}`);
        this.detailModal.set(updated);
        this.reload();
      },
      error: (err) => {
        this.busyId.set(null);
        this.toast.error(this.extractMessage(err, 'Không thể thu hồi vai trò.'));
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
  protected roleClass(role: string): string {
    const r = role.toUpperCase();
    if (r === 'ADMIN') return 'admin';
    if (r === 'SHOP_OWNER') return 'shop';
    if (r === 'STAFF') return 'staff';
    if (r === 'CUSTOMER') return 'customer';
    return '';
  }
  protected isAdmin(user: AdminUserRow): boolean {
    return user.roles.some((r) => r.toUpperCase() === 'ADMIN');
  }
  protected isAdminRole(role: string): boolean {
    return role.toUpperCase() === 'ADMIN';
  }

  protected fullName(user: AdminUserRow): string {
    return [user.firstName, user.lastName].filter((s) => !!s).join(' ').trim();
  }

  protected initials(user: AdminUserRow): string {
    const fn = (user.firstName || '').trim();
    const ln = (user.lastName || '').trim();
    if (fn && ln) return (fn[0] + ln[0]).toUpperCase();
    const username = (user.username || '').trim();
    if (username.length >= 2) return username.slice(0, 2).toUpperCase();
    if (username.length === 1) return username.toUpperCase();
    return 'U';
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

  protected formatVndShort(n: number | null | undefined): string {
    const v = Number(n) || 0;
    if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B ₫`;
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}tr ₫`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k ₫`;
    return `${v.toLocaleString('vi-VN')} ₫`;
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

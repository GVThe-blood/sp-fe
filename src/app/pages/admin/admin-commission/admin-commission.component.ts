import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { HotToastService } from '@ngxpert/hot-toast';

import {
  AdminCommissionService,
  CommissionConfig,
  CommissionConfigRequest,
  CommissionType,
} from '../../../services/admin-commission.service';

interface FormState {
  /** Sửa config nào (null = đang tạo mới). */
  editingId: string | null;
  name: string;
  description: string;
  commissionType: CommissionType;
  percentRate: number | null;
  flatAmount: number | null;
  minCommission: number | null;
  maxCommission: number | null;
  isActive: boolean;
  /** ISO datetime "YYYY-MM-DDTHH:mm" (datetime-local). */
  effectiveFrom: string;
  /** Trống = open-ended. */
  effectiveTo: string;
}

const EMPTY_FORM: FormState = {
  editingId: null,
  name: '',
  description: '',
  commissionType: 'PERCENTAGE',
  percentRate: 5.0,
  flatAmount: null,
  minCommission: null,
  maxCommission: null,
  isActive: true,
  effectiveFrom: '',
  effectiveTo: '',
};

/**
 * Trang Admin → Cấu hình hoa hồng.
 *
 * <p>2 panel:</p>
 * <ul>
 *   <li>Trái: bảng list configs (active đầu tiên, sau đó theo createdAt DESC).</li>
 *   <li>Phải: form tạo/sửa với 3 mode (PERCENTAGE/FLAT/HYBRID).</li>
 * </ul>
 *
 * <p>Mỗi lần activate → BE tự deactivate config khác (xem
 * {@code PlatformCommissionConfigService.deactivateCurrentConfig}).</p>
 */
@Component({
  selector: 'app-admin-commission',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-commission.component.html',
  styleUrl: './admin-commission.component.css',
})
export class AdminCommissionComponent {
  private api = inject(AdminCommissionService);
  private toast = inject(HotToastService);

  protected readonly types: ReadonlyArray<{ value: CommissionType; label: string; hint: string }> = [
    {
      value: 'PERCENTAGE',
      label: 'Phần trăm GMV',
      hint: 'commission = revenue × rate%, kẹp giữa min và max',
    },
    {
      value: 'FLAT',
      label: 'Phí cố định',
      hint: 'commission = flat (mỗi đơn). Không phụ thuộc giá trị đơn',
    },
    {
      value: 'HYBRID',
      label: 'Kết hợp',
      hint: 'commission = MAX(rate%, flat), kẹp giữa min và max',
    },
  ];

  protected readonly form = signal<FormState>({ ...EMPTY_FORM });
  protected readonly saving = signal(false);

  /** Trigger để rxResource refetch sau mutation. */
  private readonly listVersion = signal(0);

  private readonly listResource = rxResource<CommissionConfig[], number>({
    request: () => this.listVersion(),
    loader: () => this.api.list(),
  });

  protected readonly configs = computed(() => {
    const list = this.listResource.value() ?? [];
    // Active đầu tiên, sau đó theo createdAt DESC.
    return [...list].sort((a, b) => {
      if (a.currentlyEffective !== b.currentlyEffective) {
        return a.currentlyEffective ? -1 : 1;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  });

  protected readonly listLoading = computed(() => this.listResource.isLoading());
  protected readonly activeConfig = computed(() => this.configs().find((c) => c.currentlyEffective) ?? null);

  // -----------------------------------------------------------------
  // Form helpers
  // -----------------------------------------------------------------
  protected resetForm(): void {
    this.form.set({ ...EMPTY_FORM });
  }

  protected loadForEdit(c: CommissionConfig): void {
    this.form.set({
      editingId: c.configId,
      name: c.name,
      description: c.description ?? '',
      commissionType: c.commissionType,
      percentRate: c.percentRate,
      flatAmount: c.flatAmount,
      minCommission: c.minCommission,
      maxCommission: c.maxCommission,
      isActive: c.isActive,
      effectiveFrom: this.toDatetimeLocal(c.effectiveFrom),
      effectiveTo: c.effectiveTo ? this.toDatetimeLocal(c.effectiveTo) : '',
    });
  }

  protected updateField<K extends keyof FormState>(field: K, value: FormState[K]): void {
    this.form.update((f) => ({ ...f, [field]: value }));
  }

  protected setType(t: CommissionType): void {
    this.form.update((f) => ({
      ...f,
      commissionType: t,
      // Reset values not relevant cho type mới để tránh validate fail.
      percentRate: t === 'FLAT' ? null : f.percentRate ?? 5.0,
      flatAmount: t === 'PERCENTAGE' ? null : f.flatAmount ?? 1000,
    }));
  }

  protected save(): void {
    const f = this.form();
    if (!f.name.trim()) {
      this.toast.error('Tên cấu hình không được để trống');
      return;
    }
    if (f.commissionType === 'PERCENTAGE' && (f.percentRate == null || f.percentRate < 0)) {
      this.toast.error('Cần nhập tỉ lệ % hợp lệ');
      return;
    }
    if (f.commissionType === 'FLAT' && (f.flatAmount == null || f.flatAmount < 0)) {
      this.toast.error('Cần nhập số tiền cố định hợp lệ');
      return;
    }
    if (f.commissionType === 'HYBRID' && (f.percentRate == null || f.flatAmount == null)) {
      this.toast.error('HYBRID cần cả tỉ lệ % và số cố định');
      return;
    }

    const body: CommissionConfigRequest = {
      name: f.name.trim(),
      description: f.description?.trim() || null,
      commissionType: f.commissionType,
      percentRate: f.commissionType === 'FLAT' ? null : f.percentRate,
      flatAmount: f.commissionType === 'PERCENTAGE' ? null : f.flatAmount,
      minCommission: f.minCommission ?? null,
      maxCommission: f.maxCommission ?? null,
      isActive: f.isActive,
      effectiveFrom: f.effectiveFrom ? new Date(f.effectiveFrom).toISOString() : null,
      effectiveTo: f.effectiveTo ? new Date(f.effectiveTo).toISOString() : null,
    };

    this.saving.set(true);
    const op$ = f.editingId
      ? this.api.update(f.editingId, body)
      : this.api.create(body);

    op$.subscribe({
      next: () => {
        this.toast.success(f.editingId ? 'Đã cập nhật cấu hình' : 'Đã tạo cấu hình mới');
        this.resetForm();
        this.refetch();
        this.saving.set(false);
      },
      error: (err) => {
        const msg = err?.error?.message || 'Không lưu được cấu hình';
        this.toast.error(msg);
        this.saving.set(false);
      },
    });
  }

  protected activate(c: CommissionConfig): void {
    if (c.currentlyEffective) return;
    this.api.activate(c.configId).subscribe({
      next: () => {
        this.toast.success(`Đã kích hoạt: ${c.name}`);
        this.refetch();
      },
      error: () => this.toast.error('Không kích hoạt được'),
    });
  }

  protected deactivate(c: CommissionConfig): void {
    if (!c.isActive) return;
    if (!confirm(`Tắt cấu hình "${c.name}"? Hệ thống sẽ rơi về fallback 5% mặc định nếu không có config nào active.`))
      return;
    this.api.deactivate(c.configId).subscribe({
      next: () => {
        this.toast.success('Đã tắt cấu hình');
        this.refetch();
      },
      error: () => this.toast.error('Không tắt được'),
    });
  }

  protected delete(c: CommissionConfig): void {
    if (!confirm(`Xoá cấu hình "${c.name}"? Hành động không thể hoàn tác.`)) return;
    this.api.delete(c.configId).subscribe({
      next: () => {
        this.toast.success('Đã xoá cấu hình');
        if (this.form().editingId === c.configId) this.resetForm();
        this.refetch();
      },
      error: () => this.toast.error('Không xoá được'),
    });
  }

  private refetch(): void {
    this.listVersion.update((v) => v + 1);
  }

  // -----------------------------------------------------------------
  // Formatting helpers
  // -----------------------------------------------------------------
  protected formatPercent(v: number | null): string {
    return v == null ? '—' : `${v.toFixed(2)}%`;
  }

  protected formatCurrency(v: number | null): string {
    if (v == null) return '—';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(v);
  }

  protected formatDateTime(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  protected typeLabel(t: CommissionType): string {
    return this.types.find((x) => x.value === t)?.label ?? t;
  }

  /** Convert ISO timestamp → "YYYY-MM-DDTHH:mm" cho input[type=datetime-local]. */
  private toDatetimeLocal(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}

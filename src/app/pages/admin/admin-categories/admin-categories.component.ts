import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HotToastService } from '@ngxpert/hot-toast';

import {
  AdminCategoryService,
  AdminCategoryUpsert,
  AdminCategoryView,
} from '../../../services/admin-category.service';

type OwnerFilter = 'all' | 'system' | 'shop';
type StatusFilter = 'all' | 'active' | 'inactive';
type OwnerType = 'system' | 'shop';

interface CategoryFormState {
  name: string;
  slug: string;
  description: string;
  parentName: string;
  categoryGroupCode: string;
  ownerType: OwnerType;
  /** Chỉ relevant khi ownerType=shop. */
  shopId: string;
}

const EMPTY_FORM: CategoryFormState = {
  name: '',
  slug: '',
  description: '',
  parentName: '',
  categoryGroupCode: '',
  ownerType: 'system',
  shopId: '',
};

/**
 * Admin Categories — list + filter + CRUD modal.
 *
 * <p>Pattern dữ liệu:
 *  - {@code categories} signal cache list từ BE
 *  - {@code search/ownerFilter/statusFilter} signal cho filter bar
 *  - {@code filtered} computed apply filter trên cache (không re-fetch).
 *  - Mọi mutation sau khi success refresh lại list bằng load().</p>
 */
@Component({
  selector: 'app-admin-categories',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './admin-categories.component.html',
  styleUrl: './admin-categories.component.css',
})
export class AdminCategoriesComponent {
  private readonly api = inject(AdminCategoryService);
  private readonly toast = inject(HotToastService);

  // -----------------------------------------------------------------
  // Data
  // -----------------------------------------------------------------
  protected readonly categories = signal<AdminCategoryView[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  // -----------------------------------------------------------------
  // Filters
  // -----------------------------------------------------------------
  protected readonly search = signal('');
  protected readonly ownerFilter = signal<OwnerFilter>('all');
  protected readonly statusFilter = signal<StatusFilter>('all');

  protected readonly filtered = computed<AdminCategoryView[]>(() => {
    const q = this.search().trim().toLowerCase();
    const owner = this.ownerFilter();
    const status = this.statusFilter();

    return this.categories().filter((c) => {
      if (owner === 'system' && c.shopId) return false;
      if (owner === 'shop' && !c.shopId) return false;
      if (status === 'active' && !c.isActive) return false;
      if (status === 'inactive' && c.isActive) return false;

      if (q) {
        const haystack = `${c.name} ${c.slug} ${c.description ?? ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  });

  /**
   * Danh sách parent có thể chọn — tránh self-reference khi đang edit. Không
   * filter theo ownership vì admin được phép gán parent xuyên scope.
   */
  protected readonly selectableParents = computed<AdminCategoryView[]>(() => {
    const editing = this.editingName();
    return this.categories().filter((c) => c.name !== editing);
  });

  // -----------------------------------------------------------------
  // Modal state
  // -----------------------------------------------------------------
  protected readonly modalOpen = signal(false);
  /** Tên category đang edit; null = đang tạo mới. */
  protected readonly editingName = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);
  /**
   * Form state để dạng plain object — không dùng Reactive Forms để giữ component
   * gọn. Mutation qua {@code onFormField} sau đó re-set lại cho immutability.
   */
  protected form: CategoryFormState = { ...EMPTY_FORM };

  // -----------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------
  constructor() {
    this.load();
  }

  protected reload(): void {
    this.load();
  }

  private load(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.api.list().subscribe({
      next: (list) => {
        this.categories.set(list);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(this.extractErrorMessage(err, 'Không tải được danh sách danh mục.'));
      },
    });
  }

  // -----------------------------------------------------------------
  // Filter handlers
  // -----------------------------------------------------------------
  protected onSearch(value: string): void {
    this.search.set(value);
  }

  protected onOwnerFilter(value: OwnerFilter): void {
    this.ownerFilter.set(value);
  }

  protected onStatusFilter(value: StatusFilter): void {
    this.statusFilter.set(value);
  }

  // -----------------------------------------------------------------
  // Modal handlers
  // -----------------------------------------------------------------
  protected openCreateModal(): void {
    this.editingName.set(null);
    this.form = { ...EMPTY_FORM };
    this.formError.set(null);
    this.modalOpen.set(true);
  }

  protected openEditModal(cat: AdminCategoryView): void {
    this.editingName.set(cat.name);
    this.form = {
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? '',
      parentName: cat.parentName ?? '',
      categoryGroupCode: cat.categoryGroupCode ?? '',
      ownerType: cat.shopId ? 'shop' : 'system',
      shopId: cat.shopId ?? '',
    };
    this.formError.set(null);
    this.modalOpen.set(true);
  }

  protected closeModal(): void {
    if (this.saving()) return;
    this.modalOpen.set(false);
  }

  protected onFormField<K extends keyof CategoryFormState>(field: K, value: string): void {
    // Khi user đổi ownerType từ shop sang system, clear shopId luôn để tránh
    // gửi UUID rỗng/invalid lên BE.
    const next: CategoryFormState = { ...this.form, [field]: value as CategoryFormState[K] };
    if (field === 'ownerType' && (value as OwnerType) === 'system') {
      next.shopId = '';
    }
    this.form = next;
  }

  protected save(): void {
    const validation = this.validateForm();
    if (validation) {
      this.formError.set(validation);
      return;
    }
    this.formError.set(null);
    this.saving.set(true);

    const payload: AdminCategoryUpsert = {
      name: this.form.name.trim(),
      slug: this.form.slug.trim(),
      description: this.form.description.trim() || undefined,
      parentName: this.form.parentName.trim() || undefined,
      categoryGroupCode: this.form.categoryGroupCode.trim() || undefined,
      // ownerType=system gửi null để biến thành system category. ownerType=shop
      // mà shopId rỗng cũng coi như null (BE sẽ throw nếu UUID invalid).
      shopId: this.form.ownerType === 'shop' ? this.form.shopId.trim() || null : null,
    };

    const editing = this.editingName();
    const obs = editing ? this.api.update(editing, payload) : this.api.create(payload);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.modalOpen.set(false);
        this.toast.success(editing ? 'Đã cập nhật danh mục' : 'Đã tạo danh mục mới');
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(this.extractErrorMessage(err, 'Không thể lưu danh mục.'));
      },
    });
  }

  private validateForm(): string | null {
    if (!this.form.name.trim()) return 'Tên danh mục không được để trống.';
    if (!this.form.slug.trim()) return 'Slug không được để trống.';
    if (this.form.ownerType === 'shop' && this.form.shopId.trim()) {
      // Validate UUID-ish format ngay client để tránh round-trip.
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(this.form.shopId.trim())) {
        return 'Shop ID phải là UUID hợp lệ.';
      }
    }
    return null;
  }

  // -----------------------------------------------------------------
  // Row actions
  // -----------------------------------------------------------------
  protected toggleActive(cat: AdminCategoryView): void {
    this.api.setActive(cat.name, !cat.isActive).subscribe({
      next: () => {
        this.toast.success(cat.isActive ? 'Đã tắt danh mục' : 'Đã bật danh mục');
        this.load();
      },
      error: (err) => {
        this.toast.error(this.extractErrorMessage(err, 'Không thể đổi trạng thái.'));
      },
    });
  }

  protected confirmDelete(cat: AdminCategoryView): void {
    // Confirm bằng native dialog cho gọn — admin power user, không cần custom modal.
    const ok = confirm(`Xoá danh mục "${cat.name}"? Không thể khôi phục.`);
    if (!ok) return;

    this.api.remove(cat.name).subscribe({
      next: () => {
        this.toast.success('Đã xoá danh mục');
        this.load();
      },
      error: (err) => {
        // FK constraint khi category đang được sản phẩm tham chiếu — gợi ý dùng Tắt thay vì Xoá.
        const fallback =
          'Không thể xoá. Có thể danh mục đang được sản phẩm sử dụng — hãy "Tắt" thay vì xoá.';
        this.toast.error(this.extractErrorMessage(err, fallback));
      },
    });
  }

  // -----------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------
  private extractErrorMessage(err: unknown, fallback: string): string {
    if (err && typeof err === 'object') {
      const anyErr = err as { error?: { message?: string }; message?: string; status?: number };
      if (anyErr.status === 401 || anyErr.status === 403) {
        return 'Bạn cần quyền ADMIN để thực hiện thao tác này.';
      }
      const m = anyErr.error?.message ?? anyErr.message;
      if (m && typeof m === 'string') return m;
    }
    return fallback;
  }
}

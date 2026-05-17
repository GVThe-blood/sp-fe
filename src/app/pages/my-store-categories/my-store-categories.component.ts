import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
import { firstValueFrom } from 'rxjs';
import { StoreSidebarComponent } from '../../components/store-sidebar/store-sidebar.component';
import {
  CategoryService,
  CategoryUpsert,
  CategoryView,
} from '../../services/category.service';

interface CategoryGroup {
  ownedByShop: CategoryView[];
  system: CategoryView[];
}

/**
 * Shop-owner page for managing the categories owned by the shop. System-wide
 * categories are surfaced read-only so the owner can see what taxonomy they
 * inherit from the platform.
 */
@Component({
  selector: 'app-my-store-categories',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, StoreSidebarComponent],
  templateUrl: './my-store-categories.component.html',
  styleUrl: './my-store-categories.component.css',
})
export class MyStoreCategoriesComponent {
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private toast = inject(HotToastService);

  protected readonly visible = rxResource<CategoryView[], void>({
    request: () => undefined,
    loader: () => this.categoryService.listVisible(),
  });

  protected groups = computed<CategoryGroup>(() => {
    const items = this.visible.value() ?? [];
    return {
      system: items.filter((c) => c.shopId === null),
      ownedByShop: items.filter((c) => c.shopId !== null),
    };
  });

  protected readonly errorMessage = computed(() => {
    const err = this.visible.error() as { error?: { message?: string }; message?: string } | undefined;
    if (!err) return '';
    if ((err as any).status === 401 || (err as any).status === 403) {
      return 'Bạn cần đăng nhập với tài khoản chủ shop để quản lý danh mục.';
    }
    return err.error?.message ?? err.message ?? 'Không tải được danh sách danh mục.';
  });

  // -------------------------------------------------------------------------
  // Modal state — single dialog used for both create and edit.
  // -------------------------------------------------------------------------
  protected showModal = signal(false);
  protected modalMode = signal<'create' | 'edit'>('create');
  protected editingName = signal<string | null>(null);
  protected submitting = signal(false);

  protected form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    slug: ['', [Validators.required, Validators.maxLength(255)]],
    description: [''],
    parentName: [''],
    categoryGroupCode: [''],
  });

  protected openCreate(): void {
    this.modalMode.set('create');
    this.editingName.set(null);
    this.form.reset({ name: '', slug: '', description: '', parentName: '', categoryGroupCode: '' });
    this.form.get('name')?.enable();
    this.showModal.set(true);
  }

  protected openEdit(category: CategoryView): void {
    if (category.shopId === null) {
      this.toast.warning('Danh mục hệ thống chỉ có thể xem.');
      return;
    }
    this.modalMode.set('edit');
    this.editingName.set(category.name);
    this.form.reset({
      name: category.name,
      slug: category.slug,
      description: category.description ?? '',
      parentName: category.parentName ?? '',
      categoryGroupCode: category.categoryGroupCode ?? '',
    });
    // Name is the PK on the BE — disallow renaming to avoid product FK breakage.
    this.form.get('name')?.disable();
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
    const v = this.form.getRawValue();
    const payload: CategoryUpsert = {
      name: v.name?.trim(),
      slug: v.slug?.trim(),
      description: v.description || undefined,
      parentName: v.parentName || undefined,
      categoryGroupCode: v.categoryGroupCode || undefined,
    };

    this.submitting.set(true);
    try {
      if (this.modalMode() === 'create') {
        await firstValueFrom(this.categoryService.create(payload));
        this.toast.success('Đã tạo danh mục');
      } else {
        const name = this.editingName();
        if (!name) return;
        await firstValueFrom(this.categoryService.update(name, payload));
        this.toast.success('Đã cập nhật danh mục');
      }
      this.showModal.set(false);
      this.visible.reload();
    } catch (err: any) {
      this.toast.error(err?.error?.message ?? 'Thao tác thất bại');
    } finally {
      this.submitting.set(false);
    }
  }

  protected async confirmDelete(category: CategoryView): Promise<void> {
    if (category.shopId === null) return;
    if (!confirm(`Xóa danh mục "${category.name}"?`)) return;
    this.submitting.set(true);
    try {
      await firstValueFrom(this.categoryService.remove(category.name));
      this.toast.success('Đã xóa danh mục');
      this.visible.reload();
    } catch (err: any) {
      this.toast.error(err?.error?.message ?? 'Không thể xóa danh mục');
    } finally {
      this.submitting.set(false);
    }
  }
}

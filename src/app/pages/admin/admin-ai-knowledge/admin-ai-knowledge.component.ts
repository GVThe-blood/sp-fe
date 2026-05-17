import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { HotToastService } from '@ngxpert/hot-toast';

import {
  AdminKnowledgeDocumentRow,
  AdminKnowledgeListPage,
  AdminKnowledgeService,
  KnowledgeSourceType,
  RagSearchResponse,
} from '../../../services/admin-knowledge.service';

const PAGE_SIZE = 20;

const ALL_SOURCE_TYPES: KnowledgeSourceType[] = [
  'PRODUCT', 'SHOP', 'ORDER', 'POLICY', 'FAQ', 'MANUAL', 'GENERAL',
];

const BADGE_CLASS: Record<string, string> = {
  PRODUCT: 'product',
  SHOP: 'shop',
  ORDER: 'order',
  POLICY: 'policy',
  FAQ: 'faq',
  MANUAL: 'manual',
  GENERAL: 'general',
};

interface TextFormState {
  title: string;
  content: string;
  sourceType: KnowledgeSourceType;
  sourceId: string;
}

interface FileFormState {
  title: string;
  sourceType: KnowledgeSourceType;
  sourceId: string;
}

const EMPTY_TEXT_FORM: TextFormState = {
  title: '',
  content: '',
  sourceType: 'GENERAL',
  sourceId: '',
};

const EMPTY_FILE_FORM: FileFormState = {
  title: '',
  sourceType: 'MANUAL',
  sourceId: '',
};

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

/**
 * Admin AI Knowledge — 3 tab:
 *   1. Documents: list + filter + delete + detail.
 *   2. Upload   : 2 form (text + file PDF/DOCX).
 *   3. Search   : test query semantic vào vector store.
 *
 * <p>Stats cards + quick sync buttons hiển thị ở mọi tab (top of page) vì
 * admin thường muốn xem trạng thái tổng quan trước khi sửa.</p>
 */
@Component({
  selector: 'app-admin-ai-knowledge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './admin-ai-knowledge.component.html',
  styleUrl: './admin-ai-knowledge.component.css',
})
export class AdminAiKnowledgeComponent {
  private api = inject(AdminKnowledgeService);
  private toast = inject(HotToastService);

  protected readonly allSourceTypes: ReadonlyArray<KnowledgeSourceType> = ALL_SOURCE_TYPES;

  // -----------------------------------------------------------------
  // Tabs
  // -----------------------------------------------------------------
  protected readonly tab = signal<'documents' | 'upload' | 'search'>('documents');

  // -----------------------------------------------------------------
  // Filter & pagination (documents tab)
  // -----------------------------------------------------------------
  protected readonly sourceTypeFilter = signal<'all' | KnowledgeSourceType>('all');
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

  protected onSourceTypeFilter(v: 'all' | KnowledgeSourceType): void {
    this.sourceTypeFilter.set(v);
    this.page.set(0);
  }

  // -----------------------------------------------------------------
  // Resources
  // -----------------------------------------------------------------
  private readonly documents = rxResource<
    AdminKnowledgeListPage,
    { sourceType: 'all' | KnowledgeSourceType; search: string; page: number }
  >({
    request: () => ({
      sourceType: this.sourceTypeFilter(),
      search: this.search(),
      page: this.page(),
    }),
    loader: ({ request }) =>
      this.api.list({
        sourceType: request.sourceType,
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
  protected readonly isLoading = computed(() => this.documents.isLoading());
  protected readonly errorMessage = computed(() => {
    const e1 = this.documents.error() as { status?: number; message?: string } | undefined;
    const e2 = this.statsResource.error() as { status?: number; message?: string } | undefined;
    const err = e1 ?? e2;
    if (!err) return null;
    if (err.status === 401 || err.status === 403) {
      return 'Bạn cần quyền ADMIN để xem trang này.';
    }
    return err.message ?? 'Không tải được knowledge base.';
  });

  protected readonly items = computed<AdminKnowledgeDocumentRow[]>(
    () => this.documents.value()?.items ?? [],
  );
  protected readonly totalItems = computed(() => this.documents.value()?.totalItems ?? 0);
  protected readonly totalPages = computed(() => this.documents.value()?.totalPages ?? 0);
  protected readonly rangeFrom = computed(() =>
    this.totalItems() === 0 ? 0 : this.page() * PAGE_SIZE + 1,
  );
  protected readonly rangeTo = computed(() =>
    Math.min((this.page() + 1) * PAGE_SIZE, this.totalItems()),
  );

  protected reload(): void {
    this.documents.reload();
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
  protected readonly detailModal = signal<AdminKnowledgeDocumentRow | null>(null);

  protected openDetail(doc: AdminKnowledgeDocumentRow): void {
    // Fetch full document detail (preview = false ở BE → trả full content).
    this.api.get(doc.id).subscribe({
      next: (full) => this.detailModal.set(full),
      error: () => this.detailModal.set(doc),
    });
  }

  protected closeDetail(): void {
    this.detailModal.set(null);
  }

  protected hasMetadata(meta: Record<string, unknown> | null): boolean {
    if (!meta) return false;
    return Object.keys(meta).length > 0;
  }

  // -----------------------------------------------------------------
  // Delete
  // -----------------------------------------------------------------
  protected readonly busyId = signal<string | null>(null);

  protected confirmDelete(doc: AdminKnowledgeDocumentRow): void {
    if (this.busyId()) return;
    const ok = confirm(`Xoá "${doc.title}"? Vector store cũng sẽ bị xoá theo.`);
    if (!ok) return;

    this.busyId.set(doc.id);
    this.api.remove(doc.id).subscribe({
      next: (res) => {
        this.busyId.set(null);
        if (res.success) {
          this.toast.success('Đã xoá document');
          if (this.detailModal()?.id === doc.id) this.detailModal.set(null);
          this.reload();
        } else {
          this.toast.error(res.message || 'Xoá thất bại');
        }
      },
      error: (err) => {
        this.busyId.set(null);
        this.toast.error(this.extractMessage(err, 'Không thể xoá.'));
      },
    });
  }

  // -----------------------------------------------------------------
  // Quick sync
  // -----------------------------------------------------------------
  protected readonly syncing = signal(false);

  protected runSync(kind: 'products' | 'shops' | 'all'): void {
    if (this.syncing()) return;
    const obs =
      kind === 'products' ? this.api.syncProducts()
      : kind === 'shops' ? this.api.syncShops()
      : this.api.syncAll();

    this.syncing.set(true);
    const startedAt = Date.now();
    obs.subscribe({
      next: (res) => {
        this.syncing.set(false);
        const took = Math.round((Date.now() - startedAt) / 1000);
        if (res.success) {
          this.toast.success(`${res.message} · ${res.chunkCount ?? 0} chunks · ${took}s`);
          this.reload();
        } else {
          this.toast.error(res.message || 'Sync thất bại');
        }
      },
      error: (err) => {
        this.syncing.set(false);
        this.toast.error(this.extractMessage(err, 'Sync thất bại.'));
      },
    });
  }

  // -----------------------------------------------------------------
  // Upload (text)
  // -----------------------------------------------------------------
  protected readonly uploading = signal(false);
  protected textForm: TextFormState = { ...EMPTY_TEXT_FORM };
  protected readonly textError = signal<string | null>(null);

  protected onTextField<K extends keyof TextFormState>(field: K, value: string): void {
    this.textForm = { ...this.textForm, [field]: value as TextFormState[K] };
  }

  protected submitText(): void {
    if (this.uploading()) return;
    const f = this.textForm;
    if (!f.title.trim()) return this.textError.set('Tiêu đề bắt buộc.');
    if (!f.sourceId.trim()) return this.textError.set('Source ID bắt buộc.');
    if (!f.content.trim()) return this.textError.set('Nội dung không được để trống.');

    this.textError.set(null);
    this.uploading.set(true);
    this.api
      .uploadText({
        title: f.title.trim(),
        content: f.content,
        sourceType: f.sourceType,
        sourceId: f.sourceId.trim(),
      })
      .subscribe({
        next: (res) => {
          this.uploading.set(false);
          if (res.success) {
            this.toast.success(`Đã upload — ${res.chunkCount ?? 0} chunks`);
            this.textForm = { ...EMPTY_TEXT_FORM };
            this.reload();
            this.tab.set('documents');
          } else {
            this.textError.set(res.message || 'Upload thất bại');
          }
        },
        error: (err) => {
          this.uploading.set(false);
          this.textError.set(this.extractMessage(err, 'Upload thất bại.'));
        },
      });
  }

  // -----------------------------------------------------------------
  // Upload (file)
  // -----------------------------------------------------------------
  protected fileForm: FileFormState = { ...EMPTY_FILE_FORM };
  protected readonly fileError = signal<string | null>(null);
  protected readonly selectedFile = signal<File | null>(null);
  protected readonly dragOver = signal<boolean>(false);

  protected onFileField<K extends keyof FileFormState>(field: K, value: string): void {
    this.fileForm = { ...this.fileForm, [field]: value as FileFormState[K] };
  }

  protected onFileSelected(files: FileList | null): void {
    if (!files || files.length === 0) {
      this.selectedFile.set(null);
      return;
    }
    const f = files[0];
    if (!this.validateFile(f)) return;
    this.selectedFile.set(f);
    // Auto-fill title nếu user chưa nhập.
    if (!this.fileForm.title.trim()) {
      const base = f.name.replace(/\.[^/.]+$/, '');
      this.fileForm = { ...this.fileForm, title: base };
    }
    this.fileError.set(null);
  }

  protected onDragOver(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.dragOver.set(true);
  }

  protected onDragLeave(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.dragOver.set(false);
  }

  protected onDrop(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.dragOver.set(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      this.onFileSelected(files);
    }
  }

  private validateFile(f: File): boolean {
    if (f.size > MAX_FILE_SIZE_BYTES) {
      this.fileError.set('File quá lớn (tối đa 20MB).');
      return false;
    }
    const name = f.name.toLowerCase();
    if (!name.endsWith('.pdf') && !name.endsWith('.docx')) {
      this.fileError.set('Chỉ hỗ trợ .pdf hoặc .docx.');
      return false;
    }
    return true;
  }

  protected submitFile(): void {
    if (this.uploading()) return;
    const file = this.selectedFile();
    if (!file) return this.fileError.set('Hãy chọn file.');
    if (!this.fileForm.title.trim()) return this.fileError.set('Tiêu đề bắt buộc.');
    if (!this.fileForm.sourceId.trim()) return this.fileError.set('Source ID bắt buộc.');

    this.fileError.set(null);
    this.uploading.set(true);
    this.api
      .uploadFile({
        file,
        title: this.fileForm.title.trim(),
        sourceType: this.fileForm.sourceType,
        sourceId: this.fileForm.sourceId.trim(),
      })
      .subscribe({
        next: (res) => {
          this.uploading.set(false);
          if (res.success) {
            this.toast.success(`Đã upload ${file.name} — ${res.chunkCount ?? 0} chunks`);
            this.selectedFile.set(null);
            this.fileForm = { ...EMPTY_FILE_FORM };
            this.reload();
            this.tab.set('documents');
          } else {
            this.fileError.set(res.message || 'Upload thất bại');
          }
        },
        error: (err) => {
          this.uploading.set(false);
          this.fileError.set(this.extractMessage(err, 'Upload thất bại.'));
        },
      });
  }

  // -----------------------------------------------------------------
  // Search tab
  // -----------------------------------------------------------------
  protected readonly searchQuery = signal<string>('');
  protected readonly searchTopK = signal<number>(5);
  protected readonly searchThreshold = signal<number>(0.7);
  protected readonly searchSourceType = signal<string>('');
  protected readonly searching = signal(false);
  protected readonly searchResult = signal<RagSearchResponse | null>(null);
  protected readonly searchError = signal<string | null>(null);

  protected runSearch(): void {
    const q = this.searchQuery().trim();
    if (!q) return this.searchError.set('Nhập câu hỏi để search.');
    this.searchError.set(null);
    this.searching.set(true);
    this.api
      .search({
        query: q,
        topK: this.searchTopK(),
        similarityThreshold: this.searchThreshold(),
        sourceType: this.searchSourceType() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.searching.set(false);
          this.searchResult.set(res);
        },
        error: (err) => {
          this.searching.set(false);
          this.searchError.set(this.extractMessage(err, 'Search thất bại.'));
        },
      });
  }

  // -----------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------
  protected badgeClass(sourceType: string | null | undefined): string {
    if (!sourceType) return '';
    return BADGE_CLASS[sourceType.toUpperCase()] ?? '';
  }

  protected formatNumber(n: number | null | undefined): string {
    return new Intl.NumberFormat('vi-VN').format(Number(n) || 0);
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

  /** Format epoch ms (từ stats.latestUpdatedAt) — short form cho card hẹp. */
  protected formatLatest(epochMs: number | null | undefined): string {
    if (!epochMs) return '—';
    const d = new Date(epochMs);
    return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  protected formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

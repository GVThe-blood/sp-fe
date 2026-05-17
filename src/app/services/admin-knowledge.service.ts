import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export type KnowledgeSourceType =
  | 'PRODUCT'
  | 'SHOP'
  | 'ORDER'
  | 'POLICY'
  | 'FAQ'
  | 'MANUAL'
  | 'GENERAL';

export interface AdminKnowledgeStats {
  totalDocuments: number;
  totalChunks: number;
  activeDocuments: number;
  countBySourceType: Record<string, number>;
  /** epoch ms; null nếu chưa có document. */
  latestUpdatedAt: number | null;
}

export interface AdminKnowledgeDocumentRow {
  id: string;
  title: string;
  sourceType: string;
  sourceId: string | null;
  contentPreview: string;
  metadata: Record<string, unknown> | null;
  chunkCount: number | null;
  isActive: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface DocumentUploadRequestPayload {
  title: string;
  content: string;
  sourceType: KnowledgeSourceType;
  sourceId: string;
  additionalMetadata?: Record<string, unknown>;
}

export interface DocumentUploadResponse {
  message: string;
  sourceType: string | null;
  sourceId: string | null;
  chunkCount: number | null;
  documentId: number | null;
  success: boolean;
}

export interface RagSearchPayload {
  query: string;
  topK?: number;
  similarityThreshold?: number;
  sourceType?: string;
  metadataFilters?: Record<string, unknown>;
}

export interface RagSearchResult {
  content: string;
  similarity: number;
  metadata: Record<string, unknown> | null;
  sourceType: string | null;
  sourceId: string | null;
  title: string | null;
}

export interface RagSearchResponse {
  query: string;
  results: RagSearchResult[];
  totalResults: number;
  context: string;
}

interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface AdminKnowledgeListPage {
  items: AdminKnowledgeDocumentRow[];
  totalItems: number;
  totalPages: number;
  page: number;
  pageSize: number;
}

/**
 * HTTP client cho `/api/v1/admin/knowledge/**`. Gateway có route riêng
 * (`admin-knowledge`) rewrite thành `/api/admin/knowledge/**` ở chat-service.
 *
 * <p>BE filter security pattern `/api/admin/**` yêu cầu authority `ROLE_ADMIN`,
 * thêm @PreAuthorize trên controller — defence-in-depth.</p>
 */
@Injectable({ providedIn: 'root' })
export class AdminKnowledgeService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin/knowledge`;

  // ----- Stats -----
  getStats(): Observable<AdminKnowledgeStats> {
    return this.http.get<AdminKnowledgeStats>(`${this.base}/stats`, { withCredentials: true });
  }

  // ----- List / Get -----
  list(params: {
    sourceType?: 'all' | KnowledgeSourceType;
    search?: string;
    page?: number;
    size?: number;
  } = {}): Observable<AdminKnowledgeListPage> {
    let p = new HttpParams();
    if (params.sourceType && params.sourceType !== 'all') p = p.set('sourceType', params.sourceType);
    if (params.search?.trim()) p = p.set('search', params.search.trim());
    p = p.set('page', String(params.page ?? 0));
    p = p.set('size', String(params.size ?? 20));

    return this.http
      .get<SpringPage<AdminKnowledgeDocumentRow>>(`${this.base}/documents`, {
        params: p,
        withCredentials: true,
      })
      .pipe(
        map((r) => ({
          items: r.content ?? [],
          totalItems: r.totalElements ?? 0,
          totalPages: r.totalPages ?? 0,
          page: r.number ?? 0,
          pageSize: r.size ?? 20,
        })),
      );
  }

  get(id: string): Observable<AdminKnowledgeDocumentRow> {
    return this.http.get<AdminKnowledgeDocumentRow>(`${this.base}/documents/${id}`, {
      withCredentials: true,
    });
  }

  // ----- Upload -----
  uploadText(payload: DocumentUploadRequestPayload): Observable<DocumentUploadResponse> {
    return this.http.post<DocumentUploadResponse>(`${this.base}/documents/text`, payload, {
      withCredentials: true,
    });
  }

  uploadFile(args: {
    file: File;
    title: string;
    sourceType: KnowledgeSourceType;
    sourceId: string;
    category?: string;
    language?: string;
  }): Observable<DocumentUploadResponse> {
    const fd = new FormData();
    fd.append('file', args.file);
    fd.append('title', args.title);
    fd.append('sourceType', args.sourceType);
    fd.append('sourceId', args.sourceId);
    if (args.category) fd.append('category', args.category);
    if (args.language) fd.append('language', args.language);
    return this.http.post<DocumentUploadResponse>(`${this.base}/documents/file`, fd, {
      withCredentials: true,
    });
  }

  // ----- Delete -----
  remove(id: string): Observable<DocumentUploadResponse> {
    return this.http.delete<DocumentUploadResponse>(`${this.base}/documents/${id}`, {
      withCredentials: true,
    });
  }

  removeBySource(sourceType: KnowledgeSourceType, sourceId: string): Observable<DocumentUploadResponse> {
    return this.http.delete<DocumentUploadResponse>(
      `${this.base}/source/${sourceType}/${encodeURIComponent(sourceId)}`,
      { withCredentials: true },
    );
  }

  // ----- Sync -----
  syncProducts(): Observable<DocumentUploadResponse> {
    return this.http.post<DocumentUploadResponse>(`${this.base}/sync/products`, {}, {
      withCredentials: true,
    });
  }

  syncShops(): Observable<DocumentUploadResponse> {
    return this.http.post<DocumentUploadResponse>(`${this.base}/sync/shops`, {}, {
      withCredentials: true,
    });
  }

  syncAll(): Observable<DocumentUploadResponse> {
    return this.http.post<DocumentUploadResponse>(`${this.base}/sync/all`, {}, {
      withCredentials: true,
    });
  }

  // ----- Search -----
  search(payload: RagSearchPayload): Observable<RagSearchResponse> {
    return this.http.post<RagSearchResponse>(`${this.base}/search`, payload, {
      withCredentials: true,
    });
  }
}

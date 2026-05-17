import { Injectable, inject } from '@angular/core';
import { HotToastService, ToastOptions } from '@ngxpert/hot-toast';

type ToastKind = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface NotifyOptions extends ToastOptions<unknown> {
  /**
   * Window in ms during which an identical (kind + message) toast is suppressed.
   * Prevents stuck error loops from spamming a stack of duplicates. Default 3000.
   * Set to 0 to disable dedupe for a specific call.
   */
  dedupeMs?: number;
}

const DEFAULT_DEDUPE_MS = 3000;

/**
 * Thin wrapper around {@link HotToastService} that adds duplicate suppression
 * and a single, consistent API for the rest of the app to call.
 *
 * **Why not just use HotToastService directly?**
 * - Components that loop on a failing call (e.g. a retry button stuck in an
 *   error state) would otherwise stack the same toast over and over again,
 *   covering the page. Dedupe collapses repeats by `kind|message` for a short
 *   window so the user sees one notification per real event.
 * - Callsites stay simple: `notify.error('...')` instead of remembering the
 *   exact `HotToastService` method names.
 *
 * Existing callers that still use `HotToastService` directly keep working —
 * this service is additive.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private toast = inject(HotToastService);

  /** key = `${kind}|${message}` → timestamp of last shown */
  private readonly recent = new Map<string, number>();

  success(message: string, options: NotifyOptions = {}) {
    return this.show('success', message, options);
  }

  error(message: string, options: NotifyOptions = {}) {
    return this.show('error', message, options);
  }

  warning(message: string, options: NotifyOptions = {}) {
    return this.show('warning', message, options);
  }

  info(message: string, options: NotifyOptions = {}) {
    return this.show('info', message, options);
  }

  /**
   * Shows a loading toast. Returns the underlying ref so the caller can update
   * its message or close it when the async op finishes.
   */
  loading(message: string, options: ToastOptions<unknown> = {}) {
    return this.toast.loading(message, options);
  }

  /** Force-clears the dedupe cache (e.g. on user logout / route change). */
  reset(): void {
    this.recent.clear();
  }

  private show(kind: ToastKind, message: string, options: NotifyOptions) {
    const { dedupeMs = DEFAULT_DEDUPE_MS, ...toastOptions } = options;

    if (dedupeMs > 0 && this.isDuplicate(kind, message, dedupeMs)) {
      return null;
    }

    this.markShown(kind, message);
    switch (kind) {
      case 'success':
        return this.toast.success(message, toastOptions);
      case 'error':
        return this.toast.error(message, toastOptions);
      case 'warning':
        return this.toast.warning(message, toastOptions);
      case 'info':
        return this.toast.info(message, toastOptions);
      case 'loading':
        return this.toast.loading(message, toastOptions);
    }
  }

  private isDuplicate(kind: ToastKind, message: string, windowMs: number): boolean {
    const key = `${kind}|${message}`;
    const last = this.recent.get(key);
    if (!last) return false;
    return Date.now() - last < windowMs;
  }

  private markShown(kind: ToastKind, message: string): void {
    const key = `${kind}|${message}`;
    const now = Date.now();
    this.recent.set(key, now);
    // Best-effort cleanup so the map doesn't grow unbounded for long sessions.
    if (this.recent.size > 50) {
      const cutoff = now - 60_000;
      for (const [k, t] of this.recent) {
        if (t < cutoff) this.recent.delete(k);
      }
    }
  }
}

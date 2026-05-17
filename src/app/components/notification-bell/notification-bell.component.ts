import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  HostListener,
  inject,
  signal
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { HotToastService } from '@ngxpert/hot-toast';

import {
  RealtimeNotification,
  RealtimeNotificationService
} from '../../services/realtime-notification.service';

/**
 * NotificationBellComponent — biểu tượng chuông + badge số chưa đọc + dropdown
 * danh sách thông báo realtime (nhận từ chat-service WebSocket).
 *
 * Nhúng vào header. Tự subscribe service để hiển thị toast khi có notif mới.
 */
@Component({
  selector: 'app-notification-bell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="relative">
      <button
        type="button"
        class="relative p-2 rounded-full hover:bg-black/5 transition"
        [attr.aria-label]="'Thông báo'"
        (click)="toggle($event)"
      >
        <span class="material-symbols-outlined text-[22px] leading-none">
          notifications
        </span>
        @if (unreadCount() > 0) {
          <span
            class="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full
                   bg-red-600 text-white text-[10px] leading-4 font-bold text-center"
          >
            {{ unreadCount() > 99 ? '99+' : unreadCount() }}
          </span>
        }
      </button>

      @if (open()) {
        <div
          class="absolute right-0 mt-2 w-80 max-h-[480px] overflow-hidden
                 rounded-2xl bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]
                 border border-[#eef0f1] z-50 flex flex-col"
        >
          <header
            class="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f0]"
          >
            <h3 class="font-semibold text-[#181c1e]">Thông báo</h3>
            <div class="flex gap-2">
              @if (notifs().length > 0) {
                <button
                  type="button"
                  class="text-xs text-[#41493a] hover:text-primary"
                  (click)="markAllRead()"
                >
                  Đánh dấu đã đọc
                </button>
                <button
                  type="button"
                  class="text-xs text-red-600 hover:opacity-80"
                  (click)="clear()"
                >
                  Xoá
                </button>
              }
            </div>
          </header>

          <div class="overflow-y-auto flex-1">
            @if (notifs().length === 0) {
              <div class="py-10 text-center text-sm text-[#888]">
                Chưa có thông báo nào.
              </div>
            } @else {
              @for (n of notifs(); track n.id) {
                <button
                  type="button"
                  class="w-full text-left px-4 py-3 border-b border-[#f4f6f4]
                         hover:bg-[#f7fafc] transition"
                  [class.bg-yellow-50]="!n.read"
                  (click)="onClick(n)"
                >
                  <div class="flex items-start gap-3">
                    <span
                      class="material-symbols-outlined mt-0.5"
                      [ngClass]="iconClass(n)"
                    >
                      {{ iconName(n) }}
                    </span>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-[#181c1e]">
                        {{ title(n) }}
                      </p>
                      <p class="text-xs text-[#41493a] truncate">
                        {{ subtitle(n) }}
                      </p>
                      <p class="text-[10px] text-[#888] mt-1">
                        {{ n.timestamp | date:'short':'+0700' }}
                      </p>
                    </div>
                    @if (!n.read) {
                      <span
                        class="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0"
                      ></span>
                    }
                  </div>
                </button>
              }
            }
          </div>
        </div>
      }
    </div>
  `
})
export class NotificationBellComponent {
  private realtime = inject(RealtimeNotificationService);
  private router = inject(Router);
  private toast = inject(HotToastService);
  private host = inject(ElementRef<HTMLElement>);

  open = signal(false);

  notifs = this.realtime.items;
  unreadCount = this.realtime.unreadCount;

  /**
   * Lần đầu render: gọi connect() để mở STOMP channel.
   * Dùng effect+computed để chỉ hiện toast khi có notif mới (track theo id).
   */
  private lastShownToastId = '';

  constructor() {
    // Connect khi component mount (header thường mount toàn app)
    queueMicrotask(() => this.realtime.connect());

    effect(() => {
      const latest = this.realtime.latestEvent();
      if (!latest || latest.id === this.lastShownToastId) return;
      this.lastShownToastId = latest.id;
      this.showToast(latest);
    });
  }

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    this.open.update(v => !v);
  }

  markAllRead(): void {
    this.realtime.markAsRead();
  }

  clear(): void {
    this.realtime.clearAll();
  }

  onClick(n: RealtimeNotification): void {
    this.realtime.markAsRead(n.id);
    this.open.set(false);
    this.navigate(n);
  }

  /**
   * Toast message khi có notif mới — kèm action click → điều hướng.
   */
  private showToast(n: RealtimeNotification): void {
    const text = `${this.title(n)} — ${this.subtitle(n)}`;
    if (n.type === 'ORDER_CREATED') {
      this.toast.info(text, { duration: 6000, position: 'top-right' });
    } else if (n.type === 'ORDER_APPROVED') {
      this.toast.success(text, { duration: 6000, position: 'top-right' });
    } else {
      this.toast.show(text, { duration: 4000, position: 'top-right' });
    }
  }

  private navigate(n: RealtimeNotification): void {
    if (n.type === 'ORDER_CREATED' || n.type === 'ORDER_STATUS_CHANGED') {
      // Shop owner → trang quản lý đơn hàng dashboard
      const orderId = (n.payload?.['orderId'] as string) || '';
      this.router.navigate(['/my-store/orders'], {
        queryParams: orderId ? { highlight: orderId } : {}
      });
      return;
    }
    if (n.type === 'ORDER_APPROVED') {
      // User → trang lịch sử đơn của mình
      const orderId = (n.payload?.['orderId'] as string) || '';
      this.router.navigate(['/order-history'], {
        queryParams: orderId ? { orderId } : {}
      });
    }
  }

  // ============= UI helpers =============

  title(n: RealtimeNotification): string {
    switch (n.type) {
      case 'ORDER_CREATED':
        return 'Đơn hàng mới';
      case 'ORDER_APPROVED':
        return 'Đơn đã được duyệt';
      case 'ORDER_STATUS_CHANGED':
        return 'Trạng thái đơn thay đổi';
      default:
        return n.type;
    }
  }

  subtitle(n: RealtimeNotification): string {
    const p = n.payload ?? {};
    const orderId = (p['orderId'] as string) ?? '';
    const amount = p['amount'];
    const status = (p['status'] as string) ?? '';
    if (n.type === 'ORDER_CREATED') {
      return `Đơn #${this.shortId(orderId)} • ${this.formatAmount(amount)} • Cần duyệt`;
    }
    if (n.type === 'ORDER_APPROVED') {
      return `Đơn #${this.shortId(orderId)} đã được shop xác nhận`;
    }
    return `Đơn #${this.shortId(orderId)} → ${status}`;
  }

  iconName(n: RealtimeNotification): string {
    switch (n.type) {
      case 'ORDER_CREATED':
        return 'shopping_bag';
      case 'ORDER_APPROVED':
        return 'verified';
      case 'ORDER_STATUS_CHANGED':
        return 'autorenew';
      default:
        return 'notifications';
    }
  }

  iconClass(n: RealtimeNotification): string {
    switch (n.type) {
      case 'ORDER_CREATED':
        return 'text-orange-500';
      case 'ORDER_APPROVED':
        return 'text-green-600';
      default:
        return 'text-blue-600';
    }
  }

  private shortId(id: string): string {
    return id ? id.slice(0, 8) : '----';
  }

  private formatAmount(v: unknown): string {
    if (typeof v === 'number') return v.toLocaleString('vi-VN') + 'đ';
    if (typeof v === 'string' && !isNaN(Number(v))) {
      return Number(v).toLocaleString('vi-VN') + 'đ';
    }
    return '';
  }

  // Đóng dropdown khi click ngoài
  @HostListener('document:click', ['$event'])
  onDocClick(event: MouseEvent): void {
    if (!this.open()) return;
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }
}

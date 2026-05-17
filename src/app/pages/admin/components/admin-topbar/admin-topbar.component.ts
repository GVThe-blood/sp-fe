import { ChangeDetectionStrategy, Component, HostListener, Input, computed, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Topbar cho admin shell — chứa burger toggle (mobile), title, link "Xem site"
 * và avatar dropdown với nút logout.
 *
 * Dùng signal-based input cho menuOpen state. Tự đóng dropdown khi click ngoài
 * thông qua HostListener.
 */
@Component({
  selector: 'app-admin-topbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './admin-topbar.component.html',
  styleUrl: './admin-topbar.component.css',
})
export class AdminTopbarComponent {
  /** User signal từ AuthService — chỉ cần `username` để hiển thị. */
  @Input() user: { username?: string; userId?: string } | null = null;

  readonly toggleSidebar = output<void>();
  readonly logout = output<void>();
  readonly switchMode = output<void>();

  protected readonly menuOpen = signal(false);

  protected readonly initials = computed(() => {
    const name = this.user?.username ?? 'A';
    const trimmed = name.trim();
    if (!trimmed) return 'A';
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return trimmed.substring(0, 2).toUpperCase();
  });

  protected onLogout(): void {
    this.menuOpen.set(false);
    this.logout.emit();
  }

  protected onSwitchMode(): void {
    this.menuOpen.set(false);
    this.switchMode.emit();
  }

  /**
   * Đóng dropdown khi click bất cứ đâu ngoài trigger / dropdown. Thay vì xử
   * lý ở từng button bằng (click.stop), HostListener tổng hợp gọn hơn.
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.menuOpen()) return;
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu')) {
      this.menuOpen.set(false);
    }
  }
}

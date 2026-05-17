import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../../services/auth.service';
import { AdminSidebarComponent } from '../components/admin-sidebar/admin-sidebar.component';
import { AdminTopbarComponent } from '../components/admin-topbar/admin-topbar.component';

/**
 * Layout cho toàn bộ {@code /admin/**} — sidebar bên trái, topbar trên cùng,
 * router-outlet chính giữa. Không nhúng `app-header` / `app-footer` của site
 * customer để admin có "back-office" feel.
 *
 * Layout chia 2 cột (sidebar 260px + content) trên md+, collapse thành single
 * column với drawer trên mobile (toggle qua signal {@code sidebarOpen}).
 */
@Component({
  selector: 'app-admin-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, AdminSidebarComponent, AdminTopbarComponent],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css',
})
export class AdminLayoutComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  protected readonly sidebarOpen = signal(false);

  protected readonly currentUser = computed(() => this.auth.currentUser());

  protected toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  protected closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  protected logout(): void {
    this.auth.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }

  /** Quay lại màn role-select để chọn lại vai trò (vd: xem site như khách). */
  protected switchMode(): void {
    this.router.navigate(['/role-select']);
  }
}

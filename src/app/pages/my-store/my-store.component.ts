import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ProfileSidebarComponent } from '../../components/profile-sidebar/profile-sidebar.component';
import { ShopRegistrationWizardComponent } from '../../components/shop-registration-wizard/shop-registration-wizard.component';
import { StoreSidebarComponent } from '../../components/store-sidebar/store-sidebar.component';
import { ShopOwnerService } from '../../services/shop-owner.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-my-store',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ProfileSidebarComponent,
    StoreSidebarComponent,
    ShopRegistrationWizardComponent,
  ],
  templateUrl: './my-store.component.html',
  styleUrl: './my-store.component.css',
})
export class MyStoreComponent {
  private router = inject(Router);
  private shopOwnerService = inject(ShopOwnerService);
  protected userService = inject(UserService);

  protected user = this.userService.currentUser;
  protected shop = this.shopOwnerService.shop;
  protected hasShop = this.shopOwnerService.hasShop;
  protected loading = computed(() =>
    !this.shopOwnerService.loaded() && this.shopOwnerService.loading()
  );
  protected error = this.shopOwnerService.error;

  protected showWizard = signal(false);

  protected openWizard(): void {
    this.showWizard.set(true);
  }

  protected onWizardClosed(_evt: { completed: boolean }): void {
    this.showWizard.set(false);
  }

  protected goToDashboard(): void {
    this.router.navigate(['/my-store/analytics']);
  }

  protected refresh(): void {
    this.shopOwnerService.refresh().subscribe();
  }

  /** Pretty-print shop status (PENDING / APPROVED / SUSPENDED…). */
  protected statusLabel = computed<string>(() => {
    const status = this.shop()?.shopStatus;
    switch (status) {
      case 'APPROVED':
      case 'ACTIVE':
        return 'Đang hoạt động';
      case 'PENDING':
      case 'PENDING_REVIEW':
        return 'Đang chờ duyệt';
      case 'REJECTED':
        return 'Bị từ chối';
      case 'SUSPENDED':
        return 'Tạm khóa';
      default:
        return status ?? 'Không rõ';
    }
  });

  protected statusTone = computed<'ok' | 'warn' | 'error' | 'neutral'>(() => {
    const s = this.shop()?.shopStatus;
    if (!s) return 'neutral';
    if (s === 'APPROVED' || s === 'ACTIVE') return 'ok';
    if (s === 'REJECTED' || s === 'SUSPENDED') return 'error';
    if (s.startsWith('PENDING')) return 'warn';
    return 'neutral';
  });
}

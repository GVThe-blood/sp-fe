import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

/**
 * Stub page tạm cho các route admin chưa implement chi tiết. Đọc title/icon
 * từ {@code route.data} để mỗi placeholder hiển thị label phù hợp với menu
 * mà user vừa click — tránh phải tạo 10 component giống nhau chỉ khác text.
 */
@Component({
  selector: 'app-admin-placeholder',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-placeholder.component.html',
  styleUrl: './admin-placeholder.component.css',
})
export class AdminPlaceholderComponent {
  private route = inject(ActivatedRoute);

  // route.data là Observable<Data> — convert sang signal để dùng trực tiếp trong template.
  private readonly data = toSignal(this.route.data, { initialValue: {} as { title?: string; icon?: string } });

  protected readonly title = computed(() => this.data().title ?? 'Trang đang phát triển');
  protected readonly icon = computed(() => this.data().icon ?? 'construction');
}

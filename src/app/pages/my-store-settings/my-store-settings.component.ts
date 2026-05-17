import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HotToastService } from '@ngxpert/hot-toast';
import { firstValueFrom } from 'rxjs';

import { StoreSidebarComponent } from '../../components/store-sidebar/store-sidebar.component';
import {
  ShopOwnerService,
  ShopUpdatePayload,
} from '../../services/shop-owner.service';

/**
 * MyStoreSettingsComponent — màn cài đặt thông tin cửa hàng cho shop owner.
 *
 * <p>Lý do tồn tại: trước đây sau khi đăng ký xong, BE lẫn FE đều không có
 * cách nào để owner sửa lại tên / logo / địa chỉ / giờ mở / liên hệ. BE đã
 * thêm {@code PUT /shop/me} (xem {@code ShopController#updateMyShop}); page
 * này là FE counterpart, prefill từ {@code shopOwnerService.shop()} signal
 * và gửi payload thưa (chỉ field user thực sự sửa).</p>
 *
 * <p>Lifecycle ngắn:</p>
 * <ol>
 *   <li>Khi shop signal đã loaded → reset form theo dữ liệu hiện tại.</li>
 *   <li>User chỉnh sửa → submit → service cập nhật rồi patch lại signal.</li>
 *   <li>Form được mark pristine sau khi save thành công.</li>
 * </ol>
 *
 * <p>UX: required-when-set fields (tên/email/phone/địa chỉ/city/province/
 * businessType) BE sẽ ignore khi submit empty string, FE thêm validator
 * {@code required} để báo lỗi ngay tại form thay vì im lặng bỏ qua.</p>
 */
@Component({
  selector: 'app-my-store-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, StoreSidebarComponent],
  templateUrl: './my-store-settings.component.html',
  styleUrl: './my-store-settings.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyStoreSettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private shopOwnerService = inject(ShopOwnerService);
  private toast = inject(HotToastService);

  protected shop = this.shopOwnerService.shop;
  protected loadingShop = computed(
    () => !this.shopOwnerService.loaded() && this.shopOwnerService.loading()
  );
  protected error = this.shopOwnerService.error;

  protected submitting = signal(false);

  /**
   * Reactive form mirrors {@link ShopUpdatePayload}. {@code required} validators
   * lock down các field BE coi là "không được wipe"; còn lại optional.
   */
  protected readonly form: FormGroup = this.fb.group({
    shopName: ['', [Validators.required, Validators.maxLength(255)]],
    logo: [''],
    introduction: ['', [Validators.maxLength(2000)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    phoneNumber: ['', [Validators.required, Validators.maxLength(50)]],
    shopAddress: ['', [Validators.required, Validators.maxLength(255)]],
    city: ['', [Validators.required, Validators.maxLength(50)]],
    province: ['', [Validators.required, Validators.maxLength(50)]],
    postalCode: ['', [Validators.maxLength(50)]],
    nationId: ['', [Validators.maxLength(50)]],
    activeHours: ['', [Validators.maxLength(1000)]],
    businessType: ['', [Validators.required, Validators.maxLength(50)]],
  });

  constructor() {
    // Khi shop signal thay đổi (load/refresh) thì repopulate form.
    // {@code allowSignalWrites} không cần vì chỉ writes form, không signals.
    effect(() => {
      const s = this.shop();
      if (!s) return;
      this.form.reset(
        {
          shopName: s.shopName ?? '',
          logo: s.logo ?? '',
          introduction: s.introduction ?? '',
          email: s.email ?? '',
          phoneNumber: s.phoneNumber ?? '',
          shopAddress: s.shopAddress ?? '',
          city: s.city ?? '',
          province: s.province ?? '',
          postalCode: '',
          nationId: '',
          activeHours: s.activeHours ?? '',
          businessType: s.businessType ?? '',
        },
        { emitEvent: false }
      );
    });
  }

  ngOnInit(): void {
    if (!this.shopOwnerService.loaded()) {
      // Page có thể được vào trực tiếp (deep link), refresh để lấy data.
      this.shopOwnerService.refresh().subscribe();
    }
  }

  protected refresh(): void {
    this.shopOwnerService.refresh().subscribe();
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warning('Vui lòng kiểm tra lại các trường bắt buộc.');
      return;
    }
    if (!this.form.dirty) {
      this.toast.info('Chưa có thay đổi nào để lưu.');
      return;
    }

    const raw = this.form.getRawValue();
    // Chỉ gửi những field user thực sự sửa (dirty) → BE giữ nguyên những
    // field khác. Đây là lý do dùng PATCH-style "leave alone when null".
    const payload: ShopUpdatePayload = {};
    for (const k of Object.keys(this.form.controls) as Array<
      keyof ShopUpdatePayload
    >) {
      const ctrl = this.form.get(k as string);
      if (ctrl && ctrl.dirty) {
        const v = (raw as Record<string, unknown>)[k as string];
        if (typeof v === 'string') {
          (payload as Record<string, unknown>)[k as string] = v.trim();
        }
      }
    }

    if (Object.keys(payload).length === 0) {
      this.toast.info('Chưa có thay đổi nào để lưu.');
      return;
    }

    this.submitting.set(true);
    try {
      await firstValueFrom(this.shopOwnerService.updateMyShop(payload));
      this.toast.success('Đã cập nhật thông tin cửa hàng.');
      this.form.markAsPristine();
    } catch (err: unknown) {
      const msg =
        (err as { error?: { message?: string } })?.error?.message ??
        'Không cập nhật được thông tin cửa hàng.';
      this.toast.error(msg);
    } finally {
      this.submitting.set(false);
    }
  }

  protected resetForm(): void {
    const s = this.shop();
    if (!s) return;
    this.form.reset({
      shopName: s.shopName ?? '',
      logo: s.logo ?? '',
      introduction: s.introduction ?? '',
      email: s.email ?? '',
      phoneNumber: s.phoneNumber ?? '',
      shopAddress: s.shopAddress ?? '',
      city: s.city ?? '',
      province: s.province ?? '',
      postalCode: '',
      nationId: '',
      activeHours: s.activeHours ?? '',
      businessType: s.businessType ?? '',
    });
    this.form.markAsPristine();
  }
}

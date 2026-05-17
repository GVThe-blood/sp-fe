import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HotToastService } from '@ngxpert/hot-toast';
import { firstValueFrom } from 'rxjs';
import {
  IndividualKyc,
  RegistrationStep1,
  RegistrationStep2,
  RegistrationStep3,
  RegistrationStep4,
  ShopOwnerService,
} from '../../services/shop-owner.service';

type ShopType = 'INDIVIDUAL' | 'HOUSEHOLD' | 'COMPANY';

interface ShopTypeOption {
  value: ShopType;
  label: string;
  description: string;
  icon: string;
}

interface BusinessCategoryOption {
  value: string;
  label: string;
  icon: string;
}

/**
 * Multi-step modal wizard guiding the user through shop registration.
 *
 * Steps mirror the BE contract under `/api/v1/shop-registration/step-{1..4}`:
 *   1. Basic info (name, type, category, intro, optional logo URL)
 *   2. KYC + optional business document (skippable for INDIVIDUAL flows
 *      pending media-upload integration)
 *   3. Contact + address
 *   4. Tax + bank account (optional, can finish without)
 *
 * Media fields accept URLs/IDs typed in by the user as a stop-gap until the
 * media-upload service is wired in. The wizard is non-blocking: each step is
 * persisted as a DRAFT on the BE so the user can resume later.
 */
@Component({
  selector: 'app-shop-registration-wizard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shop-registration-wizard.component.html',
  styleUrl: './shop-registration-wizard.component.css',
})
export class ShopRegistrationWizardComponent {
  private fb = inject(FormBuilder);
  private toast = inject(HotToastService);
  private shopOwnerService = inject(ShopOwnerService);

  /** Emitted when the modal is dismissed (cancel or success). */
  readonly closed = output<{ completed: boolean }>();

  // -------------------------------------------------------------------------
  // Wizard navigation
  // -------------------------------------------------------------------------
  protected step = signal<1 | 2 | 3 | 4>(1);
  protected requestId = signal<string | null>(null);
  protected submitting = signal(false);

  protected progress = computed(() => (this.step() - 1) * (100 / 3));
  protected stepLabel = computed(() => {
    return ({ 1: 'Thông tin cửa hàng', 2: 'Định danh chủ shop', 3: 'Liên hệ & Địa chỉ', 4: 'Thuế & Ngân hàng' } as const)[this.step()];
  });

  // -------------------------------------------------------------------------
  // Static option data
  // -------------------------------------------------------------------------
  protected readonly shopTypes: ReadonlyArray<ShopTypeOption> = [
    {
      value: 'INDIVIDUAL',
      label: 'Cá nhân',
      description: 'Bán hàng tự doanh, không cần giấy phép kinh doanh.',
      icon: 'person',
    },
    {
      value: 'HOUSEHOLD',
      label: 'Hộ kinh doanh',
      description: 'Đã có giấy phép hộ kinh doanh.',
      icon: 'house',
    },
    {
      value: 'COMPANY',
      label: 'Công ty',
      description: 'Doanh nghiệp tư nhân, TNHH hoặc cổ phần.',
      icon: 'business',
    },
  ];

  protected readonly businessCategories: ReadonlyArray<BusinessCategoryOption> = [
    { value: 'FRESH_PRODUCE', label: 'Rau củ quả tươi', icon: 'eco' },
    { value: 'MEAT_SEAFOOD', label: 'Thịt, hải sản', icon: 'set_meal' },
    { value: 'PANTRY', label: 'Thực phẩm khô / pantry', icon: 'kitchen' },
    { value: 'DAIRY_BAKERY', label: 'Sữa & bánh', icon: 'bakery_dining' },
    { value: 'BEVERAGE', label: 'Đồ uống', icon: 'local_cafe' },
    { value: 'OTHER', label: 'Khác', icon: 'more_horiz' },
  ];

  // -------------------------------------------------------------------------
  // Forms
  // -------------------------------------------------------------------------
  protected step1Form: FormGroup = this.fb.group({
    shopName: ['', [Validators.required, Validators.maxLength(255)]],
    shopType: ['INDIVIDUAL' as ShopType, Validators.required],
    businessType: ['', Validators.required],
    introduction: ['', Validators.maxLength(2000)],
    logoMediaId: [''],
  });

  protected step2Form: FormGroup = this.fb.group({
    idNumber: ['', [Validators.required, Validators.pattern(/^\d{12}$/)]],
    fullName: ['', [Validators.required, Validators.maxLength(100)]],
    dateOfBirth: ['', Validators.required],
    gender: ['MALE'],
    permanentAddress: [''],
    issuedDate: [''],
    issuedPlace: [''],
    frontImageMediaId: [''],
    backImageMediaId: [''],
    selfieMediaId: [''],
    // business doc
    companyName: [''],
    businessRegNumber: [''],
    licenseMediaId: [''],
    companyAddress: [''],
  });

  protected step3Form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s]{8,15}$/)]],
    shopAddress: ['', [Validators.required, Validators.maxLength(255)]],
    city: ['', [Validators.required, Validators.maxLength(50)]],
    province: ['', [Validators.required, Validators.maxLength(50)]],
    postalCode: [''],
    nationId: ['VN'],
    activeHours: [''],
  });

  protected step4Form: FormGroup = this.fb.group({
    taxId: [''],
    bankName: [''],
    accountNumber: [''],
    accountHolderName: [''],
  });

  // -------------------------------------------------------------------------
  // Convenience getters used by the template
  // -------------------------------------------------------------------------
  protected selectedShopType = computed<ShopType>(() => {
    return (this.step1Form.get('shopType')?.value as ShopType) ?? 'INDIVIDUAL';
  });

  /** Whether the business-document section in step 2 is mandatory. */
  protected requiresBusinessDoc(): boolean {
    return this.selectedShopType() !== 'INDIVIDUAL';
  }

  // -------------------------------------------------------------------------
  // Step handlers
  // -------------------------------------------------------------------------
  protected async submitStep1(): Promise<void> {
    if (this.step1Form.invalid) {
      this.step1Form.markAllAsTouched();
      return;
    }
    const v = this.step1Form.value;
    const payload: RegistrationStep1 = {
      shopName: v.shopName.trim(),
      shopType: v.shopType,
      businessType: v.businessType,
      introduction: v.introduction || undefined,
      logoMediaId: v.logoMediaId || undefined,
    };

    this.submitting.set(true);
    try {
      const res = await firstValueFrom(this.shopOwnerService.submitStep1(payload));
      this.requestId.set(res.requestId);
      this.toast.success('Đã lưu bước 1');
      this.step.set(2);
    } catch (err: any) {
      this.toast.error(err?.error?.message ?? 'Không lưu được bước 1');
    } finally {
      this.submitting.set(false);
    }
  }

  /**
   * Skip step 2 — KYC requires file upload that isn't wired yet, so we let
   * the user defer it. The BE keeps the registration in DRAFT regardless.
   */
  protected skipStep2(): void {
    this.toast.info('Bỏ qua xác minh danh tính, bạn có thể bổ sung sau.');
    this.step.set(3);
  }

  protected async submitStep2(): Promise<void> {
    if (this.step2Form.invalid) {
      this.step2Form.markAllAsTouched();
      return;
    }
    const id = this.requestId();
    if (!id) {
      this.toast.error('Thiếu requestId, vui lòng quay lại bước 1.');
      this.step.set(1);
      return;
    }

    const v = this.step2Form.value;
    const kyc: IndividualKyc = {
      idNumber: v.idNumber,
      fullName: v.fullName,
      dateOfBirth: v.dateOfBirth,
      gender: v.gender,
      permanentAddress: v.permanentAddress || undefined,
      issuedDate: v.issuedDate || undefined,
      issuedPlace: v.issuedPlace || undefined,
      // Pending media-upload integration: surface placeholder IDs so the BE
      // schema validator passes without breaking the UX.
      frontImageMediaId: v.frontImageMediaId || 'PENDING_UPLOAD',
      backImageMediaId: v.backImageMediaId || 'PENDING_UPLOAD',
      selfieMediaId: v.selfieMediaId || 'PENDING_UPLOAD',
    };

    const payload: RegistrationStep2 = {
      requestId: id,
      shopType: this.selectedShopType(),
      kyc,
      businessDoc: this.requiresBusinessDoc()
        ? {
            companyName: v.companyName,
            businessRegNumber: v.businessRegNumber,
            licenseMediaId: v.licenseMediaId || 'PENDING_UPLOAD',
            companyAddress: v.companyAddress || undefined,
          }
        : undefined,
    };

    this.submitting.set(true);
    try {
      await firstValueFrom(this.shopOwnerService.submitStep2(payload));
      this.toast.success('Đã lưu bước 2');
      this.step.set(3);
    } catch (err: any) {
      this.toast.error(err?.error?.message ?? 'Không lưu được bước 2');
    } finally {
      this.submitting.set(false);
    }
  }

  protected async submitStep3(): Promise<void> {
    if (this.step3Form.invalid) {
      this.step3Form.markAllAsTouched();
      return;
    }
    const id = this.requestId();
    if (!id) {
      this.toast.error('Thiếu requestId, vui lòng quay lại bước 1.');
      this.step.set(1);
      return;
    }

    const v = this.step3Form.value;
    const payload: RegistrationStep3 = {
      requestId: id,
      email: v.email,
      phoneNumber: v.phoneNumber,
      shopAddress: v.shopAddress,
      city: v.city,
      province: v.province,
      postalCode: v.postalCode || undefined,
      nationId: v.nationId || 'VN',
      activeHours: v.activeHours || undefined,
    };

    this.submitting.set(true);
    try {
      await firstValueFrom(this.shopOwnerService.submitStep3(payload));
      this.toast.success('Đã lưu bước 3');
      this.step.set(4);
    } catch (err: any) {
      this.toast.error(err?.error?.message ?? 'Không lưu được bước 3');
    } finally {
      this.submitting.set(false);
    }
  }

  protected skipStep4(): void {
    void this.submitStep4(true);
  }

  protected async submitStep4(skip = false): Promise<void> {
    const id = this.requestId();
    if (!id) {
      this.toast.error('Thiếu requestId, vui lòng quay lại bước 1.');
      this.step.set(1);
      return;
    }

    const v = this.step4Form.value;
    const hasBank = !!(v.bankName && v.accountNumber && v.accountHolderName);
    const payload: RegistrationStep4 = {
      requestId: id,
      taxId: skip ? undefined : v.taxId || undefined,
      bankAccount: skip || !hasBank
        ? undefined
        : {
            bankName: v.bankName,
            accountNumber: v.accountNumber,
            accountHolderName: v.accountHolderName,
          },
    };

    this.submitting.set(true);
    try {
      const res = await firstValueFrom(this.shopOwnerService.submitStep4(payload));
      this.toast.success(
        res.status === 'PENDING'
          ? 'Đã gửi yêu cầu mở cửa hàng. Đang chờ duyệt.'
          : 'Đã lưu thông tin.'
      );
      // Force a refresh so the parent `my-store` page flips to the dashboard
      // view if the BE auto-approved.
      this.shopOwnerService.refresh().subscribe();
      this.closed.emit({ completed: true });
    } catch (err: any) {
      this.toast.error(err?.error?.message ?? 'Không gửi được yêu cầu');
    } finally {
      this.submitting.set(false);
    }
  }

  protected close(): void {
    this.closed.emit({ completed: this.requestId() !== null });
  }

  protected goBack(): void {
    if (this.step() > 1) {
      this.step.update((s) => (s - 1) as 1 | 2 | 3 | 4);
    }
  }
}

# Toast Notification System - SpringFood

## Tổng quan

SpringFood sử dụng hệ thống toast notification hiện đại được xây dựng với **Angular 19 signals**, cung cấp:

- ✅ **5 loại toast**: success, error, warning, info, loading
- ✅ **6 vị trí**: top-right, top-left, top-center, bottom-right, bottom-left, bottom-center
- ✅ **Progress bar** tự động
- ✅ **Action buttons** trong toast
- ✅ **Promise toast** (loading → success/error)
- ✅ **Dismissible** hoặc persistent
- ✅ **i18n support**
- ✅ **Animations** mượt mà
- ✅ **Accessibility** (ARIA labels, keyboard support)
- ✅ **Responsive** (mobile-friendly)

## Cài đặt

Toast system đã được tích hợp sẵn, không cần cài đặt thêm!

## Sử dụng cơ bản

### 1. Inject ToastService

```typescript
import { Component, inject } from '@angular/core';
import { ToastService } from './services/toast.service';

@Component({
  selector: 'app-my-component',
  standalone: true,
  template: `<button (click)="showToast()">Show Toast</button>`
})
export class MyComponent {
  private toastService = inject(ToastService);

  showToast() {
    this.toastService.success('Operation completed!');
  }
}
```

### 2. Toast Types

```typescript
// Success toast (green, 3s)
this.toastService.success('Product added to cart!');

// Error toast (red, 5s)
this.toastService.error('Failed to load data');

// Warning toast (orange, 4s)
this.toastService.warning('Your session will expire soon');

// Info toast (blue, 3s)
this.toastService.info('New features available');

// Loading toast (purple, persistent)
const loadingId = this.toastService.loading('Processing...');
```

### 3. Custom Options

```typescript
this.toastService.success('Saved!', {
  duration: 5000,              // 5 seconds
  position: 'bottom-right',    // Position
  dismissible: true,           // Show close button
  action: {                    // Action button
    label: 'Undo',
    onClick: () => this.undo()
  }
});
```

## Tính năng nâng cao

### 1. Promise Toast

Tự động chuyển từ loading → success/error:

```typescript
async saveProduct() {
  await this.toastService.promise(
    this.productService.save(product),
    {
      loading: 'Saving product...',
      success: 'Product saved successfully!',
      error: 'Failed to save product'
    }
  );
}

// Với dynamic messages
await this.toastService.promise(
  this.api.uploadFile(file),
  {
    loading: 'Uploading...',
    success: (data) => `Uploaded ${data.filename}`,
    error: (err) => `Upload failed: ${err.message}`
  }
);
```

### 2. Update Toast

```typescript
const toastId = this.toastService.loading('Processing...');

// Update message
this.toastService.update(toastId, {
  message: 'Almost done...'
});

// Update to success
this.toastService.update(toastId, {
  type: 'success',
  message: 'Completed!',
  duration: 3000
});
```

### 3. Action Buttons

```typescript
this.toastService.success('Item deleted', {
  action: {
    label: 'Undo',
    onClick: () => {
      this.restoreItem();
      this.toastService.info('Item restored');
    }
  }
});
```

### 4. Positions

```typescript
// Top positions
this.toastService.success('Top Right', { position: 'top-right' });
this.toastService.info('Top Left', { position: 'top-left' });
this.toastService.warning('Top Center', { position: 'top-center' });

// Bottom positions
this.toastService.success('Bottom Right', { position: 'bottom-right' });
this.toastService.info('Bottom Left', { position: 'bottom-left' });
this.toastService.warning('Bottom Center', { position: 'bottom-center' });
```

### 5. Persistent Toast

```typescript
// Won't auto-dismiss
const id = this.toastService.show('Important message', {
  duration: 0,
  dismissible: true
});

// Manually dismiss later
setTimeout(() => {
  this.toastService.dismiss(id);
}, 10000);
```

### 6. Clear All Toasts

```typescript
this.toastService.clearAll();
```

## API Reference

### ToastService Methods

```typescript
class ToastService {
  // Show toast with options
  show(message: string, options?: ToastOptions): string
  
  // Convenience methods
  success(message: string, options?: Omit<ToastOptions, 'type'>): string
  error(message: string, options?: Omit<ToastOptions, 'type'>): string
  warning(message: string, options?: Omit<ToastOptions, 'type'>): string
  info(message: string, options?: Omit<ToastOptions, 'type'>): string
  loading(message: string, options?: Omit<ToastOptions, 'type' | 'duration'>): string
  
  // Promise toast
  promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    },
    options?: Omit<ToastOptions, 'type'>
  ): Promise<T>
  
  // Update existing toast
  update(id: string, updates: Partial<Toast>): void
  
  // Dismiss toast
  dismiss(id: string): void
  
  // Clear all toasts
  clearAll(): void
  
  // Signals for different positions
  toasts: Signal<Toast[]>
  topRightToasts: Signal<Toast[]>
  topLeftToasts: Signal<Toast[]>
  topCenterToasts: Signal<Toast[]>
  bottomRightToasts: Signal<Toast[]>
  bottomLeftToasts: Signal<Toast[]>
  bottomCenterToasts: Signal<Toast[]>
}
```

### ToastOptions Interface

```typescript
interface ToastOptions {
  type?: 'success' | 'error' | 'warning' | 'info' | 'loading';
  duration?: number;           // Milliseconds (0 = persistent)
  position?: ToastPosition;    // Default: 'top-right'
  dismissible?: boolean;       // Default: true
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

### Toast Interface

```typescript
interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  position: ToastPosition;
  dismissible: boolean;
  action?: ToastAction;
  progress?: number;
  createdAt: number;
}
```

## Use Cases

### 1. Form Submission

```typescript
async onSubmit() {
  try {
    await this.toastService.promise(
      this.api.submitForm(this.form.value),
      {
        loading: 'Submitting form...',
        success: 'Form submitted successfully!',
        error: 'Failed to submit form'
      }
    );
    this.router.navigate(['/success']);
  } catch (error) {
    // Error toast already shown
  }
}
```

### 2. Delete with Undo

```typescript
deleteItem(item: Item) {
  const backup = { ...item };
  this.items = this.items.filter(i => i.id !== item.id);
  
  this.toastService.success('Item deleted', {
    duration: 5000,
    action: {
      label: 'Undo',
      onClick: () => {
        this.items.push(backup);
        this.toastService.info('Item restored');
      }
    }
  });
}
```

### 3. File Upload Progress

```typescript
async uploadFile(file: File) {
  const toastId = this.toastService.loading('Uploading file...');
  
  try {
    const result = await this.api.upload(file);
    
    this.toastService.update(toastId, {
      type: 'success',
      message: `Uploaded ${result.filename}`,
      duration: 3000
    });
  } catch (error) {
    this.toastService.update(toastId, {
      type: 'error',
      message: 'Upload failed',
      duration: 5000
    });
  }
}
```

### 4. Network Status

```typescript
constructor() {
  window.addEventListener('online', () => {
    this.toastService.success('Back online!', {
      position: 'bottom-center'
    });
  });
  
  window.addEventListener('offline', () => {
    this.toastService.error('No internet connection', {
      position: 'bottom-center',
      duration: 0
    });
  });
}
```

### 5. Session Expiry Warning

```typescript
checkSession() {
  const timeLeft = this.getSessionTimeLeft();
  
  if (timeLeft < 5 * 60 * 1000) { // 5 minutes
    this.toastService.warning('Your session will expire soon', {
      duration: 10000,
      action: {
        label: 'Extend',
        onClick: () => this.extendSession()
      }
    });
  }
}
```

## Styling

### Custom Colors

Thêm vào CSS của bạn:

```css
.toast-success {
  border-left-color: #your-color !important;
}

.toast-success .toast-icon {
  color: #your-color !important;
}
```

### Custom Animations

```css
@keyframes myCustomAnimation {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.toast {
  animation: myCustomAnimation 0.3s ease-out !important;
}
```

## Best Practices

### ✅ DO:
- Sử dụng toast cho feedback ngắn gọn
- Sử dụng appropriate toast type (success, error, warning, info)
- Giữ messages ngắn gọn và rõ ràng
- Sử dụng action buttons cho undo operations
- Sử dụng promise toast cho async operations
- Test trên mobile devices

### ❌ DON'T:
- Hiển thị quá nhiều toasts cùng lúc
- Sử dụng toast cho critical errors (dùng modal)
- Đặt duration quá ngắn (< 2s)
- Đặt messages quá dài
- Quên dismiss loading toasts
- Sử dụng toast cho form validation errors

## Accessibility

- ✅ ARIA `role="alert"` và `aria-live="polite"`
- ✅ Keyboard navigation support
- ✅ Screen reader friendly
- ✅ Focus management
- ✅ Reduced motion support
- ✅ High contrast mode support

## Performance

- ✅ Sử dụng Angular 19 signals (fine-grained reactivity)
- ✅ OnPush change detection
- ✅ Computed signals cho filtering
- ✅ No unnecessary re-renders
- ✅ Efficient animations với CSS transforms
- ✅ Auto cleanup khi dismiss

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers

## Troubleshooting

### Toast không hiển thị
1. Kiểm tra `<app-toast-container>` đã được thêm vào `app.component.html`
2. Kiểm tra z-index conflicts
3. Kiểm tra console có errors không

### Toast bị overlap
1. Sử dụng different positions
2. Giảm số lượng toasts hiển thị cùng lúc
3. Tăng gap trong CSS

### Animation không mượt
1. Kiểm tra browser performance
2. Disable animations trong reduced motion mode
3. Giảm số lượng toasts

## Examples

Xem file `toast-demo.component.ts` để có ví dụ đầy đủ về tất cả tính năng.

## Migration từ old toast system

```typescript
// Old (RxJS)
this.toastService.show('Message', 'success', 3000);

// New (Signals)
this.toastService.success('Message');
```

## Roadmap

- [ ] Sound effects (optional)
- [ ] Custom icons
- [ ] Rich content (HTML)
- [ ] Stacking animations
- [ ] Swipe to dismiss (mobile)
- [ ] Toast queue management
- [ ] Persistent toasts across page reloads

---

**Built with ❤️ using Angular 19 Signals**

# Hot Toast Notification System

## Overview

SpringFood sử dụng **@ngxpert/hot-toast** - một thư viện toast notification hiện đại, nhẹ và được thiết kế riêng cho Angular với TypeScript support đầy đủ.

## Why Hot Toast?

- ✅ **Angular-native**: Built specifically for Angular 19
- ✅ **Tiny bundle size**: Tree-shakeable và optimized (~32KB added)
- ✅ **Modern API**: Standalone components, signals-ready
- ✅ **Observable integration**: Perfect cho async operations
- ✅ **Rich customization**: Icons, duration, position, styling
- ✅ **Production-ready**: Used by teams worldwide

## Installation

```bash
npm install @ngxpert/hot-toast @ngneat/overview --legacy-peer-deps
```

## Configuration

### app.config.ts

```typescript
import { provideHotToastConfig } from '@ngxpert/hot-toast';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... other providers
    provideHotToastConfig({
      position: 'top-right',
      duration: 3000,
      dismissible: true,
      autoClose: true,
      reverseOrder: false,
      style: {
        border: '1px solid var(--color-border)',
        padding: '16px',
        color: 'var(--color-text)',
        background: 'var(--color-surface)',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
      }
    })
  ]
};
```

## Usage

### Basic Toast Types

```typescript
import { Component, inject } from '@angular/core';
import { HotToastService } from '@ngxpert/hot-toast';

@Component({
  selector: 'app-example',
  standalone: true,
  template: `
    <button (click)="showSuccess()">Success</button>
    <button (click)="showError()">Error</button>
    <button (click)="showWarning()">Warning</button>
    <button (click)="showInfo()">Info</button>
    <button (click)="showLoading()">Loading</button>
  `
})
export class ExampleComponent {
  private toast = inject(HotToastService);
  
  showSuccess(): void {
    this.toast.success('Operation completed successfully!', {
      duration: 3000,
      icon: '✅'
    });
  }
  
  showError(): void {
    this.toast.error('Something went wrong!', {
      duration: 4000,
      icon: '❌'
    });
  }
  
  showWarning(): void {
    this.toast.warning('Please be careful!', {
      duration: 3000,
      icon: '⚠️'
    });
  }
  
  showInfo(): void {
    this.toast.info('Here is some information', {
      duration: 3000,
      icon: 'ℹ️'
    });
  }
  
  showLoading(): void {
    const loadingToast = this.toast.loading('Processing...', {
      duration: 0 // Don't auto-dismiss
    });
    
    // Close manually after operation
    setTimeout(() => {
      loadingToast.close();
      this.toast.success('Done!');
    }, 2000);
  }
}
```

### Custom Options

```typescript
// Custom duration
this.toast.success('Quick message', { duration: 1000 });

// Custom icon
this.toast.success('Saved!', { icon: '💾' });

// Custom position
this.toast.success('Top left', { position: 'top-left' });

// Not dismissible
this.toast.info('Important!', { dismissible: false });

// Custom styling
this.toast.success('Styled toast', {
  style: {
    background: '#10b981',
    color: 'white',
    borderRadius: '12px'
  }
});
```

### Observable Integration

```typescript
import { Component, inject } from '@angular/core';
import { HotToastService } from '@ngxpert/hot-toast';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-data-loader',
  standalone: true,
  template: `<button (click)="loadData()">Load Data</button>`
})
export class DataLoaderComponent {
  private toast = inject(HotToastService);
  private http = inject(HttpClient);
  
  loadData(): void {
    this.http.get('/api/data').pipe(
      this.toast.observe({
        loading: 'Loading data...',
        success: 'Data loaded successfully!',
        error: 'Failed to load data'
      })
    ).subscribe();
  }
}
```

### Promise Integration

```typescript
async saveData(): Promise<void> {
  await this.toast.promise(
    this.userService.updateProfile(data),
    {
      loading: 'Saving...',
      success: 'Profile updated!',
      error: 'Failed to save'
    }
  );
}
```

### Manual Control

```typescript
// Create toast and control manually
const toastRef = this.toast.loading('Processing...', {
  duration: 0 // Don't auto-dismiss
});

// Update toast
toastRef.updateMessage('Still processing...');

// Close toast
toastRef.close();

// Update to success
toastRef.updateToast({
  type: 'success',
  message: 'Done!',
  duration: 2000
});
```

## Position Options

```typescript
type Position = 
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';
```

## Toast Types

```typescript
// Success (green)
this.toast.success('Success message');

// Error (red)
this.toast.error('Error message');

// Warning (yellow)
this.toast.warning('Warning message');

// Info (blue)
this.toast.info('Info message');

// Loading (animated spinner)
this.toast.loading('Loading message');

// Custom
this.toast.show('Custom message', {
  icon: '🎉',
  style: { /* custom styles */ }
});
```

## Real-World Examples

### Profile Component (Current Implementation)

```typescript
import { Component, inject } from '@angular/core';
import { HotToastService } from '@ngxpert/hot-toast';

@Component({
  selector: 'app-profile',
  standalone: true,
  template: `...`
})
export class ProfileComponent {
  private toast = inject(HotToastService);
  
  // Success with custom icon
  onSaveAddress(address: Address): void {
    this.userService.addAddress(address);
    this.toast.success('Thêm địa chỉ mới thành công', {
      duration: 3000,
      icon: '✅'
    });
  }
  
  // Error handling
  onDeleteAddress(address: Address): void {
    try {
      this.userService.deleteAddress(address.id);
      this.toast.success('Xóa địa chỉ thành công', {
        duration: 2000,
        icon: '🗑️'
      });
    } catch (error) {
      this.toast.error('Không thể xóa địa chỉ. Vui lòng thử lại.');
    }
  }
  
  // Loading state
  onAvatarUpload(file: File): void {
    const uploadToast = this.toast.loading('Đang tải lên avatar...', {
      duration: 0
    });
    
    // Simulate upload
    setTimeout(() => {
      uploadToast.close();
      this.toast.success('Tải lên avatar thành công', {
        duration: 2000,
        icon: '✅'
      });
    }, 2000);
  }
}
```

### Form Submission

```typescript
async onSubmit(): Promise<void> {
  if (this.form.invalid) {
    this.toast.error('Please fill all required fields', {
      icon: '⚠️'
    });
    return;
  }
  
  await this.toast.promise(
    this.api.submitForm(this.form.value),
    {
      loading: 'Submitting form...',
      success: 'Form submitted successfully!',
      error: (err) => `Error: ${err.message}`
    }
  );
}
```

### API Call with Retry

```typescript
loadUsers(): void {
  this.http.get<User[]>('/api/users').pipe(
    this.toast.observe({
      loading: 'Loading users...',
      success: (users) => `Loaded ${users.length} users`,
      error: 'Failed to load users. Click to retry'
    })
  ).subscribe({
    error: () => {
      // Show retry button
      this.toast.error('Failed to load users', {
        duration: 5000,
        dismissible: true
      });
    }
  });
}
```

## Styling with CSS Variables

Hot Toast respects your theme's CSS variables:

```css
/* In your global styles or theme */
:root {
  --color-surface: #ffffff;
  --color-text: #1f2937;
  --color-border: #e5e7eb;
}

[data-theme="dark"] {
  --color-surface: #1f2937;
  --color-text: #f9fafb;
  --color-border: #374151;
}
```

## Best Practices

### ✅ DO

- Use appropriate toast types (success, error, warning, info)
- Add custom icons for better UX
- Set reasonable durations (2-4 seconds)
- Use loading toasts for async operations
- Close loading toasts manually when done
- Use `toast.observe()` for Observable streams
- Use `toast.promise()` for Promises

### ❌ DON'T

- Don't show too many toasts at once
- Don't use very long messages (keep it concise)
- Don't forget to close loading toasts
- Don't use toasts for critical errors (use modals instead)
- Don't set duration too short (< 1000ms)
- Don't use toasts for form validation (use inline errors)

## Migration from Old Toast System

### Before (Custom Toast Service)

```typescript
import { ToastService } from './services/toast.service';

this.toastService.show('Message', 'success');
this.toastService.success('Success message');
this.toastService.error('Error message');
```

### After (Hot Toast)

```typescript
import { HotToastService } from '@ngxpert/hot-toast';

this.toast.success('Success message');
this.toast.error('Error message');
this.toast.info('Info message');
```

## Troubleshooting

### Toast not showing

1. Check if `provideHotToastConfig()` is in app.config.ts
2. Verify `@ngxpert/hot-toast` and `@ngneat/overview` are installed
3. Check browser console for errors

### Styling issues

1. Ensure CSS variables are defined in your theme
2. Check z-index conflicts with other components
3. Verify global styles are loaded

### TypeScript errors

1. Update to latest Angular version (19+)
2. Ensure `@ngxpert/hot-toast` version is compatible
3. Check peer dependencies

## Resources

- [Hot Toast GitHub](https://github.com/ngxpert/hot-toast)
- [Hot Toast Documentation](https://ngxpert-hot-toast.mintlify.app)
- [Angular 19 Guide](https://angular.dev)

## Summary

Hot Toast provides a modern, lightweight, and powerful toast notification system for Angular 19. It integrates seamlessly with Angular's reactive patterns, supports Observable/Promise workflows, and offers extensive customization options while maintaining a tiny bundle size.

**Key Features:**
- 🎯 Simple API: `toast.success()`, `toast.error()`, etc.
- 🔄 Observable integration: `toast.observe()`
- ⚡ Promise support: `toast.promise()`
- 🎨 Fully customizable: icons, duration, position, styling
- 📦 Tiny bundle: ~32KB added to your app
- 🌙 Theme-aware: Respects CSS variables
- ✅ Production-ready: Used by teams worldwide

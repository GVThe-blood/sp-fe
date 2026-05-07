# Hướng dẫn sử dụng i18n (Internationalization) trong SpringFood

## Tổng quan

SpringFood đã được tích hợp hệ thống đa ngôn ngữ sử dụng **@ngx-translate/core** và **@ngx-translate/http-loader**. Hiện tại hỗ trợ:
- 🇬🇧 English (en)
- 🇻🇳 Tiếng Việt (vi)
- 🇫🇷 Français (fr)
- 🇩🇪 Deutsch (de)

## Cấu trúc file translation

Translation files được lưu tại: `src/assets/i18n/`

```
src/assets/i18n/
├── en.json  (English)
├── vi.json  (Tiếng Việt)
├── fr.json  (Français - chưa hoàn thiện)
└── de.json  (Deutsch - chưa hoàn thiện)
```

## Cách sử dụng trong Component

### 1. Import TranslateModule

```typescript
import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [TranslateModule],
  template: `
    <h1>{{ 'header.nav.store' | translate }}</h1>
    <p>{{ 'common.loading' | translate }}</p>
  `
})
export class MyComponent {}
```

### 2. Sử dụng translate pipe trong template

```html
<!-- Simple translation -->
<button>{{ 'common.save' | translate }}</button>

<!-- Translation với placeholder -->
<input [placeholder]="'header.search.placeholder' | translate" />

<!-- Translation trong attribute binding -->
<button [title]="'common.edit' | translate">Edit</button>
```

### 3. Sử dụng TranslationService trong TypeScript

```typescript
import { Component, inject } from '@angular/core';
import { TranslationService } from './services/translation.service';

@Component({
  selector: 'app-my-component',
  standalone: true,
  template: `<p>{{ message }}</p>`
})
export class MyComponent {
  private translationService = inject(TranslationService);
  
  message = this.translationService.getTranslation('common.success');
  
  changeLanguage(langCode: string) {
    this.translationService.setLanguage(langCode);
  }
}
```

### 4. Reactive translations với computed signals

```typescript
import { Component, inject, computed } from '@angular/core';
import { TranslationService } from './services/translation.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  template: `
    @for (item of menuItems(); track item.id) {
      <li>{{ item.label }}</li>
    }
  `
})
export class MenuComponent {
  private translationService = inject(TranslationService);
  
  // Menu items tự động update khi đổi ngôn ngữ
  menuItems = computed(() => [
    { 
      id: 'home', 
      label: this.translationService.getTranslation('header.nav.store') 
    },
    { 
      id: 'categories', 
      label: this.translationService.getTranslation('header.nav.categories') 
    }
  ]);
}
```

## Cấu trúc Translation Keys

### Header translations
```json
{
  "header": {
    "nav": {
      "store": "Store",
      "categories": "Categories",
      "recipes": "Recipes"
    },
    "user": {
      "signIn": "Sign in",
      "profile": "Profile",
      "signOut": "Sign out"
    },
    "search": {
      "placeholder": "Search for products..."
    }
  }
}
```

### Common translations
```json
{
  "common": {
    "loading": "Loading...",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit"
  }
}
```

## Thêm translation mới

### Bước 1: Thêm key vào file JSON

**en.json:**
```json
{
  "product": {
    "addToCart": "Add to Cart",
    "price": "Price",
    "inStock": "In Stock"
  }
}
```

**vi.json:**
```json
{
  "product": {
    "addToCart": "Thêm vào giỏ",
    "price": "Giá",
    "inStock": "Còn hàng"
  }
}
```

### Bước 2: Sử dụng trong component

```html
<button>{{ 'product.addToCart' | translate }}</button>
<span>{{ 'product.price' | translate }}: $99</span>
<span>{{ 'product.inStock' | translate }}</span>
```

## Đổi ngôn ngữ

Người dùng có thể đổi ngôn ngữ bằng cách:
1. Click vào language selector ở header (icon 🌐)
2. Chọn ngôn ngữ mong muốn
3. Ngôn ngữ được lưu vào localStorage và tự động load lại khi refresh

## TranslationService API

```typescript
class TranslationService {
  // Get available languages
  languages: Signal<Language[]>
  
  // Get current language
  currentLanguage: Signal<Language>
  
  // Set language
  setLanguage(langCode: string): void
  
  // Get translation by key
  getTranslation(key: string): string
  
  // Get current language code
  getCurrentLanguageCode(): string
}
```

## Best Practices

### ✅ DO:
- Sử dụng `computed()` signals cho reactive translations
- Đặt translation keys theo cấu trúc module/feature
- Sử dụng translate pipe trong template
- Test translations cho tất cả ngôn ngữ được hỗ trợ

### ❌ DON'T:
- Hard-code text trong template
- Sử dụng translation keys quá dài hoặc phức tạp
- Quên thêm translation cho tất cả ngôn ngữ
- Lưu HTML trong translation values (security risk)

## Ví dụ hoàn chỉnh

```typescript
import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TranslationService } from './services/translation.service';

interface Product {
  id: string;
  name: string;
  price: number;
  inStock: boolean;
}

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="product-card">
      <h3>{{ product.name }}</h3>
      <p>{{ 'product.price' | translate }}: ${{ product.price }}</p>
      
      @if (product.inStock) {
        <span class="badge">{{ 'product.inStock' | translate }}</span>
      } @else {
        <span class="badge">{{ 'product.outOfStock' | translate }}</span>
      }
      
      <button (click)="addToCart()">
        {{ 'product.addToCart' | translate }}
      </button>
    </article>
  `
})
export class ProductCardComponent {
  private translationService = inject(TranslationService);
  
  product: Product = {
    id: '1',
    name: 'Fresh Tomatoes',
    price: 2.99,
    inStock: true
  };
  
  addToCart() {
    const message = this.translationService.getTranslation('product.addedToCart');
    console.log(message);
  }
}
```

## Troubleshooting

### Translation không hiển thị
1. Kiểm tra file JSON có đúng format không
2. Kiểm tra translation key có đúng không (case-sensitive)
3. Kiểm tra TranslateModule đã được import vào component chưa
4. Kiểm tra console có lỗi HTTP 404 khi load translation files không

### Ngôn ngữ không đổi
1. Kiểm tra TranslationService đã được inject vào AppComponent chưa
2. Kiểm tra localStorage có lưu language code không
3. Clear browser cache và thử lại

### Build error
1. Chạy `npm run build` để kiểm tra lỗi TypeScript
2. Kiểm tra tất cả imports đã đúng chưa
3. Kiểm tra translation files có valid JSON không

## Roadmap

- [ ] Thêm translation cho tất cả components
- [ ] Hoàn thiện French và German translations
- [ ] Thêm RTL support cho Arabic
- [ ] Thêm date/number formatting theo locale
- [ ] Thêm pluralization support
- [ ] Thêm lazy loading cho translation files

## Resources

- [ngx-translate Documentation](https://github.com/ngx-translate/core)
- [Angular i18n Guide](https://angular.dev/guide/i18n)
- [Translation Best Practices](https://phrase.com/blog/posts/angular-localization-i18n/)

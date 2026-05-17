import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { provideHotToastConfig } from '@ngxpert/hot-toast';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { deviceIdInterceptor } from './interceptors/device-id.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    // withComponentInputBinding cho phép route param :orderId tự bind vào input() của component
    provideRouter(routes, withComponentInputBinding()),
    // NOTE: provideClientHydration(withEventReplay()) đã được REMOVE.
    // Lý do: app này hiện chạy CSR-only (xem angular.json — không có "server"
    // builder, không có "ssr", không có outputMode). withEventReplay() capture
    // events lúc đầu rồi replay sau khi hydrate xong, nhưng vì không có
    // server-rendered HTML để hydrate, replay này có thể gây ghost-click /
    // double-trigger trên router links và làm cảm giác như "tự reload".
    // Khi nào bật SSR (ng add @angular/ssr), thêm lại provider này.
    //
    // withFetch() khuyến nghị từ Angular 18+:
    //   - cancellation gọn qua AbortController
    //   - hỗ trợ TransferState khi chuyển sang SSR sau này
    //   - aligned giữa dev proxy và prod
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, deviceIdInterceptor])),
    provideAnimationsAsync(),
    provideHotToastConfig({
      // Compact, non-intrusive notification — top-right is the de-facto standard
      // (Gmail, Slack, GitHub, Linear, ...). Bottom-center / full-width banners
      // belong to inline alerts, not toasts.
      position: 'top-right',
      reverseOrder: false,
      // Stack vertically and cap how many toasts are on screen at once. Anything
      // beyond the limit replaces the oldest, so a stuck error loop can never
      // pile up four full-width banners over the page anymore.
      stacking: 'vertical',
      visibleToasts: 3,
      // Default 'toast' theme — small pill, rounded, color-coded by type.
      // Other themes ('snackbar', 'material', 'minimal', 'ios', 'glassmorphism')
      // need their own SCSS file imported via `@use '@ngxpert/hot-toast/themes/<name>'`.
      theme: 'toast',
      // 4s default; loading toasts stay until completed.
      duration: 4000,
      // Dismiss button + keep messages from collapsing into the page width.
      dismissible: true,
      autoClose: true,
      // Per-type tweaks: errors stay a touch longer so the user can read them,
      // success is short, loading lasts until resolved.
      success: { duration: 2500 },
      error: { duration: 5000 },
      loading: { duration: Infinity },
    }),
    provideTranslateService({
      defaultLanguage: 'en'
    }),
    provideTranslateHttpLoader({
      prefix: './assets/i18n/',
      suffix: '.json'
    })
  ]
};

import { Component, ChangeDetectionStrategy, signal, ElementRef, viewChild, inject, computed, effect, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, Subject, switchMap, catchError, of } from 'rxjs';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';
import { AuthService } from '../../services/auth.service';
import { TranslationService, Language } from '../../services/translation.service';
import { ProductService, Product } from '../../services/product.service';
import { CartApiService } from '../../services/cart-api.service';
import { ProfileApiService } from '../../services/profile-api.service';
import { HotToastService } from '@ngxpert/hot-toast';

interface MenuColumn {
  title: string;
  links: string[];
}

interface NavItem {
  name:string;
  menu?: MenuColumn[];
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, ThemeToggleComponent, NotificationBellComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'onEscapeKey()',
  }
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private translationService = inject(TranslationService);
  private translate = inject(TranslateService);
  private productService = inject(ProductService);
  private cartApi = inject(CartApiService);
  private profileApi = inject(ProfileApiService);
  private toast = inject(HotToastService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  
  user = this.authService.currentUser;
  /** Hiển thị shortcut "Trang quản trị" trong dropdown khi user có role ADMIN. */
  isAdmin = this.authService.isAdmin;
  cartItemCount = this.cartApi.itemCount;

  // Avatar realtime từ BE (fallback về user cũ nếu profile chưa load)
  headerAvatar = computed(() => {
    return this.profileApi.avatarUrl() ?? this.user()?.avatarUrl ?? null;
  });
  headerFullName = computed(() => {
    const fromBe = this.profileApi.fullName();
    if (fromBe) return fromBe;
    const u = this.user();
    return u ? `${u.lastName ?? ''} ${u.firstName ?? ''}`.trim() : '';
  });

  langDropdownContainer = viewChild<ElementRef>('langDropdownContainer');
  searchContainer = viewChild<ElementRef>('searchContainer');
  searchIcon = viewChild<ElementRef>('searchIcon');
  userDropdownContainer = viewChild<ElementRef>('userDropdownContainer');

  // Search state signals
  searchQuery = signal('');
  isSearching = signal(false);
  searchResults = signal<Product[]>([]);
  hasSearchError = signal(false);
  searchErrorMessage = signal('');

  // Computed signals
  hasSearchResults = computed(() => this.searchResults().length > 0);
  searchResultsCount = computed(() => this.searchResults().length);

  // Search subject for debouncing
  private searchSubject = new Subject<string>();

  navItems = signal<NavItem[]>([
    {
      name: 'Store',
      menu: [
        { title: 'Shop', links: ['Shop the Latest', 'Fresh Produce', 'Meat & Seafood', 'Dairy & Eggs', 'Bakery'] },
        { title: 'Quick Links', links: ['Find a Store', 'Order Status', 'Delivery Options', 'Gift Cards'] },
        { title: 'Special Stores', links: ['Organic Selection', 'Local Farmers', 'Bulk Orders'] }
      ]
    },
    {
      name: 'Categories',
      menu: [
        { title: 'Fresh Food', links: ['Vegetables', 'Fruits', 'Meat', 'Seafood', 'Dairy'] },
        { title: 'Pantry', links: ['Grains & Rice', 'Canned Goods', 'Snacks', 'Beverages'] },
        { title: 'Frozen', links: ['Ice Cream', 'Frozen Meals', 'Frozen Vegetables'] }
      ]
    },
    { name: 'Recipes' },
    { name: 'Meal Plans' },
    {
      name: 'Support',
      menu: [
        { title: 'Get Help', links: ['Order Help', 'Delivery Info', 'Returns', 'Contact Us'] },
        { title: 'Account', links: ['My Orders', 'Saved Items', 'Payment Methods'] }
      ]
    }
  ]);

  languages = this.translationService.languages;
  selectedLanguage = this.translationService.currentLanguage;

  quickLinks = signal<string[]>(['Fresh Vegetables', 'Premium Meat', 'Organic Products', 'Daily Deals']);
  
  isLangDropdownOpen = signal(false);
  isSearchOpen = signal(false);
  isUserDropdownOpen = signal(false);
  /**
   * Brand logo source — primary dùng asset trên MinIO của project (bucket
   * `categories`). Khi MinIO local không chạy hoặc Cloudflare tunnel chết,
   * `<img>` `onerror` fallback xuống `/springfood-logo.svg` static để header
   * không bao giờ blank. Có thể swap qua signal `.set()` khi backend cung
   * cấp asset registry động (vd theme/branding theo môi trường).
   */
  logoUrl = signal<string>(
    'http://localhost:9000/categories/image-removebg-preview_LE_upscale_balanced_x4_light_ai_30_tone_enhance_30_color_enhance_30_remove_background_general_clip_to_object_off.png',
  );
  
  // Notification state - will be updated via API later
  hasNewNotifications = signal(false);

  activeMenu = signal<NavItem | null>(null);
  private hideMenuTimeout: any;

  constructor() {
    console.log('HeaderComponent initialized');
    console.log('Current language:', this.translate.currentLang);
    console.log('Default language:', this.translate.defaultLang);
    
    // Initialize with English defaults first
    this.updateTranslations();
    
    // Update when language changes
    this.translate.onLangChange.pipe(takeUntilDestroyed()).subscribe((event) => {
      console.log('Language changed to:', event.lang);
      this.updateTranslations();
    });

    // Auto-load cart + profile khi user authenticates / reset khi logout.
    // Header avatar sẽ tự cập nhật qua signal `headerAvatar` khi profile load xong.
    //
    // CẢNH BÁO: dùng flag `lastAuthState` để effect chỉ chạy ĐÚNG 1 LẦN khi
    // trạng thái auth chuyển true/false. Nếu không, các API fail (403/503)
    // sẽ giữ signal ở null/[] và effect re-run vô hạn mỗi khi bất kỳ signal
    // phụ thuộc nào (cartApi.cart, profileApi.profile, ...) thay đổi.
    let lastAuthState: boolean | null = null;
    effect(() => {
      const isAuth = this.authService.isAuthenticated();
      if (isAuth === lastAuthState) return;
      lastAuthState = isAuth;

      if (isAuth) {
        this.cartApi.loadCart().subscribe({ error: () => {} });
        this.profileApi.loadProfile().subscribe({ error: () => {} });
        this.profileApi.loadAddresses().subscribe({ error: () => {} });
      } else {
        this.cartApi.resetCache();
        this.profileApi.resetCache();
      }
    });

    // Setup debounced search
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query || query.trim().length < 2) {
          this.isSearching.set(false);
          this.searchResults.set([]);
          return of(null);
        }

        this.isSearching.set(true);
        this.hasSearchError.set(false);

        // Backend exposes a single keyword search at GET /products/search?keyword=
        // (case-insensitive contains over name + description). The legacy
        // {@code searchByName} method posted a `name=:foo` query that the
        // current BE controller doesn't read at all, so the search bar
        // never produced results.
        return this.productService.searchByKeyword(query.trim(), 0, 10).pipe(
          catchError(error => {
            console.error('[Header] Search error', error);
            this.hasSearchError.set(true);
            this.searchErrorMessage.set('Không thể tìm kiếm sản phẩm. Vui lòng thử lại.');
            return of(null);
          })
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(response => {
      this.isSearching.set(false);

      if (!response) {
        // either query too short OR error/null branch — clear list when the
        // user actually typed something
        if (this.searchQuery().trim().length >= 2) {
          this.searchResults.set([]);
        }
        return;
      }

      // BE wraps every payload in ResponseData so both `appStatus` and the
      // backward-compat `code` alias are present. We accept either, fall back
      // to `data.content` regardless of how the status is named.
      const status = response.appStatus ?? response.code ?? 0;
      const items = response.data?.content ?? [];
      if (status === 200) {
        this.searchResults.set(items);
      } else {
        console.warn('[Header] unexpected search response shape', response);
        this.searchResults.set([]);
      }
    });
  }

  private updateTranslations(): void {
    this.navItems.set([
      {
        name: this.translate.instant('header.nav.store'),
        menu: [
          { 
            title: this.translate.instant('header.menu.shop.title'),
            links: [
              this.translate.instant('header.menu.shop.shopLatest'),
              this.translate.instant('header.menu.shop.freshProduce'),
              this.translate.instant('header.menu.shop.meatSeafood'),
              this.translate.instant('header.menu.shop.dairyEggs'),
              this.translate.instant('header.menu.shop.bakery')
            ]
          },
          { 
            title: this.translate.instant('header.menu.quickLinks.title'),
            links: [
              this.translate.instant('header.menu.quickLinks.findStore'),
              this.translate.instant('header.menu.quickLinks.orderStatus'),
              this.translate.instant('header.menu.quickLinks.deliveryOptions'),
              this.translate.instant('header.menu.quickLinks.giftCards')
            ]
          },
          { 
            title: this.translate.instant('header.menu.specialStores.title'),
            links: [
              this.translate.instant('header.menu.specialStores.organic'),
              this.translate.instant('header.menu.specialStores.localFarmers'),
              this.translate.instant('header.menu.specialStores.bulkOrders')
            ]
          }
        ]
      },
      {
        name: this.translate.instant('header.nav.categories'),
        menu: [
          { 
            title: this.translate.instant('header.menu.freshFood.title'),
            links: [
              this.translate.instant('header.menu.freshFood.vegetables'),
              this.translate.instant('header.menu.freshFood.fruits'),
              this.translate.instant('header.menu.freshFood.meat'),
              this.translate.instant('header.menu.freshFood.seafood'),
              this.translate.instant('header.menu.freshFood.dairy')
            ]
          },
          { 
            title: this.translate.instant('header.menu.pantry.title'),
            links: [
              this.translate.instant('header.menu.pantry.grains'),
              this.translate.instant('header.menu.pantry.canned'),
              this.translate.instant('header.menu.pantry.snacks'),
              this.translate.instant('header.menu.pantry.beverages')
            ]
          },
          { 
            title: this.translate.instant('header.menu.frozen.title'),
            links: [
              this.translate.instant('header.menu.frozen.iceCream'),
              this.translate.instant('header.menu.frozen.frozenMeals'),
              this.translate.instant('header.menu.frozen.frozenVegetables')
            ]
          }
        ]
      },
      { name: this.translate.instant('header.nav.recipes') },
      { name: this.translate.instant('header.nav.mealPlans') },
      {
        name: this.translate.instant('header.nav.support'),
        menu: [
          { 
            title: this.translate.instant('header.menu.getHelp.title'),
            links: [
              this.translate.instant('header.menu.getHelp.orderHelp'),
              this.translate.instant('header.menu.getHelp.deliveryInfo'),
              this.translate.instant('header.menu.getHelp.returns'),
              this.translate.instant('header.menu.getHelp.contactUs')
            ]
          },
          { 
            title: this.translate.instant('header.menu.account.title'),
            links: [
              this.translate.instant('header.menu.account.myOrders'),
              this.translate.instant('header.menu.account.savedItems'),
              this.translate.instant('header.menu.account.paymentMethods')
            ]
          }
        ]
      }
    ]);

    this.quickLinks.set([
      this.translate.instant('header.search.freshVegetables'),
      this.translate.instant('header.search.premiumMeat'),
      this.translate.instant('header.search.organicProducts'),
      this.translate.instant('header.search.dailyDeals')
    ]);
  }

  onDocumentClick(event: MouseEvent): void {
    const langContainer = this.langDropdownContainer();
    if (langContainer && !langContainer.nativeElement.contains(event.target)) {
      this.isLangDropdownOpen.set(false);
    }

    const userContainer = this.userDropdownContainer();
    if (userContainer && !userContainer.nativeElement.contains(event.target)) {
      this.isUserDropdownOpen.set(false);
    }

    const searchContainerEl = this.searchContainer();
    const searchIconEl = this.searchIcon();
    if (
      searchContainerEl &&
      searchIconEl &&
      !searchContainerEl.nativeElement.contains(event.target) &&
      !searchIconEl.nativeElement.contains(event.target)
    ) {
      this.isSearchOpen.set(false);
    }
  }

  onEscapeKey(): void {
    this.activeMenu.set(null);
    this.isSearchOpen.set(false);
    this.isLangDropdownOpen.set(false);
    this.isUserDropdownOpen.set(false);
  }

  toggleLangDropdown(): void {
    this.isLangDropdownOpen.update(open => !open);
    if (this.isLangDropdownOpen()) {
      this.activeMenu.set(null);
      this.isSearchOpen.set(false);
      this.isUserDropdownOpen.set(false);
    }
  }

  toggleUserDropdown(): void {
    this.isUserDropdownOpen.update(open => !open);
    if (this.isUserDropdownOpen()) {
      this.activeMenu.set(null);
      this.isSearchOpen.set(false);
      this.isLangDropdownOpen.set(false);
    }
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.isUserDropdownOpen.set(false);
        this.toast.success('Đã đăng xuất');
      },
      error: (error) => {
        console.error('Logout failed:', error);
        // AuthService đã clear local state dù API fail
        this.isUserDropdownOpen.set(false);
        this.toast.warning('Đăng xuất offline (server không phản hồi)');
      }
    });
  }

  toggleSearch(): void {
    this.isSearchOpen.update(open => !open);
    if (this.isSearchOpen()) {
      this.activeMenu.set(null);
      this.isUserDropdownOpen.set(false);
    }
  }

  selectLanguage(language: Language): void {
    console.log('Switching language to:', language.code);
    this.translationService.setLanguage(language.code);
    this.isLangDropdownOpen.set(false);
    console.log('Language switched, current lang:', this.translate.currentLang);
  }

  showMenu(item: NavItem): void {
    clearTimeout(this.hideMenuTimeout);
    if (item.menu) {
      this.isSearchOpen.set(false);
      this.activeMenu.set(item);
    } else {
      this.hideMenu();
    }
  }

  hideMenu(): void {
    this.hideMenuTimeout = setTimeout(() => {
      this.activeMenu.set(null);
    }, 150);
  }

  onMenuEnter(): void {
    clearTimeout(this.hideMenuTimeout);
  }

  closeAll(): void {
    this.activeMenu.set(null);
    this.isSearchOpen.set(false);
    this.isLangDropdownOpen.set(false);
    this.isUserDropdownOpen.set(false);
  }

  // Method to simulate new notification (for testing - will be replaced with API call)
  simulateNewNotification(): void {
    this.hasNewNotifications.set(true);
  }

  // Method to clear notifications (will be called when user opens notification panel)
  clearNotifications(): void {
    this.hasNewNotifications.set(false);
  }

  // Search input handler
  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const query = input.value;
    this.searchQuery.set(query);
    this.searchSubject.next(query);
  }

  /**
   * Submit the keyword as a full search via Enter / explicit submit. Sends
   * the user to the dedicated results page so they can browse paginated
   * matches instead of skimming the small dropdown preview.
   */
  submitSearch(): void {
    const term = this.searchQuery().trim();
    if (!term) return;
    this.router.navigate(['/search'], { queryParams: { keyword: term, page: 0 } });
    this.clearSearch();
  }

  // Select product from search results
  selectProduct(product: Product): void {
    // The app currently doesn't have a standalone product page — product
    // detail is rendered as a modal on the homepage. Navigate to "/" with
    // a `productId` query param; HomeComponent picks it up and opens the
    // detail modal automatically. Using the Angular router (instead of
    // window.location.href) preserves SPA state — auth signals, cart cache,
    // chat connection, etc.
    this.router.navigate(['/'], { queryParams: { productId: product.id } });
    this.clearSearch();
  }

  // Clear search
  clearSearch(): void {
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.hasSearchError.set(false);
    this.isSearchOpen.set(false);
  }

  // Get first image from product
  getFirstImage(product: Product): string {
    return this.productService.getFirstImage(product);
  }

  // Format price
  formatPrice(price: string): string {
    return this.productService.formatPrice(price);
  }

  // Get stock status
  getStockStatus(product: Product): string {
    return this.productService.getStockStatus(product);
  }

  // Check if in stock
  isInStock(product: Product): boolean {
    return this.productService.isInStock(product);
  }
}

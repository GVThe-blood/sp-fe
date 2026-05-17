import { Routes } from '@angular/router';
import { RegisterComponent } from './pages/register/register.component';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { StoreDetailComponent } from './pages/store-detail/store-detail.component';
import { OrderComponent } from './pages/order/order.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { MyStoreComponent } from './pages/my-store/my-store.component';
import { StoreAnalyticsComponent } from './pages/store-analytics/store-analytics.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { shopOwnerGuard } from './guards/shop-owner.guard';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    {
        path: 'role-select',
        loadComponent: () =>
            import('./pages/role-select/role-select.component').then(m => m.RoleSelectComponent),
    },
    { path: 'store/:id', component: StoreDetailComponent },
    {
        // Public landing page cho mục Sale ở profile sidebar.
        // Không gắn authGuard vì sale là content marketing — guest cũng nên xem.
        path: 'sale',
        loadComponent: () =>
            import('./pages/sale/sale.component').then(m => m.SaleComponent),
    },
    {
        path: 'cart',
        loadComponent: () =>
            import('./pages/cart/cart.component').then(m => m.CartComponent),
        canActivate: [authGuard]
    },
    {
        path: 'favorites',
        loadComponent: () =>
            import('./pages/favorites/favorites.component').then(m => m.FavoritesComponent),
        canActivate: [authGuard]
    },
    {
        path: 'orders',
        loadComponent: () =>
            import('./pages/orders/orders.component').then(m => m.OrdersComponent),
        canActivate: [authGuard]
    },
    {
        path: 'orders/:orderId',
        loadComponent: () =>
            import('./pages/order-detail/order-detail.component').then(m => m.OrderDetailComponent),
        canActivate: [authGuard]
    },
    { path: 'order', component: OrderComponent },
    { path: 'profile', component: ProfileComponent },
    {
        // Public results page — used both for header keyword search and for
        // homepage category chip clicks. Driven by query params so the URL
        // is shareable / refresh-friendly.
        //   /search?keyword=foo
        //   /search?category=mon-chinh&name=Món+Chính
        path: 'search',
        loadComponent: () =>
            import('./pages/search-result/search-result.component').then(m => m.SearchResultComponent),
    },
    // Shop-owner area — toàn bộ /my-store/** yêu cầu role SHOP_OWNER. Guard
    // tự động redirect /login (chưa auth) hoặc / (auth nhưng không phải owner).
    { path: 'my-store', component: MyStoreComponent, canActivate: [shopOwnerGuard] },
    { path: 'my-store/analytics', component: StoreAnalyticsComponent, canActivate: [shopOwnerGuard] },
    {
        path: 'my-store/categories',
        loadComponent: () =>
            import('./pages/my-store-categories/my-store-categories.component').then(
                m => m.MyStoreCategoriesComponent
            ),
        canActivate: [shopOwnerGuard]
    },
    {
        path: 'my-store/products',
        loadComponent: () =>
            import('./pages/my-store-products/my-store-products.component').then(
                m => m.MyStoreProductsComponent
            ),
        canActivate: [shopOwnerGuard]
    },
    {
        path: 'my-store/orders',
        loadComponent: () =>
            import('./pages/my-store-orders/my-store-orders.component').then(
                m => m.MyStoreOrdersComponent
            ),
        canActivate: [shopOwnerGuard]
    },
    {
        path: 'my-store/settings',
        loadComponent: () =>
            import('./pages/my-store-settings/my-store-settings.component').then(
                m => m.MyStoreSettingsComponent
            ),
        canActivate: [shopOwnerGuard]
    },

    // -----------------------------------------------------------------
    // Admin routes — sandboxed under AdminLayoutComponent. Tất cả lazy load
    // và bảo vệ bằng adminGuard. Khi user thường gõ /admin sẽ bị đẩy về home.
    // -----------------------------------------------------------------
    {
        path: 'admin',
        canActivate: [adminGuard],
        canActivateChild: [adminGuard],
        loadComponent: () =>
            import('./pages/admin/admin-layout/admin-layout.component').then(
                m => m.AdminLayoutComponent
            ),
        children: [
            {
                path: '',
                pathMatch: 'full',
                loadComponent: () =>
                    import('./pages/admin/admin-overview/admin-overview.component').then(
                        m => m.AdminOverviewComponent
                    ),
            },
            // Phase 1: stub pages cho các mục còn lại — sẽ implement dần.
            {
                path: 'shops',
                loadComponent: () =>
                    import('./pages/admin/admin-shops/admin-shops.component').then(
                        m => m.AdminShopsComponent
                    ),
            },
            {
                path: 'shop-registrations',
                loadComponent: () =>
                    import('./pages/admin/admin-shop-registrations/admin-shop-registrations.component').then(
                        m => m.AdminShopRegistrationsComponent
                    ),
            },
            {
                path: 'users',
                loadComponent: () =>
                    import('./pages/admin/admin-users/admin-users.component').then(
                        m => m.AdminUsersComponent
                    ),
            },
            {
                path: 'products',
                loadComponent: () =>
                    import('./pages/admin/admin-products/admin-products.component').then(
                        m => m.AdminProductsComponent
                    ),
            },
            {
                path: 'categories',
                loadComponent: () =>
                    import('./pages/admin/admin-categories/admin-categories.component').then(
                        m => m.AdminCategoriesComponent
                    ),
            },
            {
                path: 'orders',
                loadComponent: () =>
                    import('./pages/admin/admin-orders/admin-orders.component').then(
                        m => m.AdminOrdersComponent
                    ),
            },
            {
                path: 'shipping',
                loadComponent: () =>
                    import('./pages/admin/admin-placeholder/admin-placeholder.component').then(
                        m => m.AdminPlaceholderComponent
                    ),
                data: { title: 'Quản lý giao vận', icon: 'local_shipping' },
            },
            {
                path: 'revenue',
                loadComponent: () =>
                    import('./pages/admin/admin-revenue/admin-revenue.component').then(
                        m => m.AdminRevenueComponent
                    ),
            },
            {
                path: 'commission-config',
                loadComponent: () =>
                    import('./pages/admin/admin-commission/admin-commission.component').then(
                        m => m.AdminCommissionComponent
                    ),
            },
            {
                path: 'sales',
                loadComponent: () =>
                    import('./pages/admin/admin-sales/admin-sales.component').then(
                        m => m.AdminSalesComponent
                    ),
            },
            {
                path: 'ai-knowledge',
                loadComponent: () =>
                    import('./pages/admin/admin-ai-knowledge/admin-ai-knowledge.component').then(
                        m => m.AdminAiKnowledgeComponent
                    ),
            },
        ],
    }
];

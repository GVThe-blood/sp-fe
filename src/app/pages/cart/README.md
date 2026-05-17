# Cart Page (`/cart`)

Trang giỏ hàng cho user đã đăng nhập, đồng bộ với `cart-service` (Redis) qua REST API.

## Routing

- Path: `/cart`
- Lazy load qua `loadComponent` (xem `app.routes.ts`)
- Bảo vệ bằng `authGuard` — nếu chưa đăng nhập, redirect `/login?returnUrl=/cart`

## Component Tree

```
CartComponent (page container)
├── CartEmptyComponent              (state rỗng)
├── CartShopGroupComponent[]        (group items theo shop)
│   └── CartItemRowComponent[]      (1 item / row)
└── CartSummaryComponent            (sticky summary + CTA)
```

Tất cả components là `standalone: true`, dùng `ChangeDetectionStrategy.OnPush`, signal-based inputs/outputs theo Angular 19 patterns.

## API Endpoints sử dụng

Tất cả request đi qua API Gateway `${environment.apiUrl}/cart` (default `http://localhost:8080/api/v1/cart`):

| Method | Endpoint | Service method | Mô tả |
|--------|----------|----------------|-------|
| GET | `/cart` | `loadCart()` | Lấy cart hiện tại |
| POST | `/cart/items` | `addItem(req)` | Thêm item (gọi từ ProductDetailModal) |
| PUT | `/cart/items/{sku}/quantity?quantity=N` | `updateQuantity(sku, qty)` | Cập nhật số lượng. `qty=0` → BE auto remove |
| DELETE | `/cart/items/{sku}` | `removeItem(sku)` | Xoá 1 item |
| DELETE | `/cart` | `clearCart()` | Xoá toàn bộ |
| PATCH | `/cart/items/select` | `toggleSelection(req)` | Toggle select theo `items[]` / `shopId` / `selectAll` |

## State Management — `CartApiService`

`@Injectable({ providedIn: 'root' })`, signal-based.

**Signals public:**

| Signal | Type | Mô tả |
|--------|------|-------|
| `cart` | `Signal<CartResponse \| null>` | Cart hiện tại (read-only) |
| `loading` | `WritableSignal<boolean>` | Đang gọi API |
| `error` | `WritableSignal<string \| null>` | Message lỗi gần nhất |
| `itemCount` | `Signal<number>` | computed — tổng số sản phẩm |
| `selectedCount` | `Signal<number>` | computed — số items đã chọn |
| `selectedTotal` | `Signal<number>` | computed — tạm tính (chỉ items đã chọn) |
| `totalPrice` | `Signal<number>` | computed — tổng tất cả items |
| `isEmpty` | `Signal<boolean>` | computed — `totalItems === 0` |
| `canCheckout` | `Signal<boolean>` | computed — có thể checkout không |

Mọi method mutation đều `tap(res => this._cart.set(res))` để các signal computed tự cập nhật.

## Cách user vào trang `/cart`

Có 3 entry point:

1. **Header**: icon cart trên navbar (component `HeaderComponent`). Hiển thị badge số lượng (orange) khi user đã đăng nhập và cart có item. Badge auto cập nhật qua `CartApiService.itemCount` signal.
2. **Floating button**: nút tròn dưới góc phải (component `FloatingCartButtonComponent`) — hiển thị khi `cartCount() > 0`.
3. **Direct URL**: navigate `/cart` qua thanh địa chỉ.

## Auth flow khi chưa đăng nhập

`authGuard` chặn route `/cart` cho user chưa đăng nhập:
1. Hiển thị toast warning "Vui lòng đăng nhập để xem giỏ hàng"
2. Redirect `/login?returnUrl=/cart`
3. Sau khi `LoginComponent` đăng nhập thành công, đọc `returnUrl` từ query param và navigate lại `/cart`

## Phân biệt với các artifacts khác

| Artifact | Mục đích | Source of truth |
|----------|---------|-----------------|
| `services/cart-api.service.ts` | Server-side cart cho user logged-in | Redis (cart-service) |
| `services/cart.service.ts` (cũ) | Local preview cart cho ProductDetailModal, FloatingCartButton | localStorage |
| `pages/cart/cart.component.ts` | UI giỏ hàng (route `/cart`) | `cart-api.service.ts` |
| `pages/order/order.component.ts` | Trang **checkout** (chọn địa chỉ, payment, voucher → đặt hàng) | Hiện đang dùng mock data |

Hai cart service tồn tại song song theo design — không refactor `cart.service.ts` cũ để tránh regression cho ProductDetailModal.

## Flow tương tác

```
[Home/Store Detail] → ProductDetailModal → addItem (qua cart-api hoặc cart.service cũ)
                                                ↓
                              FloatingCartButton hiện count
                                                ↓
                                          Click → /cart
                                                ↓
                                       CartComponent loadCart()
                                                ↓
                  ┌─────────────────────────────┼─────────────────────────────┐
                  ↓                             ↓                             ↓
          Toggle item/shop          Update quantity                    Click "Thanh toán"
          → toggleSelection()       → updateQuantity()                       ↓
                                                                  Navigate /order (checkout)
```

## Decisions đã chốt (tham chiếu spec design.md)

1. Route mới `/cart`, giữ nguyên `/order` làm checkout
2. Pessimistic UI cho qty stepper (đợi response BE). Optimistic là phase 2.
3. `AddToCartRequest` BE đã extend với `variantName` + `attributes`
4. Persistence Redis-only TTL 72h, không backup PostgreSQL

## Giới hạn hiện tại / TODO tương lai

- Optimistic UI cho qty +/- (giảm latency UX)
- Endpoint `/cart/validate` chưa expose — sẽ check stock + price ở phase tích hợp checkout thực
- `OrderComponent` (`/order`) hiện dùng mock data, chưa nhận selected items từ `CartApiService` — refactor sau
- Sau `placeOrder()` thành công, cần gọi `cartApi.removeItem(sku)` cho các sku đã đặt

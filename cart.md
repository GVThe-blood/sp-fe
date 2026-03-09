Để triển khai tính năng **"Merge Cart"** (Hợp nhất giỏ hàng) trong kiến trúc Microservice, chúng ta cần phân chia trách nhiệm rõ ràng giữa Client (Frontend) và Service (Backend).

Dưới đây là bản thiết kế kỹ thuật chi tiết các bước cần thực hiện cho cả hai phía.

-----

### I. Frontend (Client-Side) Implementation

Frontend đóng vai trò điều phối (orchestrator). Nó chịu trách nhiệm định danh khách vãng lai và kích hoạt lệnh hợp nhất ngay sau khi đăng nhập thành công.

#### 1\. Quản lý "Device ID" (Định danh khách)

Frontend cần tự sinh ra một mã định danh duy nhất cho khách chưa đăng nhập.

  * **Logic:**
    1.  Khi App/Web khởi chạy, kiểm tra trong `LocalStorage` (hoặc Cookie) xem đã có key `x-device-id` chưa.
    2.  Nếu chưa có: Sử dụng thư viện (như `uuid`) để tạo một chuỗi UUID v4 ngẫu nhiên. Lưu nó vào `LocalStorage`.
    3.  Nếu đã có: Giữ nguyên để đảm bảo giỏ hàng được bảo lưu khi F5 hoặc tắt trình duyệt.

#### 2\. Cấu hình HTTP Interceptor

Bạn không nên sửa từng API call. Hãy cấu hình ở tầng mạng (Axios Interceptor hoặc Angular HttpInterceptor).

  * **Logic:** Với mọi request gửi đến **Cart Service**, luôn đính kèm Header:
      * Header Key: `X-Device-Id`
      * Value: Lấy từ LocalStorage.
      * *Lưu ý:* Header này gửi đi bất kể user đã login hay chưa (Backend sẽ quyết định dùng cái nào).

#### 3\. Quy trình Login và Merge (Quan trọng)

Đây là logic quan trọng nhất để trải nghiệm người dùng không bị gián đoạn.

  * **Bước 1:** User nhập username/password -\> Gọi API `Auth Service`.
  * **Bước 2:** Nhận về `Access Token` (JWT). Lưu Token.
  * **Bước 3 (Ngay lập tức):** Trước khi redirect user về trang chủ hoặc trang profile, Frontend phải gọi API **Merge Cart**.
      * **API:** `POST /api/v1/cart/merge`
      * **Header:** `Authorization: Bearer {token}`
      * **Body:** `{ "deviceId": "giá-trị-trong-local-storage" }`
  * **Bước 4:**
      * Nếu Merge thành công (200 OK): Xóa (hoặc reset) giỏ hàng local state hiện tại, gọi lại API `GET /api/v1/cart` để lấy giỏ hàng mới nhất (đã được backend gộp) về hiển thị.
      * Chuyển hướng User.

-----

### II. Backend (Cart Service) Implementation

Backend chịu trách nhiệm xử lý logic nghiệp vụ, đảm bảo tính toàn vẹn dữ liệu và đồng bộ giữa Redis và Database.

#### 1\. API Endpoint Design

Tạo một endpoint chuyên biệt cho việc merge.

```java
// CartController.java
@PostMapping("/merge")
@PreAuthorize("isAuthenticated()") // Bắt buộc phải có Token
public ResponseEntity<Void> mergeCart(
        @RequestBody MergeCartRequest request,
        @AuthenticationPrincipal Jwt principal // Lấy user từ Token
) {
    cartService.mergeGuestCartToUserCart(principal.getSubject(), request.getDeviceId());
    return ResponseEntity.ok().build();
}
```

#### 2\. Logic xử lý tại Service (`mergeGuestCartToUserCart`)

Đây là nơi xử lý thuật toán hợp nhất. Bạn cần tương tác với Redis.

**Các bước cụ thể trong code:**

1.  **Xác định Key:**

      * `guestKey` = `cart:guest:{deviceId}`
      * `userKey` = `cart:user:{userId}`

2.  **Kiểm tra điều kiện sớm (Guard Clauses):**

      * Kiểm tra `guestKey` có tồn tại trong Redis không? Nếu không -\> `return` (Không có gì để merge).

3.  **Lấy dữ liệu (Fetch Data):**

      * Lấy toàn bộ items của Guest (`Map<Sku, Quantity>`).
      * Lấy toàn bộ items của User (`Map<Sku, Quantity>`).

4.  **Hợp nhất trong bộ nhớ (In-Memory Merge):**

      * Duyệt qua từng item trong `guestItems`:
          * Nếu `userItems` đã chứa SKU đó: `newQuantity = userQuantity + guestQuantity`.
          * Nếu `userItems` chưa chứa: `newQuantity = guestQuantity`.
          * **Validate:** Kiểm tra `newQuantity` có vượt quá tồn kho (Inventory Service) hoặc giới hạn max per order không. Nếu vượt, set về max.

5.  **Cập nhật Redis (Atomic Operation):**

      * Sử dụng `redisTemplate.opsForHash().putAll(userKey, mergedMap)` để cập nhật giỏ hàng User.
      * Set lại TTL cho `userKey` (ví dụ: 30 ngày).

6.  **Xóa dữ liệu rác:**

      * `redisTemplate.delete(guestKey)`: Xóa giỏ hàng Guest để tránh merge lại lần nữa nếu người dùng spam nút login/merge.

7.  **Đồng bộ Persistence (Data Consistency):**

      * Vì Redis là bộ nhớ đệm, bạn cần lưu trạng thái mới xuống MongoDB.
      * Gửi một Message vào Kafka/RabbitMQ: `CartMergedEvent(userId, mergedItems)`.
      * Worker sẽ lắng nghe và `save()` vào MongoDB.

#### 3\. Xử lý ưu tiên trong `addToCart` và `getCart`

Logic xử lý khi User gọi API thêm/lấy giỏ hàng cần thay đổi để ưu tiên User đã đăng nhập.

```java
public void addToCart(String sku, int quantity, String deviceId) {
    String redisKey;
    
    // 1. Kiểm tra SecurityContext xem User có đang login không
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    
    if (auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser")) {
        // Ưu tiên 1: Nếu đã login -> Dùng User Key
        redisKey = "cart:user:" + auth.getName();
    } else {
        // Ưu tiên 2: Nếu chưa login -> Dùng Device ID
        if (deviceId == null) throw new InvalidDataException("Device ID is required for guest");
        redisKey = "cart:guest:" + deviceId;
    }

    // 2. Thực hiện lưu vào Redis với key đã chọn
    redisService.hIncrBy(redisKey, sku, quantity);
}
```

-----

### III. Sơ đồ trình tự (Sequence Diagram) - Luồng thực tế

Để bạn hình dung rõ hơn về cách các thành phần tương tác:

1.  **Guest:** Thêm "iPhone 15" vào giỏ (`cart:guest:DEVICE_123`).
2.  **Guest:** Bấm Login.
3.  **Auth Service:** Trả về Token cho User `U_999`.
4.  **Frontend:** Nhận Token -\> Gọi ngay `POST /cart/merge` (Body: `deviceId: DEVICE_123`, Header: `Bearer Token`).
5.  **Cart Service:**
      * Đọc `cart:guest:DEVICE_123` (Có iPhone 15).
      * Đọc `cart:user:U_999` (Giả sử đang có Ốp lưng).
      * Merge: iPhone 15 + Ốp lưng.
      * Lưu vào `cart:user:U_999`.
      * Xóa `cart:guest:DEVICE_123`.
6.  **Cart Service:** Trả về 200 OK.
7.  **Frontend:** Gọi `GET /cart`.
8.  **Cart Service:** Trả về `cart:user:U_999` (Gồm iPhone 15 + Ốp lưng).

### IV. Các vấn đề thực tế cần lưu ý (Deep Dive)

1.  **Race Condition (Điều kiện đua):**

      * Nếu user mở 2 tab, 1 tab đang login (đang merge), tab kia vẫn đang add item với tư cách guest.
      * **Giải pháp:** Khi thực hiện merge, backend nên dùng `WATCH` command của Redis (Optimistic Locking) hoặc đơn giản là chấp nhận **Eventual Consistency** (những item add vào guest *sau* khi lệnh merge bắt đầu có thể bị sót lại ở guest cart mới, user phải login lại hoặc refresh để kích hoạt merge lần nữa).

2.  **Inventory Check (Kiểm tra kho):**

      * Khi merge, tổng số lượng có thể vượt quá kho.
      * **Giải pháp:** Trong hàm merge, *bắt buộc* phải gọi (Sync hoặc Async) sang Inventory Service để check. Nếu không đủ hàng, chỉ add số lượng tối đa cho phép và trả về một cảnh báo trong response để Frontend hiển thị: *"Một số sản phẩm đã được điều chỉnh số lượng do hết hàng"*.

3.  **Cross-Device Merge:**

      * User add hàng trên điện thoại (Guest A), add hàng trên Laptop (Guest B).
      * Khi login trên điện thoại: Giỏ User = Guest A.
      * Khi login trên Laptop: Giỏ User = (Guest A cũ) + Guest B.
      * Logic trên hoàn toàn hỗ trợ tốt trường hợp này vì chúng ta luôn merge vào `cart:user:{userId}` chứ không thay thế nó.
# Product Search Feature - User Guide

## Vị trí tìm kiếm / Search Location

Ô tìm kiếm nằm ở **HEADER** (thanh điều hướng trên cùng), không phải ở hero section.

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo]  Store  Categories  Recipes  [🔍]  [🌙]  [🌐]  [👤] │ ← HEADER
└─────────────────────────────────────────────────────────────┘
```

## Cách sử dụng / How to Use

### 1. Mở ô tìm kiếm / Open Search
Click vào icon 🔍 ở header

### 2. Nhập từ khóa / Enter Search Term
- Tối thiểu 2 ký tự / Minimum 2 characters
- Tự động tìm kiếm sau 300ms / Auto-search after 300ms debounce
- Ví dụ: "laptop", "điện thoại", "táo"

### 3. Xem kết quả / View Results

```
┌─────────────────────────────────────────────────────────────┐
│  [🔍 Tìm kiếm sản phẩm...]                                   │
├─────────────────────────────────────────────────────────────┤
│  Kết quả tìm kiếm (5)                                        │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ [IMG]  Laptop Dell XPS 13                            │  │
│  │        Laptop cao cấp, màn hình 13 inch...           │  │
│  │        25,000,000₫  ⭐ 4.5 (120)  [Còn hàng]        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ [IMG]  Laptop HP Pavilion                            │  │
│  │        Laptop văn phòng, hiệu năng tốt...            │  │
│  │        18,500,000₫  ⭐ 4.2 (85)   [Chỉ còn 3]       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ...                                                         │
└─────────────────────────────────────────────────────────────┘
```

### 4. Chọn sản phẩm / Select Product
Click vào sản phẩm → Chuyển đến trang chi tiết

## Các trạng thái / States

### Loading (Đang tải)
```
┌─────────────────────────────────────────────────────────────┐
│  [🔍 Tìm kiếm sản phẩm...]                                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                      [⏳ Loading...]                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### No Results (Không có kết quả)
```
┌─────────────────────────────────────────────────────────────┐
│  [🔍 Tìm kiếm sản phẩm...]                                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                      [😕]                                    │
│         Không tìm thấy sản phẩm. Thử từ khóa khác.          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Error (Lỗi)
```
┌─────────────────────────────────────────────────────────────┐
│  [🔍 Tìm kiếm sản phẩm...]                                   │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ⚠️ Không thể tìm kiếm sản phẩm. Vui lòng thử lại.     │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Popular Searches (< 2 ký tự)
```
┌─────────────────────────────────────────────────────────────┐
│  [🔍 Tìm kiếm sản phẩm...]                                   │
├─────────────────────────────────────────────────────────────┤
│  Tìm kiếm phổ biến                                           │
│                                                              │
│  🔍 Rau tươi              🔍 Thịt cao cấp                    │
│  🔍 Sản phẩm hữu cơ       🔍 Ưu đãi hàng ngày                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Thông tin hiển thị / Display Information

Mỗi sản phẩm trong kết quả tìm kiếm hiển thị:

1. **Hình ảnh** - Ảnh đầu tiên từ danh sách ảnh
2. **Tên sản phẩm** - Tên đầy đủ (truncated nếu quá dài)
3. **Mô tả** - Tối đa 2 dòng
4. **Giá** - Định dạng VND (25,000,000₫)
5. **Đánh giá** - Sao + số lượng đánh giá (chỉ hiện nếu > 0)
6. **Trạng thái kho**:
   - 🟢 "Còn hàng" (quantity > 10)
   - 🟡 "Chỉ còn X sản phẩm" (quantity 1-9)
   - 🔴 "Hết hàng" (quantity = 0)

## Tính năng kỹ thuật / Technical Features

### Debouncing
- Chờ 300ms sau khi người dùng ngừng gõ
- Giảm số lượng API calls
- Cải thiện hiệu suất

### Minimum Characters
- Yêu cầu tối thiểu 2 ký tự
- Tránh tìm kiếm quá rộng
- Hiển thị "Popular Searches" khi < 2 ký tự

### Error Handling
- Hiển thị thông báo lỗi khi API fail
- Không crash app
- Cho phép thử lại

### Keyboard Support
- **ESC** - Đóng search dropdown
- **Click outside** - Đóng search dropdown
- **Enter** trong input - Tìm kiếm (tự động)

## API Endpoint

```
GET /products/search?name=:laptop&page=0&size=10
```

### Parameters
- `name` - Tên sản phẩm (sử dụng `:` operator cho contains search)
- `page` - Số trang (default: 0)
- `size` - Số sản phẩm mỗi trang (default: 10)

### Response
```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "content": [
      {
        "id": "123",
        "name": "Laptop Dell XPS 13",
        "description": "Laptop cao cấp...",
        "price": "25000000",
        "images": "[\"url1\", \"url2\"]",
        "quantity": 15,
        "averageRating": 4.5,
        "totalFeedbacks": 120
      }
    ],
    "totalElements": 5,
    "totalPages": 1
  }
}
```

## Đa ngôn ngữ / Multi-language

Hỗ trợ 2 ngôn ngữ:
- 🇬🇧 English
- 🇻🇳 Tiếng Việt

Tự động chuyển đổi theo ngôn ngữ được chọn trong header.

## Responsive Design

- ✅ Desktop - Full width dropdown
- ✅ Tablet - Adjusted width
- ✅ Mobile - Full screen overlay (cần test)

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ⚠️ IE11 (not tested)

## Performance

- Debounced search: 300ms
- Max results per page: 10
- Image lazy loading: Yes
- OnPush change detection: Yes
- RxJS cleanup: Automatic

## Accessibility

- ✅ Keyboard navigation (ESC)
- ✅ Focus management
- ⚠️ ARIA labels (cần thêm)
- ⚠️ Screen reader support (cần test)

## Known Issues

1. ⚠️ Chưa có virtual scrolling cho kết quả lớn
2. ⚠️ Chưa cache kết quả tìm kiếm
3. ⚠️ Chưa có search history
4. ⚠️ Chưa có autocomplete suggestions

## Future Enhancements

1. 🔮 Search history (localStorage)
2. 🔮 Autocomplete suggestions
3. 🔮 Category filter
4. 🔮 Price range filter
5. 🔮 Sort options
6. 🔮 Keyboard navigation (arrow keys)
7. 🔮 Voice search
8. 🔮 Image search
9. 🔮 Advanced filters
10. 🔮 Search analytics

## Troubleshooting

### Không hiển thị kết quả
1. Kiểm tra backend đang chạy
2. Kiểm tra API endpoint trong environment.ts
3. Kiểm tra console log cho errors
4. Kiểm tra network tab trong DevTools

### Lỗi CORS
1. Kiểm tra backend CORS configuration
2. Kiểm tra API Gateway CORS settings
3. Kiểm tra browser console

### Hình ảnh không load
1. Kiểm tra MinIO server đang chạy
2. Kiểm tra URL trong product.images
3. Kiểm tra CORS cho MinIO

### Tìm kiếm chậm
1. Kiểm tra debounce time (300ms)
2. Kiểm tra backend performance
3. Kiểm tra database indexes
4. Xem xét thêm caching

## Contact

Nếu có vấn đề, liên hệ:
- Backend: Check `SEARCH-API-GUIDE.md`
- Frontend: Check `SEARCH-INTEGRATION-SUMMARY.md`
- Angular 19: Check `~/.kiro/skills/angular-19/SKILL.md`

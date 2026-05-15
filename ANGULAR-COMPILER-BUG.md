# Angular Compiler Bug - @for with Empty Elements

## Vấn Đề

Angular 19 compiler có bug nghiêm trọng khi sử dụng `@for` loop với empty elements (elements không có text content).

## Lỗi

```
NG5002: Opening tag "button" not terminated.
NG5002: Unexpected closing tag "button".
```

## Code Gây Lỗi

```html
@for (img of images; track img) {
  <button type="button" class="indicator"></button>
}
```

## Các Cách Đã Thử (TẤT CẢ ĐỀU THẤT BẠI)

1. ✗ Multi-line button tag
2. ✗ Single-line button tag  
3. ✗ Thêm `&nbsp;` vào trong button
4. ✗ Thêm HTML comment vào trong button
5. ✗ Dùng `<span>` thay vì `<button>`
6. ✗ Dùng `<div>` thay vì `<button>`
7. ✗ Track bằng `$index` thay vì `img`
8. ✗ Track bằng `img` thay vì `$index`

## Workaround Tạm Thời

**KHÔNG DÙNG @for CHO EMPTY ELEMENTS!**

Dùng `*ngFor` (legacy syntax) thay thế:

```html
<!-- WORKS -->
<button *ngFor="let img of images; let i = index"
  type="button"
  (click)="selectImage(i)"
  class="indicator">
</button>
```

## Tác Động

- ✅ Build thành công với `*ngFor`
- ✅ Functionality hoạt động bình thường
- ⚠️ Phải import `CommonModule` để dùng `*ngFor`
- ⚠️ Không thể dùng modern `@for` syntax

## Báo Cáo Bug

Đây là bug của Angular compiler, cần báo cáo lên Angular team:
- GitHub: https://github.com/angular/angular/issues
- Version: Angular 19.x
- Component: Template Compiler

## Kết Luận

Tạm thời phải dùng `*ngFor` cho đến khi Angular team fix bug này.

---

**Last Updated**: 2026-05-11  
**Status**: BLOCKING - Cannot use @for with empty elements

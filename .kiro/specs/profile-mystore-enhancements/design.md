# Design Document: Profile & My Store Enhancements

## Overview

Cải thiện trang Profile và My Store với các tính năng mới: quản lý địa chỉ giao hàng, chỉnh sửa avatar, sidebar menu mở rộng, Store Dashboard cho chủ cửa hàng, và tối ưu hóa giao diện theo design system.

## Architecture

```
src/app/
├── pages/
│   ├── profile/
│   │   ├── profile.component.ts      # Main profile page
│   │   ├── profile.component.html
│   │   └── profile.component.css
│   └── my-store/
│       ├── my-store.component.ts     # My store page (handles both create & dashboard)
│       ├── my-store.component.html
│       └── my-store.component.css
├── components/
│   ├── profile-sidebar/              # Sidebar for Profile page
│   │   ├── profile-sidebar.component.ts
│   │   ├── profile-sidebar.component.html
│   │   └── profile-sidebar.component.css
│   ├── store-sidebar/                # Sidebar for Store Dashboard
│   │   ├── store-sidebar.component.ts
│   │   ├── store-sidebar.component.html
│   │   └── store-sidebar.component.css
│   ├── address-card/                 # Address display card
│   │   ├── address-card.component.ts
│   │   ├── address-card.component.html
│   │   └── address-card.component.css
│   ├── address-form-modal/           # Address add/edit modal
│   │   ├── address-form-modal.component.ts
│   │   ├── address-form-modal.component.html
│   │   └── address-form-modal.component.css
│   └── avatar-picker-modal/          # Avatar selection modal
│       ├── avatar-picker-modal.component.ts
│       ├── avatar-picker-modal.component.html
│       └── avatar-picker-modal.component.css
└── services/
    ├── user.service.ts               # User data management
    └── location.service.ts           # Vietnam location data (provinces, districts, wards)
```

## Components and Interfaces

### 1. ProfileSidebarComponent

Shared sidebar component cho cả Profile và My Store pages.

```typescript
interface MenuItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  isSpecial?: boolean;        // For Sale menu item
  saleEventName?: string;     // e.g., "11/11", "12/12"
  isActive?: boolean;
}

interface ProfileSidebarProps {
  user: User;
  activeRoute: string;
  saleEvent?: SaleEvent;
}
```

### 2. AddressCardComponent

Hiển thị một địa chỉ với các action buttons.

```typescript
interface AddressCardProps {
  address: Address;
  isDefault: boolean;
  onEdit: () => void;
  onSetDefault: () => void;
  onDelete: () => void;
}
```

### 3. AddressFormModalComponent

Modal form để thêm/sửa địa chỉ với cascading selects.

```typescript
interface AddressFormModalProps {
  isOpen: boolean;
  address?: Address;          // null for new address
  onSave: (address: Address) => void;
  onClose: () => void;
}

interface CascadingSelectState {
  selectedProvince: Province | null;
  selectedDistrict: District | null;
  selectedWard: Ward | null;
  filteredDistricts: District[];
  filteredWards: Ward[];
}
```

### 4. AvatarPickerModalComponent

Modal để chọn hoặc upload avatar.

```typescript
interface AvatarPickerModalProps {
  isOpen: boolean;
  currentAvatar: string;
  presetAvatars: string[];
  onSelect: (avatarUrl: string) => void;
  onUpload: (file: File) => void;
  onClose: () => void;
}

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
```

### 5. StoreSidebarComponent

Sidebar component riêng cho Store Dashboard.

```typescript
interface StoreMenuItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  section: 'operations' | 'analytics' | 'management';
}

interface StoreSidebarProps {
  storeName: string;
  username: string;
  activeRoute: string;
}

// Menu structure
const STORE_MENU_ITEMS: StoreMenuItem[] = [
  // HOẠT ĐỘNG
  { id: 'shipping', label: 'Vận chuyển', icon: 'local_shipping', route: '/my-store/shipping', section: 'operations' },
  { id: 'orders', label: 'Quản lý Đơn hàng', icon: 'receipt_long', route: '/my-store/orders', section: 'operations' },
  { id: 'products', label: 'Quản lý Sản phẩm', icon: 'inventory_2', route: '/my-store/products', section: 'operations' },
  
  // PHÂN TÍCH & TĂNG TRƯỞNG
  { id: 'analytics', label: 'Thống kê', icon: 'bar_chart', route: '/my-store/analytics', section: 'analytics' },
  { id: 'revenue', label: 'Doanh thu', icon: 'payments', route: '/my-store/revenue', section: 'analytics' },
  { id: 'growth', label: 'Phát triển', icon: 'trending_up', route: '/my-store/growth', section: 'analytics' },
  { id: 'customer-care', label: 'Chăm sóc Khách hàng', icon: 'support_agent', route: '/my-store/customer-care', section: 'analytics' },
  
  // QUẢN TRỊ
  { id: 'settings', label: 'Cài đặt Cửa hàng', icon: 'settings', route: '/my-store/settings', section: 'management' },
  { id: 'resources', label: 'Nguồn lực', icon: 'folder_open', route: '/my-store/resources', section: 'management' }
];
```

## Data Models

### User Model (Extended)

```typescript
interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  gender: string;
  phoneNumber: string;
  avatarUrl: string;
  joinDate: string;
  hasStore: boolean;
  addresses: Address[];       // Multiple addresses
  defaultAddressId?: string;  // ID of default address
}
```

### Address Model

```typescript
interface Address {
  id: string;
  label?: string;             // e.g., "Nhà", "Công ty"
  recipientName: string;
  phoneNumber: string;
  province: Province;
  district: District;
  ward: Ward;
  streetAddress: string;      // Số nhà, tên đường
  isDefault: boolean;
}
```

### Location Models

```typescript
interface Province {
  code: string;
  name: string;
}

interface District {
  code: string;
  name: string;
  provinceCode: string;
}

interface Ward {
  code: string;
  name: string;
  districtCode: string;
}
```

### Sale Event Model

```typescript
interface SaleEvent {
  id: string;
  name: string;               // e.g., "11/11", "Black Friday"
  isActive: boolean;
  startDate: Date;
  endDate: Date;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Theme Color Consistency
*For any* theme switch (light to dark or dark to light), all Profile and My Store page elements SHALL update their colors according to the CSS variables defined in theme.css.
**Validates: Requirements 2.2**

### Property 2: Default Address Ordering
*For any* list of addresses where one is marked as default, the default address SHALL always appear first in the displayed list.
**Validates: Requirements 3.2**

### Property 3: Cascading Province-District Filter
*For any* selected province, the district dropdown SHALL only contain districts where `district.provinceCode === selectedProvince.code`.
**Validates: Requirements 3.6**

### Property 4: Cascading District-Ward Filter
*For any* selected district, the ward dropdown SHALL only contain wards where `ward.districtCode === selectedDistrict.code`.
**Validates: Requirements 3.7**

### Property 5: Avatar File Type Validation
*For any* uploaded file, the Avatar_Picker SHALL accept the file if and only if its MIME type is in ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'].
**Validates: Requirements 4.4**

### Property 6: Store Dashboard Access Control
*For any* user without a store (hasStore === false), attempting to access Store Dashboard SHALL redirect to My Store page with "Create Store" content.
**Validates: Requirements 7.6**

## Error Handling

1. **Address Operations**
   - Show toast notification on successful add/edit/delete
   - Show error message if operation fails
   - Prevent deletion of last remaining address
   - Confirm before deleting an address

2. **Avatar Upload**
   - Validate file type before upload
   - Show error for invalid file types
   - Show loading state during upload
   - Handle upload failures gracefully

3. **Location Data**
   - Cache location data in service
   - Show loading state while fetching
   - Handle API failures with fallback

4. **Store Dashboard Access**
   - Check user.hasStore before rendering dashboard
   - Redirect to create store page if no store exists
   - Show loading state during store data fetch

## Testing Strategy

### Unit Tests
- Test sidebar menu rendering with different user states
- Test address card action button visibility
- Test avatar picker file validation
- Test cascading select filtering logic

### Property-Based Tests (using fast-check)
- Property 1: Theme switching updates all CSS variables
- Property 2: Default address always first in sorted list
- Property 3: District filtering by province
- Property 4: Ward filtering by district
- Property 5: File type validation accepts only allowed types
- Property 6: Store dashboard access control based on hasStore flag

### Integration Tests
- Test full address CRUD flow
- Test avatar selection and upload flow
- Test sidebar navigation between pages
- Test store dashboard routing based on user.hasStore
- Test store sidebar menu navigation

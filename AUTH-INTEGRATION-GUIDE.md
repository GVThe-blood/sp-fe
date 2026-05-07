# Authentication Integration Guide

## Overview
Frontend Angular app đã được tích hợp với Backend Authentication APIs sử dụng **HTTP-only Cookies** để lưu JWT tokens.

## Backend APIs

### Base URL
- Development: `http://localhost:8080/api/v1/auth`
- Production (via ngrok): `https://boxer-fdlc-ooze.ngrok-free.dev/api/v1/auth`

### API Gateway Routing
```
/api/v1/auth/** → AUTHENTICATION service (stripPrefix: 2)
```

### Cookie Names
Backend set cookies với tên:
- `ACCESS_TOKEN` - JWT access token (HttpOnly, 15 minutes)
- `REFRESH_TOKEN` - JWT refresh token (HttpOnly, 7 days)

### Endpoints

#### 1. Login
```
POST /auth/login
Content-Type: application/json

Request:
{
  "username": "string",
  "password": "string"
}

Response (200 OK):
{
  "code": 200,
  "message": "Login successful",
  "data": {
    "userId": "string",
    "username": "string",
    "accessToken": "string",
    "refreshToken": "string",
    "tokenType": "Bearer",
    "expiresIn": 3600000
  }
}
```

#### 2. Register
```
POST /auth/register
Content-Type: application/json

Request:
{
  "firstName": "string",
  "lastName": "string",
  "username": "string",
  "password": "string",
  "email": "string",
  "gender": "MALE|FEMALE|OTHER",
  "phone": "string",
  "address": "string"
}

Response (200 OK):
{
  "code": 201,
  "message": "User registered successfully",
  "data": {
    "userId": "string",
    "username": "string",
    "email": "string",
    "accessToken": "string",
    "refreshToken": "string",
    "tokenType": "Bearer",
    "expiresIn": 3600000
  }
}
```

#### 3. Refresh Token
```
POST /auth/refresh
Content-Type: application/json

Request:
{
  "refreshToken": "string"
}

Response (200 OK):
{
  "userId": "string",
  "username": "string",
  "accessToken": "string",
  "refreshToken": "string",
  "tokenType": "Bearer",
  "expiresIn": 3600000
}
```

#### 4. Logout
```
GET /auth/logout
Authorization: Bearer {accessToken}

Response (200 OK):
{
  "code": 204,
  "message": "Logout successful",
  "data": null
}
```

## Frontend Implementation

### Services

#### AuthService (`src/app/services/auth.service.ts`)
- `login(credentials)` - Đăng nhập (cookies auto-set by backend)
- `register(userData)` - Đăng ký (cookies auto-set by backend)
- `logout()` - Đăng xuất (cookies auto-cleared by backend)
- `refreshToken()` - Làm mới token (cookies auto-updated by backend)
- `getCookie(name)` - Helper để đọc cookie value
- `hasAuthCookie()` - Kiểm tra có ACCESS_TOKEN cookie không
- `isAuthenticated` - Signal cho trạng thái đăng nhập
- `currentUser` - Signal cho user hiện tại

**Important:** Tất cả HTTP requests phải có `withCredentials: true` để gửi cookies.

### Interceptors

#### AuthInterceptor (`src/app/interceptors/auth.interceptor.ts`)
- Tự động thêm `withCredentials: true` vào tất cả requests
- Tự động refresh token khi nhận 401 Unauthorized
- Redirect đến login khi refresh token thất bại
- **Không** thêm Authorization header (backend dùng cookies)

### Components

#### LoginComponent (`src/app/components/login/`)
- Form validation với username và password
- Tích hợp với AuthService
- Merge guest cart sau khi login thành công
- Hiển thị error messages
- Loading state

#### HeaderComponent (`src/app/components/header/`)
- Hiển thị user info khi đã login
- Button "Sign in" navigate đến `/login`
- Logout functionality

## Token Storage

**Backend sử dụng HTTP-only Cookies:**
- `ACCESS_TOKEN` - JWT access token (HttpOnly, Secure, SameSite, 15 minutes)
- `REFRESH_TOKEN` - JWT refresh token (HttpOnly, Secure, SameSite, 7 days)

**Frontend chỉ lưu user info trong localStorage:**
- `current_user` - User info (userId, username, email)

**Security Benefits:**
- HttpOnly cookies không thể truy cập từ JavaScript → Bảo vệ khỏi XSS attacks
- Cookies tự động gửi với mọi request → Không cần manually manage tokens
- Backend tự động set/clear cookies → Frontend không cần handle token storage

## Password Requirements

Backend yêu cầu password phải:
- Tối thiểu 8 ký tự
- Ít nhất 1 chữ số
- Ít nhất 1 chữ thường
- Ít nhất 1 chữ hoa
- Ít nhất 1 ký tự đặc biệt (@#$%^&+=)
- Không có khoảng trắng

## Testing

### Test Login
1. Start backend services
2. Start ngrok: `cd springfood-microservice && start-ngrok.bat`
3. Start frontend: `cd springfood && npm start`
4. Navigate to `http://localhost:4200/login`
5. Enter credentials:
   - Username: (existing user)
   - Password: (user password)
6. Click "Đăng nhập"

### Test Register
1. Navigate to `http://localhost:4200/register`
2. Fill in all required fields
3. Click "Đăng ký"

### Test Logout
1. Login first
2. Click on user avatar in header
3. Click "Sign out"

## Error Handling

### Login Errors
- Invalid credentials: "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin."
- Network error: Display error message from backend
- Validation errors: Display field-specific errors

### Token Refresh
- Automatic refresh on 401 errors
- Retry original request with new token
- Logout if refresh fails

## Next Steps

1. ✅ Implement Register component integration
2. ✅ Add forgot password functionality
3. ✅ Implement OAuth2 (Google) login
4. ✅ Add user profile management
5. ✅ Implement role-based access control

## Notes

- Backend CORS đã được cấu hình cho ngrok và localhost
- **Backend sử dụng HTTP-only Cookies để lưu JWT tokens**
- Frontend phải gửi `withCredentials: true` trong tất cả HTTP requests
- ACCESS_TOKEN có thời gian sống 15 phút
- REFRESH_TOKEN có thời gian sống 7 ngày
- Logout API sẽ blacklist token trong Redis và clear cookies
- Cookies được set với flags: HttpOnly, Secure (production), SameSite

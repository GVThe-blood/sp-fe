export const environment = {
  production: false,
  // Relative path → đi qua Angular dev proxy (proxy.conf.json) → cùng origin
  // localhost:4200 nên cookie HttpOnly hoạt động bình thường (SameSite=Lax).
  apiUrl: '/api/v1',
  // WebSocket: cũng đi qua dev proxy → cùng origin
  wsUrl: '/ws',
  // Chat REST: relative để qua proxy
  chatServiceUrl: '',
  
  // Placeholder images - Using inline SVG data URIs
  placeholders: {
    // Product placeholder: 600x600 gray background with "No Image" text
    product: 'data:image/svg+xml,%3Csvg width="600" height="600" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="100%25" height="100%25" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="%239ca3af" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E',
    
    // Shop placeholder: 400x300 gray background with "No Logo" text
    shop: 'data:image/svg+xml,%3Csvg width="400" height="300" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="100%25" height="100%25" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="%236b7280" text-anchor="middle" dominant-baseline="middle"%3ENo Logo%3C/text%3E%3C/svg%3E',
  },
};

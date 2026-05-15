export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/v1', // Local API Gateway
  // WebSocket connect TRỰC TIẾP đến chat service (port 9098) cho dev
  // - Auth handled bởi STOMP CONNECT frame (Authorization: Bearer <token>)
  // - Nếu muốn qua Gateway: dùng 'ws://localhost:8080/ws' (cần whitelist /ws/** trong RouterValidator)
  wsUrl: 'ws://localhost:9098/ws',
  // Chat REST endpoints (đi qua Gateway): /api/v1/chat/* sẽ stripPrefix(2) -> /chat/*
  // AIAssistantController có @RequestMapping("/api/ai-assistant") nên trực tiếp tới chat service
  chatServiceUrl: 'http://localhost:9098', // Dùng cho REST gọi trực tiếp khi cần
  
  // Placeholder images - Using inline SVG data URIs
  placeholders: {
    // Product placeholder: 600x600 gray background with "No Image" text
    product: 'data:image/svg+xml,%3Csvg width="600" height="600" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="100%25" height="100%25" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="%239ca3af" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E',
    
    // Shop placeholder: 400x300 gray background with "No Logo" text
    shop: 'data:image/svg+xml,%3Csvg width="400" height="300" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="100%25" height="100%25" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="%236b7280" text-anchor="middle" dominant-baseline="middle"%3ENo Logo%3C/text%3E%3C/svg%3E',
  },
};

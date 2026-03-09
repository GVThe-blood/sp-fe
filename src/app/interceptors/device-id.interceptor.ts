import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { DeviceIdService } from '../services/device-id.service';

/**
 * Configuration for the Device ID interceptor
 */
export interface InterceptorConfig {
  cartApiPatterns: RegExp[];
}

/**
 * Default configuration with cart API URL patterns
 * Requirements: 2.4
 */
export const DEFAULT_INTERCEPTOR_CONFIG: InterceptorConfig = {
  cartApiPatterns: [
    /\/api\/v1\/cart/,
    /\/cart\//
  ]
};

/**
 * Header name for Device ID
 */
export const DEVICE_ID_HEADER = 'X-Device-Id';

/**
 * Check if the URL matches any cart API pattern
 * Requirements: 2.4
 */
function isCartApiUrl(url: string, patterns: RegExp[]): boolean {
  return patterns.some(pattern => pattern.test(url));
}

/**
 * HTTP Interceptor function that attaches X-Device-Id header to cart API requests
 * 
 * Requirements:
 * - 2.1: Attach X-Device-Id header to Cart API requests
 * - 2.3: Proceed without header for non-cart APIs when Device ID unavailable
 * - 2.4: Always include X-Device-Id for cart-related endpoints
 * 
 * **Feature: guest-cart-merge, Property 3: Cart API Header Attachment**
 * **Feature: guest-cart-merge, Property 4: Authenticated Request Headers**
 */
export const deviceIdInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const deviceIdService = inject(DeviceIdService);
  const config = DEFAULT_INTERCEPTOR_CONFIG;
  
  // Check if this is a cart API request
  const isCartRequest = isCartApiUrl(req.url, config.cartApiPatterns);
  
  try {
    // For cart API requests, always try to attach the Device ID header
    // Requirements: 2.1, 2.4
    if (isCartRequest) {
      const deviceId = deviceIdService.getDeviceId();
      
      if (deviceId) {
        const clonedRequest = req.clone({
          setHeaders: {
            [DEVICE_ID_HEADER]: deviceId
          }
        });
        return next(clonedRequest);
      }
    }
    
    // For non-cart APIs or when Device ID is unavailable, proceed without the header
    // Requirements: 2.3
    return next(req);
    
  } catch (error) {
    // If DeviceIdService throws, log error and proceed without header
    // This ensures the request doesn't fail due to Device ID issues
    console.warn('DeviceIdInterceptor: Failed to get Device ID', error);
    return next(req);
  }
};

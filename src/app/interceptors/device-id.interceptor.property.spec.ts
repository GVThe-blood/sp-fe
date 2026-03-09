import * as fc from 'fast-check';
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors, HttpRequest } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { deviceIdInterceptor, DEFAULT_INTERCEPTOR_CONFIG, DEVICE_ID_HEADER } from './device-id.interceptor';
import { DeviceIdService, DEVICE_ID_KEY } from '../services/device-id.service';

/**
 * Property-based tests for DeviceIdInterceptor
 * Feature: guest-cart-merge
 */
describe('DeviceIdInterceptor Property Tests', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let deviceIdService: DeviceIdService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([deviceIdInterceptor])),
        provideHttpClientTesting(),
        DeviceIdService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
    deviceIdService = TestBed.inject(DeviceIdService);
  });

  afterEach(() => {
    httpTestingController.verify();
    localStorage.clear();
  });

  /**
   * **Feature: guest-cart-merge, Property 3: Cart API Header Attachment**
   * 
   * For any HTTP request to a cart-related endpoint, the DeviceIdInterceptor 
   * must attach the `X-Device-Id` header with the current Device ID value.
   * 
   * **Validates: Requirements 2.1, 2.4, 5.2**
   */
  describe('Property 3: Cart API Header Attachment', () => {
    // Arbitrary for generating cart API URL paths
    const cartApiPathArbitrary = fc.oneof(
      fc.constant('/api/v1/cart'),
      fc.constant('/api/v1/cart/items'),
      fc.constant('/api/v1/cart/merge'),
      fc.constant('/cart/add'),
      fc.constant('/cart/remove'),
      fc.stringMatching(/^\/api\/v1\/cart\/[a-z0-9]+$/)
    );

    // Arbitrary for generating base URLs
    const baseUrlArbitrary = fc.oneof(
      fc.constant('http://localhost:4200'),
      fc.constant('https://api.example.com'),
      fc.constant('')
    );

    it('should attach X-Device-Id header to all cart API requests', () => {
      fc.assert(
        fc.property(
          baseUrlArbitrary,
          cartApiPathArbitrary,
          (baseUrl: string, cartPath: string) => {
            const fullUrl = baseUrl + cartPath;
            
            // Ensure Device ID exists
            const expectedDeviceId = deviceIdService.getDeviceId();
            
            // Make HTTP request
            httpClient.get(fullUrl).subscribe();
            
            // Verify the request has the X-Device-Id header
            const req = httpTestingController.expectOne(fullUrl);
            
            expect(req.request.headers.has(DEVICE_ID_HEADER)).toBe(true);
            expect(req.request.headers.get(DEVICE_ID_HEADER)).toBe(expectedDeviceId);
            
            req.flush({});
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use the same Device ID for all cart API requests in a session', () => {
      fc.assert(
        fc.property(
          fc.array(cartApiPathArbitrary, { minLength: 2, maxLength: 5 }),
          (cartPaths: string[]) => {
            const expectedDeviceId = deviceIdService.getDeviceId();
            const collectedDeviceIds: string[] = [];
            
            // Make multiple requests
            cartPaths.forEach((path, index) => {
              const url = `http://localhost:4200${path}?req=${index}`;
              httpClient.get(url).subscribe();
            });
            
            // Verify all requests have the same Device ID
            cartPaths.forEach((path, index) => {
              const url = `http://localhost:4200${path}?req=${index}`;
              const req = httpTestingController.expectOne(url);
              
              const deviceIdHeader = req.request.headers.get(DEVICE_ID_HEADER);
              expect(deviceIdHeader).toBe(expectedDeviceId);
              collectedDeviceIds.push(deviceIdHeader!);
              
              req.flush({});
            });
            
            // All collected Device IDs should be identical
            const uniqueIds = new Set(collectedDeviceIds);
            expect(uniqueIds.size).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT attach X-Device-Id header to non-cart API requests', () => {
      // Arbitrary for non-cart API paths
      const nonCartApiPathArbitrary = fc.oneof(
        fc.constant('/api/v1/products'),
        fc.constant('/api/v1/users'),
        fc.constant('/api/v1/orders'),
        fc.constant('/auth/login'),
        fc.constant('/api/v1/stores')
      );

      fc.assert(
        fc.property(
          nonCartApiPathArbitrary,
          (nonCartPath: string) => {
            const fullUrl = `http://localhost:4200${nonCartPath}`;
            
            // Make HTTP request to non-cart API
            httpClient.get(fullUrl).subscribe();
            
            // Verify the request does NOT have the X-Device-Id header
            const req = httpTestingController.expectOne(fullUrl);
            
            expect(req.request.headers.has(DEVICE_ID_HEADER)).toBe(false);
            
            req.flush({});
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should attach header for all HTTP methods on cart APIs', () => {
      const httpMethodArbitrary = fc.constantFrom('GET', 'POST', 'PUT', 'DELETE', 'PATCH');

      fc.assert(
        fc.property(
          httpMethodArbitrary,
          cartApiPathArbitrary,
          (method: string, cartPath: string) => {
            const fullUrl = `http://localhost:4200${cartPath}`;
            const expectedDeviceId = deviceIdService.getDeviceId();
            
            // Make HTTP request with specified method
            switch (method) {
              case 'GET':
                httpClient.get(fullUrl).subscribe();
                break;
              case 'POST':
                httpClient.post(fullUrl, {}).subscribe();
                break;
              case 'PUT':
                httpClient.put(fullUrl, {}).subscribe();
                break;
              case 'DELETE':
                httpClient.delete(fullUrl).subscribe();
                break;
              case 'PATCH':
                httpClient.patch(fullUrl, {}).subscribe();
                break;
            }
            
            // Verify the request has the X-Device-Id header
            const req = httpTestingController.expectOne(fullUrl);
            
            expect(req.request.headers.has(DEVICE_ID_HEADER)).toBe(true);
            expect(req.request.headers.get(DEVICE_ID_HEADER)).toBe(expectedDeviceId);
            
            req.flush({});
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve existing headers when attaching X-Device-Id', () => {
      fc.assert(
        fc.property(
          cartApiPathArbitrary,
          fc.record({
            'Content-Type': fc.constant('application/json'),
            'Accept': fc.constant('application/json'),
            'Custom-Header': fc.string({ minLength: 1, maxLength: 20 })
          }),
          (cartPath: string, customHeaders: Record<string, string>) => {
            const fullUrl = `http://localhost:4200${cartPath}`;
            const expectedDeviceId = deviceIdService.getDeviceId();
            
            // Make HTTP request with custom headers
            httpClient.get(fullUrl, { headers: customHeaders }).subscribe();
            
            // Verify the request has both custom headers and X-Device-Id
            const req = httpTestingController.expectOne(fullUrl);
            
            // Check X-Device-Id is present
            expect(req.request.headers.has(DEVICE_ID_HEADER)).toBe(true);
            expect(req.request.headers.get(DEVICE_ID_HEADER)).toBe(expectedDeviceId);
            
            // Check custom headers are preserved
            Object.entries(customHeaders).forEach(([key, value]) => {
              expect(req.request.headers.get(key)).toBe(value);
            });
            
            req.flush({});
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

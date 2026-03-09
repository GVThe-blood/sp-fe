import * as fc from 'fast-check';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { CartService, CART_API_ENDPOINTS, MergeCartRequest, MergeCartResponse } from './cart.service';
import { DeviceIdService, DEVICE_ID_KEY, UUID_V4_PATTERN } from './device-id.service';

/**
 * Property-based tests for CartService
 * Feature: guest-cart-merge
 */
describe('CartService Property Tests', () => {
  let cartService: CartService;
  let httpTestingController: HttpTestingController;
  let deviceIdService: DeviceIdService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        CartService,
        DeviceIdService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    cartService = TestBed.inject(CartService);
    httpTestingController = TestBed.inject(HttpTestingController);
    deviceIdService = TestBed.inject(DeviceIdService);
  });

  afterEach(() => {
    // Flush any pending getCart requests that may have been triggered by successful merges
    const pendingRequests = httpTestingController.match(CART_API_ENDPOINTS.GET_CART);
    pendingRequests.forEach(req => req.flush([]));
    httpTestingController.verify();
    localStorage.clear();
  });

  /**
   * **Feature: guest-cart-merge, Property 5: Merge API Call Format**
   * 
   * For any cart merge operation, the request must be a POST to `/api/v1/cart/merge` 
   * with the Device ID in the request body.
   * 
   * **Validates: Requirements 3.2**
   */
  describe('Property 5: Merge API Call Format', () => {
    it('should send POST request to /api/v1/cart/merge with Device ID in body', () => {
      fc.assert(
        fc.property(
          fc.constant(true), // Just need to run the test multiple times
          () => {
            // Get the current Device ID (will be generated if not exists)
            const expectedDeviceId = deviceIdService.getDeviceId();
            
            // Call mergeGuestCart
            cartService.mergeGuestCart().subscribe();
            
            // Verify the request
            const req = httpTestingController.expectOne(CART_API_ENDPOINTS.MERGE);
            
            // Verify it's a POST request
            expect(req.request.method).toBe('POST');
            
            // Verify the URL is correct
            expect(req.request.url).toBe('/api/v1/cart/merge');
            
            // Verify the request body contains the Device ID
            const requestBody = req.request.body as MergeCartRequest;
            expect(requestBody).toBeDefined();
            expect(requestBody.deviceId).toBe(expectedDeviceId);
            
            // Verify Device ID is valid UUID v4
            expect(UUID_V4_PATTERN.test(requestBody.deviceId)).toBe(true);
            
            // Respond with success
            req.flush({ success: true } as MergeCartResponse);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always use the same Device ID for merge requests in a session', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 5 }), // Number of merge calls
          (numCalls: number) => {
            const expectedDeviceId = deviceIdService.getDeviceId();
            const collectedDeviceIds: string[] = [];
            
            // Make multiple merge requests sequentially
            for (let i = 0; i < numCalls; i++) {
              cartService.mergeGuestCart().subscribe();
              
              // Handle the merge request
              const mergeReq = httpTestingController.expectOne(CART_API_ENDPOINTS.MERGE);
              expect(mergeReq.request.method).toBe('POST');
              
              const requestBody = mergeReq.request.body as MergeCartRequest;
              collectedDeviceIds.push(requestBody.deviceId);
              
              mergeReq.flush({ success: true } as MergeCartResponse);
              
              // Handle the subsequent getCart request triggered by successful merge
              const cartReq = httpTestingController.expectOne(CART_API_ENDPOINTS.GET_CART);
              cartReq.flush([]);
            }
            
            // All Device IDs should be identical
            const uniqueIds = new Set(collectedDeviceIds);
            expect(uniqueIds.size).toBe(1);
            expect(collectedDeviceIds[0]).toBe(expectedDeviceId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use pre-existing Device ID from LocalStorage for merge request', () => {
      // Custom arbitrary for UUID v4 format
      const uuidV4Arbitrary = fc.tuple(
        fc.stringMatching(/^[0-9a-f]{8}$/),
        fc.stringMatching(/^[0-9a-f]{4}$/),
        fc.stringMatching(/^[0-9a-f]{3}$/),
        fc.constantFrom('8', '9', 'a', 'b'),
        fc.stringMatching(/^[0-9a-f]{3}$/),
        fc.stringMatching(/^[0-9a-f]{12}$/)
      ).map(([p1, p2, p3, variant, p4, p5]) => `${p1}-${p2}-4${p3}-${variant}${p4}-${p5}`);

      fc.assert(
        fc.property(
          uuidV4Arbitrary,
          (preExistingUUID: string) => {
            // Pre-store a valid UUID v4 in LocalStorage
            localStorage.setItem(DEVICE_ID_KEY, preExistingUUID);
            
            // Create fresh service instances
            TestBed.resetTestingModule();
            TestBed.configureTestingModule({
              providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                CartService,
                DeviceIdService,
                { provide: PLATFORM_ID, useValue: 'browser' }
              ]
            });
            
            const freshCartService = TestBed.inject(CartService);
            const freshHttpTestingController = TestBed.inject(HttpTestingController);
            
            // Call mergeGuestCart
            freshCartService.mergeGuestCart().subscribe();
            
            // Verify the request uses the pre-existing Device ID
            const mergeReq = freshHttpTestingController.expectOne(CART_API_ENDPOINTS.MERGE);
            
            expect(mergeReq.request.method).toBe('POST');
            
            const requestBody = mergeReq.request.body as MergeCartRequest;
            expect(requestBody.deviceId).toBe(preExistingUUID);
            
            mergeReq.flush({ success: true } as MergeCartResponse);
            
            // Handle the subsequent getCart request triggered by successful merge
            const cartReq = freshHttpTestingController.expectOne(CART_API_ENDPOINTS.GET_CART);
            cartReq.flush([]);
            
            freshHttpTestingController.verify();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include deviceId property in request body structure', () => {
      fc.assert(
        fc.property(
          fc.constant(true),
          () => {
            // Call mergeGuestCart
            cartService.mergeGuestCart().subscribe();
            
            // Verify the request body structure
            const req = httpTestingController.expectOne(CART_API_ENDPOINTS.MERGE);
            
            const requestBody = req.request.body;
            
            // Verify body is an object with deviceId property
            expect(typeof requestBody).toBe('object');
            expect(requestBody).not.toBeNull();
            expect('deviceId' in requestBody).toBe(true);
            expect(typeof requestBody.deviceId).toBe('string');
            expect(requestBody.deviceId.length).toBeGreaterThan(0);
            
            req.flush({ success: true } as MergeCartResponse);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

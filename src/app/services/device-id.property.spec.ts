import * as fc from 'fast-check';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { DeviceIdService, DEVICE_ID_KEY, UUID_V4_PATTERN } from './device-id.service';

/**
 * Property-based tests for DeviceIdService
 * Feature: guest-cart-merge
 */
describe('DeviceIdService Property Tests', () => {
  let service: DeviceIdService;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    TestBed.configureTestingModule({
      providers: [
        DeviceIdService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    service = TestBed.inject(DeviceIdService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  /**
   * **Feature: guest-cart-merge, Property 1: Device ID Round Trip Consistency**
   * 
   * For any Device ID that is generated and stored in LocalStorage, 
   * retrieving it should return the exact same value.
   * 
   * **Validates: Requirements 1.1, 1.2**
   */
  describe('Property 1: Device ID Round Trip Consistency', () => {
    it('should return the same Device ID on consecutive calls', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }), // Number of times to call getDeviceId
          (numCalls: number) => {
            // First call generates and stores the Device ID
            const firstDeviceId = service.getDeviceId();
            
            // Subsequent calls should return the same value
            for (let i = 0; i < numCalls; i++) {
              const subsequentDeviceId = service.getDeviceId();
              expect(subsequentDeviceId).toBe(firstDeviceId);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should persist Device ID in LocalStorage and retrieve the same value', () => {
      fc.assert(
        fc.property(
          fc.constant(true), // Just need to run the test
          () => {
            // Generate Device ID
            const generatedId = service.getDeviceId();
            
            // Verify it's stored in LocalStorage
            const storedId = localStorage.getItem(DEVICE_ID_KEY);
            expect(storedId).toBe(generatedId);
            
            // Create a new service instance to simulate app restart
            const newService = TestBed.inject(DeviceIdService);
            const retrievedId = newService.getDeviceId();
            
            // Should retrieve the same ID from LocalStorage
            expect(retrievedId).toBe(generatedId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use existing valid Device ID from LocalStorage', () => {
      // Custom arbitrary for UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      // where y is one of 8, 9, a, b
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
          (validUUID: string) => {
            // Pre-store a valid UUID v4 in LocalStorage
            localStorage.setItem(DEVICE_ID_KEY, validUUID);
            
            // Create a fresh service instance
            TestBed.resetTestingModule();
            TestBed.configureTestingModule({
              providers: [
                DeviceIdService,
                { provide: PLATFORM_ID, useValue: 'browser' }
              ]
            });
            const freshService = TestBed.inject(DeviceIdService);
            
            // Should retrieve the pre-stored UUID
            const retrievedId = freshService.getDeviceId();
            expect(retrievedId).toBe(validUUID);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate new Device ID when stored value is invalid', () => {
      fc.assert(
        fc.property(
          // Generate invalid UUID strings (not matching v4 pattern)
          fc.string({ minLength: 1, maxLength: 50 }).filter(
            (s: string) => !UUID_V4_PATTERN.test(s)
          ),
          (invalidUUID: string) => {
            // Pre-store an invalid UUID in LocalStorage
            localStorage.setItem(DEVICE_ID_KEY, invalidUUID);
            
            // Create a fresh service instance
            TestBed.resetTestingModule();
            TestBed.configureTestingModule({
              providers: [
                DeviceIdService,
                { provide: PLATFORM_ID, useValue: 'browser' }
              ]
            });
            const freshService = TestBed.inject(DeviceIdService);
            
            // Should generate a new valid UUID
            const retrievedId = freshService.getDeviceId();
            
            // The new ID should be valid UUID v4
            expect(UUID_V4_PATTERN.test(retrievedId)).toBe(true);
            
            // The new ID should be different from the invalid one
            expect(retrievedId).not.toBe(invalidUUID);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

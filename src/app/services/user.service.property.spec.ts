import * as fc from 'fast-check';
import { TestBed } from '@angular/core/testing';
import { UserService, Address, User } from './user.service';
import { Province, District, Ward } from './location.service';

/**
 * Property-based tests for UserService
 * Feature: profile-mystore-enhancements
 */
describe('UserService Property Tests', () => {
  let service: UserService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UserService]
    });
    service = TestBed.inject(UserService);
  });

  /**
   * **Feature: profile-mystore-enhancements, Property 2: Default Address Ordering**
   * 
   * For any list of addresses where one is marked as default, 
   * the default address SHALL always appear first in the displayed list.
   * 
   * **Validates: Requirements 3.2**
   */
  describe('Property 2: Default Address Ordering', () => {
    // Arbitrary for Province
    const provinceArbitrary = fc.record({
      code: fc.stringMatching(/^[A-Z]{2,3}$/),
      name: fc.string({ minLength: 3, maxLength: 30 })
    });

    // Arbitrary for District
    const districtArbitrary = (provinceCode: string) => fc.record({
      code: fc.stringMatching(/^[A-Z0-9-]{3,10}$/),
      name: fc.string({ minLength: 3, maxLength: 30 }),
      provinceCode: fc.constant(provinceCode)
    });

    // Arbitrary for Ward
    const wardArbitrary = (districtCode: string) => fc.record({
      code: fc.stringMatching(/^[A-Z0-9-]{3,15}$/),
      name: fc.string({ minLength: 3, maxLength: 30 }),
      districtCode: fc.constant(districtCode)
    });

    // Arbitrary for Address
    const addressArbitrary = fc.record({
      id: fc.uuid(),
      label: fc.option(fc.constantFrom('Nhà', 'Công ty', 'Khác'), { nil: undefined }),
      recipientName: fc.string({ minLength: 3, maxLength: 50 }),
      phoneNumber: fc.stringMatching(/^\+84 [0-9]{3} [0-9]{3} [0-9]{3}$/),
      province: provinceArbitrary,
      district: provinceArbitrary.chain(p => districtArbitrary(p.code)),
      ward: provinceArbitrary.chain(p => 
        districtArbitrary(p.code).chain(d => wardArbitrary(d.code))
      ),
      streetAddress: fc.string({ minLength: 5, maxLength: 100 }),
      isDefault: fc.boolean()
    });

    it('should always return default address first when calling getAddressesSorted', () => {
      fc.assert(
        fc.property(
          fc.array(addressArbitrary, { minLength: 2, maxLength: 10 }),
          fc.integer({ min: 0, max: 9 }), // Index of address to set as default
          (addresses: Address[], defaultIndex: number) => {
            // Ensure we have at least one address
            if (addresses.length === 0) return;
            
            // Ensure defaultIndex is within bounds
            const safeDefaultIndex = defaultIndex % addresses.length;
            
            // Set exactly one address as default
            const addressesWithDefault = addresses.map((addr, idx) => ({
              ...addr,
              isDefault: idx === safeDefaultIndex
            }));
            
            // Create a mock user with these addresses
            const mockUser: User = {
              id: 'test-user',
              firstName: 'Test',
              lastName: 'User',
              username: 'testuser',
              email: 'test@example.com',
              gender: 'Male',
              phoneNumber: '+84 123 456 789',
              avatarUrl: 'https://example.com/avatar.jpg',
              joinDate: '2023',
              hasStore: false,
              addresses: addressesWithDefault,
              defaultAddressId: addressesWithDefault[safeDefaultIndex].id
            };
            
            // Update the service with this user
            service.currentUser.set(mockUser);
            
            // Get sorted addresses
            const sortedAddresses = service.getAddressesSorted();
            
            // Property: First address should be the default one
            expect(sortedAddresses.length).toBe(addresses.length);
            expect(sortedAddresses[0].isDefault).toBe(true);
            expect(sortedAddresses[0].id).toBe(addressesWithDefault[safeDefaultIndex].id);
            
            // All other addresses should not be default
            for (let i = 1; i < sortedAddresses.length; i++) {
              expect(sortedAddresses[i].isDefault).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain default address at first position after adding new address', () => {
      fc.assert(
        fc.property(
          fc.array(addressArbitrary, { minLength: 1, maxLength: 5 }),
          addressArbitrary,
          (existingAddresses: Address[], newAddress: Address) => {
            // Set first existing address as default
            const addressesWithDefault = existingAddresses.map((addr, idx) => ({
              ...addr,
              isDefault: idx === 0
            }));
            
            // Create mock user
            const mockUser: User = {
              id: 'test-user',
              firstName: 'Test',
              lastName: 'User',
              username: 'testuser',
              email: 'test@example.com',
              gender: 'Male',
              phoneNumber: '+84 123 456 789',
              avatarUrl: 'https://example.com/avatar.jpg',
              joinDate: '2023',
              hasStore: false,
              addresses: addressesWithDefault,
              defaultAddressId: addressesWithDefault[0].id
            };
            
            service.currentUser.set(mockUser);
            
            // Add new address (not default)
            const newAddressNotDefault = { ...newAddress, isDefault: false };
            service.addAddress(newAddressNotDefault);
            
            // Get sorted addresses
            const sortedAddresses = service.getAddressesSorted();
            
            // Property: First address should still be the original default
            expect(sortedAddresses[0].id).toBe(addressesWithDefault[0].id);
            expect(sortedAddresses[0].isDefault).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should move new default address to first position when setting as default', () => {
      fc.assert(
        fc.property(
          fc.array(addressArbitrary, { minLength: 2, maxLength: 5 }),
          fc.integer({ min: 1, max: 4 }), // Index of address to set as new default (not 0)
          (addresses: Address[], newDefaultIndex: number) => {
            if (addresses.length < 2) return;
            
            // Ensure newDefaultIndex is within bounds and not 0
            const safeNewDefaultIndex = (newDefaultIndex % (addresses.length - 1)) + 1;
            
            // Set first address as default initially
            const addressesWithDefault = addresses.map((addr, idx) => ({
              ...addr,
              isDefault: idx === 0
            }));
            
            // Create mock user
            const mockUser: User = {
              id: 'test-user',
              firstName: 'Test',
              lastName: 'User',
              username: 'testuser',
              email: 'test@example.com',
              gender: 'Male',
              phoneNumber: '+84 123 456 789',
              avatarUrl: 'https://example.com/avatar.jpg',
              joinDate: '2023',
              hasStore: false,
              addresses: addressesWithDefault,
              defaultAddressId: addressesWithDefault[0].id
            };
            
            service.currentUser.set(mockUser);
            
            // Set a different address as default
            const newDefaultId = addressesWithDefault[safeNewDefaultIndex].id;
            service.setDefaultAddress(newDefaultId);
            
            // Get sorted addresses
            const sortedAddresses = service.getAddressesSorted();
            
            // Property: First address should now be the newly set default
            expect(sortedAddresses[0].id).toBe(newDefaultId);
            expect(sortedAddresses[0].isDefault).toBe(true);
            
            // All other addresses should not be default
            for (let i = 1; i < sortedAddresses.length; i++) {
              expect(sortedAddresses[i].isDefault).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain default address first after deleting non-default address', () => {
      fc.assert(
        fc.property(
          fc.array(addressArbitrary, { minLength: 3, maxLength: 5 }),
          fc.integer({ min: 1, max: 4 }), // Index of non-default address to delete
          (addresses: Address[], deleteIndex: number) => {
            if (addresses.length < 3) return;
            
            // Ensure deleteIndex is within bounds and not 0 (not the default)
            const safeDeleteIndex = (deleteIndex % (addresses.length - 1)) + 1;
            
            // Set first address as default
            const addressesWithDefault = addresses.map((addr, idx) => ({
              ...addr,
              isDefault: idx === 0
            }));
            
            // Create mock user
            const mockUser: User = {
              id: 'test-user',
              firstName: 'Test',
              lastName: 'User',
              username: 'testuser',
              email: 'test@example.com',
              gender: 'Male',
              phoneNumber: '+84 123 456 789',
              avatarUrl: 'https://example.com/avatar.jpg',
              joinDate: '2023',
              hasStore: false,
              addresses: addressesWithDefault,
              defaultAddressId: addressesWithDefault[0].id
            };
            
            service.currentUser.set(mockUser);
            
            const originalDefaultId = addressesWithDefault[0].id;
            
            // Delete a non-default address
            service.deleteAddress(addressesWithDefault[safeDeleteIndex].id);
            
            // Get sorted addresses
            const sortedAddresses = service.getAddressesSorted();
            
            // Property: First address should still be the original default
            expect(sortedAddresses[0].id).toBe(originalDefaultId);
            expect(sortedAddresses[0].isDefault).toBe(true);
            expect(sortedAddresses.length).toBe(addresses.length - 1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should set first remaining address as default when deleting the default address', () => {
      fc.assert(
        fc.property(
          fc.array(addressArbitrary, { minLength: 2, maxLength: 5 }),
          (addresses: Address[]) => {
            if (addresses.length < 2) return;
            
            // Set first address as default
            const addressesWithDefault = addresses.map((addr, idx) => ({
              ...addr,
              isDefault: idx === 0
            }));
            
            // Create mock user
            const mockUser: User = {
              id: 'test-user',
              firstName: 'Test',
              lastName: 'User',
              username: 'testuser',
              email: 'test@example.com',
              gender: 'Male',
              phoneNumber: '+84 123 456 789',
              avatarUrl: 'https://example.com/avatar.jpg',
              joinDate: '2023',
              hasStore: false,
              addresses: addressesWithDefault,
              defaultAddressId: addressesWithDefault[0].id
            };
            
            service.currentUser.set(mockUser);
            
            const secondAddressId = addressesWithDefault[1].id;
            
            // Delete the default address
            service.deleteAddress(addressesWithDefault[0].id);
            
            // Get sorted addresses
            const sortedAddresses = service.getAddressesSorted();
            
            // Property: First address should now be what was the second address
            expect(sortedAddresses.length).toBe(addresses.length - 1);
            expect(sortedAddresses[0].id).toBe(secondAddressId);
            expect(sortedAddresses[0].isDefault).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

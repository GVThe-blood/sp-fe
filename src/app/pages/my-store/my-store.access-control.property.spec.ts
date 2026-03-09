import { TestBed } from '@angular/core/testing';
import { MyStoreComponent } from './my-store.component';
import { UserService, User } from '../../services/user.service';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import * as fc from 'fast-check';

/**
 * Property 6: Store Dashboard Access Control
 * 
 * For any user without a store (hasStore === false), attempting to access Store Dashboard
 * SHALL redirect to My Store page with "Create Store" content.
 * 
 * Validates: Requirements 7.6
 */
describe('MyStoreComponent - Property 6: Store Dashboard Access Control', () => {
  
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('should show ProfileSidebar and Create Store content when user has no store', () => {
    fc.assert(
      fc.property(
        // Generate arbitrary user data
        fc.record({
          id: fc.string({ minLength: 1 }),
          firstName: fc.string({ minLength: 1 }),
          lastName: fc.string({ minLength: 1 }),
          username: fc.string({ minLength: 1 }),
          email: fc.emailAddress(),
          gender: fc.constantFrom('Male', 'Female', 'Other'),
          phoneNumber: fc.string({ minLength: 10, maxLength: 15 }),
          avatarUrl: fc.webUrl(),
          joinDate: fc.integer({ min: 2020, max: 2025 }).map(String),
          hasStore: fc.constant(false), // Always false for this test
          addresses: fc.constant([]),
          defaultAddressId: fc.constant(undefined)
        }),
        (userData) => {
          // Setup
          TestBed.resetTestingModule();
          
          const userServiceSpy = jasmine.createSpyObj('UserService', ['toggleStoreStatus'], {
            currentUser: signal<User | null>(userData as unknown as User)
          });

          TestBed.configureTestingModule({
            imports: [MyStoreComponent],
            providers: [
              { provide: UserService, useValue: userServiceSpy },
              provideRouter([])
            ]
          });

          const fixture = TestBed.createComponent(MyStoreComponent);
          const component = fixture.componentInstance;
          fixture.detectChanges();

          const compiled = fixture.nativeElement;

          // Property: User without store should see ProfileSidebar
          const profileSidebar = compiled.querySelector('app-profile-sidebar');
          const storeSidebar = compiled.querySelector('app-store-sidebar');
          
          expect(profileSidebar).toBeTruthy();
          expect(storeSidebar).toBeFalsy();

          // Property: User without store should see "Create Store" content
          const createStoreSection = compiled.querySelector('.create-store-section');
          const storeDashboard = compiled.querySelector('.store-dashboard');
          
          expect(createStoreSection).toBeTruthy();
          expect(storeDashboard).toBeFalsy();

          // Property: Create store button should be present
          const createStoreButton = compiled.querySelector('.btn-create-store');
          expect(createStoreButton).toBeTruthy();
          
          // Cleanup
          fixture.destroy();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should show StoreSidebar and Dashboard content when user has a store', () => {
    fc.assert(
      fc.property(
        // Generate arbitrary user data
        fc.record({
          id: fc.string({ minLength: 1 }),
          firstName: fc.string({ minLength: 1 }),
          lastName: fc.string({ minLength: 1 }),
          username: fc.string({ minLength: 1 }),
          email: fc.emailAddress(),
          gender: fc.constantFrom('Male', 'Female', 'Other'),
          phoneNumber: fc.string({ minLength: 10, maxLength: 15 }),
          avatarUrl: fc.webUrl(),
          joinDate: fc.integer({ min: 2020, max: 2025 }).map(String),
          hasStore: fc.constant(true), // Always true for this test
          addresses: fc.constant([]),
          defaultAddressId: fc.constant(undefined)
        }),
        (userData) => {
          // Setup
          TestBed.resetTestingModule();
          
          const userServiceSpy = jasmine.createSpyObj('UserService', ['toggleStoreStatus'], {
            currentUser: signal<User | null>(userData as unknown as User)
          });

          TestBed.configureTestingModule({
            imports: [MyStoreComponent],
            providers: [
              { provide: UserService, useValue: userServiceSpy },
              provideRouter([])
            ]
          });

          const fixture = TestBed.createComponent(MyStoreComponent);
          const component = fixture.componentInstance;
          fixture.detectChanges();

          const compiled = fixture.nativeElement;

          // Property: User with store should see StoreSidebar
          const profileSidebar = compiled.querySelector('app-profile-sidebar');
          const storeSidebar = compiled.querySelector('app-store-sidebar');
          
          expect(profileSidebar).toBeFalsy();
          expect(storeSidebar).toBeTruthy();

          // Property: User with store should see Dashboard content
          const createStoreSection = compiled.querySelector('.create-store-section');
          const contentCard = compiled.querySelector('.content-card');
          
          expect(createStoreSection).toBeFalsy();
          expect(contentCard).toBeTruthy();

          // Property: Dashboard should show content header
          const contentTitle = compiled.querySelector('.content-title');
          expect(contentTitle).toBeTruthy();
          
          // Cleanup
          fixture.destroy();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should toggle between Create Store and Dashboard when hasStore changes', () => {
    fc.assert(
      fc.property(
        // Generate arbitrary user data
        fc.record({
          id: fc.string({ minLength: 1 }),
          firstName: fc.string({ minLength: 1 }),
          lastName: fc.string({ minLength: 1 }),
          username: fc.string({ minLength: 1 }),
          email: fc.emailAddress(),
          gender: fc.constantFrom('Male', 'Female', 'Other'),
          phoneNumber: fc.string({ minLength: 10, maxLength: 15 }),
          avatarUrl: fc.webUrl(),
          joinDate: fc.integer({ min: 2020, max: 2025 }).map(String),
          hasStore: fc.boolean(), // Random boolean
          addresses: fc.constant([]),
          defaultAddressId: fc.constant(undefined)
        }),
        (userData) => {
          // Setup with mutable signal
          TestBed.resetTestingModule();
          
          const userSignal = signal<User | null>(userData as unknown as User);
          const userServiceSpy = jasmine.createSpyObj('UserService', ['toggleStoreStatus'], {
            currentUser: userSignal
          });

          // Make toggleStoreStatus actually toggle the hasStore flag
          userServiceSpy.toggleStoreStatus.and.callFake(() => {
            const currentUser = userSignal();
            if (currentUser) {
              userSignal.set({ ...currentUser, hasStore: !currentUser.hasStore });
            }
          });

          TestBed.configureTestingModule({
            imports: [MyStoreComponent],
            providers: [
              { provide: UserService, useValue: userServiceSpy },
              provideRouter([])
            ]
          });

          const fixture = TestBed.createComponent(MyStoreComponent);
          const component = fixture.componentInstance;
          fixture.detectChanges();

          const compiled = fixture.nativeElement;
          const initialHasStore = userData.hasStore;

          // Check initial state
          if (initialHasStore) {
            expect(compiled.querySelector('app-store-sidebar')).toBeTruthy();
            expect(compiled.querySelector('.content-card')).toBeTruthy();
          } else {
            expect(compiled.querySelector('app-profile-sidebar')).toBeTruthy();
            expect(compiled.querySelector('.create-store-section')).toBeTruthy();
          }

          // Toggle store status
          component.createStore();
          fixture.detectChanges();

          // Property: After toggle, the UI should reflect the new state
          const newHasStore = !initialHasStore;
          if (newHasStore) {
            expect(compiled.querySelector('app-store-sidebar')).toBeTruthy();
            expect(compiled.querySelector('.content-card')).toBeTruthy();
            expect(compiled.querySelector('app-profile-sidebar')).toBeFalsy();
            expect(compiled.querySelector('.create-store-section')).toBeFalsy();
          } else {
            expect(compiled.querySelector('app-profile-sidebar')).toBeTruthy();
            expect(compiled.querySelector('.create-store-section')).toBeTruthy();
            expect(compiled.querySelector('app-store-sidebar')).toBeFalsy();
            expect(compiled.querySelector('.content-card')).toBeFalsy();
          }
          
          // Cleanup
          fixture.destroy();
        }
      ),
      { numRuns: 20 }
    );
  });
});

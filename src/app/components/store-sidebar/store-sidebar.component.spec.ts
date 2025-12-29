import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreSidebarComponent } from './store-sidebar.component';
import { UserService } from '../../services/user.service';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';

describe('StoreSidebarComponent', () => {
  let component: StoreSidebarComponent;
  let fixture: ComponentFixture<StoreSidebarComponent>;
  let userService: jasmine.SpyObj<UserService>;

  beforeEach(async () => {
    const userServiceSpy = jasmine.createSpyObj('UserService', [], {
      currentUser: signal({
        id: '1',
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser',
        email: 'test@example.com',
        gender: 'Male',
        phoneNumber: '+84 123 456 789',
        avatarUrl: 'https://example.com/avatar.jpg',
        joinDate: '2023',
        hasStore: true,
        addresses: [],
        defaultAddressId: undefined
      })
    });

    await TestBed.configureTestingModule({
      imports: [StoreSidebarComponent],
      providers: [
        { provide: UserService, useValue: userServiceSpy },
        provideRouter([])
      ]
    }).compileComponents();

    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    fixture = TestBed.createComponent(StoreSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display store name and username', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.store-name')?.textContent).toContain("Test's Store");
    expect(compiled.querySelector('.store-username')?.textContent).toContain('@testuser');
  });

  it('should have 9 menu items', () => {
    expect(component.menuItems.length).toBe(9);
  });

  it('should have 3 operations menu items', () => {
    expect(component.operationsItems.length).toBe(3);
    expect(component.operationsItems[0].label).toBe('Vận chuyển');
    expect(component.operationsItems[1].label).toBe('Quản lý Đơn hàng');
    expect(component.operationsItems[2].label).toBe('Quản lý Sản phẩm');
  });

  it('should have 4 analytics menu items', () => {
    expect(component.analyticsItems.length).toBe(4);
    expect(component.analyticsItems[0].label).toBe('Thống kê');
    expect(component.analyticsItems[1].label).toBe('Doanh thu');
    expect(component.analyticsItems[2].label).toBe('Phát triển');
    expect(component.analyticsItems[3].label).toBe('Chăm sóc Khách hàng');
  });

  it('should have 2 management menu items', () => {
    expect(component.managementItems.length).toBe(2);
    expect(component.managementItems[0].label).toBe('Cài đặt Cửa hàng');
    expect(component.managementItems[1].label).toBe('Nguồn lực');
  });

  it('should mark active route correctly', () => {
    component.activeRoute = '/my-store/orders';
    expect(component.isActive('/my-store/orders')).toBe(true);
    expect(component.isActive('/my-store/products')).toBe(false);
  });

  it('should render all menu sections', () => {
    const compiled = fixture.nativeElement;
    const sections = compiled.querySelectorAll('.menu-section');
    expect(sections.length).toBe(3);
    
    const headers = compiled.querySelectorAll('.section-header');
    expect(headers[0].textContent).toContain('HOẠT ĐỘNG');
    expect(headers[1].textContent).toContain('PHÂN TÍCH & TĂNG TRƯỞNG');
    expect(headers[2].textContent).toContain('QUẢN TRỊ');
  });

  it('should have correct routes for all menu items', () => {
    const expectedRoutes = [
      '/my-store/shipping',
      '/my-store/orders',
      '/my-store/products',
      '/my-store/analytics',
      '/my-store/revenue',
      '/my-store/growth',
      '/my-store/customer-care',
      '/my-store/settings',
      '/my-store/resources'
    ];

    const actualRoutes = component.menuItems.map(item => item.route);
    expect(actualRoutes).toEqual(expectedRoutes);
  });
});

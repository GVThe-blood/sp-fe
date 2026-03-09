import { TestBed } from '@angular/core/testing';
import { Router, NavigationEnd, provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let routerEventsSubject: Subject<NavigationEnd>;

  const createMockRouter = (initialUrl: string) => ({
    events: routerEventsSubject.asObservable(),
    url: initialUrl,
  });

  beforeEach(async () => {
    routerEventsSubject = new Subject<NavigationEnd>();
  });

  const setupTestBed = async (initialUrl: string) => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        { provide: Router, useValue: createMockRouter(initialUrl) }
      ],
    }).compileComponents();
  };

  it('should create the app', async () => {
    await setupTestBed('/');
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'springfood' title`, async () => {
    await setupTestBed('/');
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('springfood');
  });

  it('should render router outlet', async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });

  /**
   * Unit tests for conditional header/footer rendering
   * Validates: Requirements 3.1, 3.2
   */
  describe('showHeaderFooter conditional rendering', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      routerEventsSubject = new Subject<NavigationEnd>();
    });

    it('should show header/footer on home route', async () => {
      await setupTestBed('/');
      const fixture = TestBed.createComponent(AppComponent);
      const app = fixture.componentInstance;
      expect(app.showHeaderFooter).toBe(true);
    });

    it('should hide header/footer on login route', async () => {
      await setupTestBed('/login');
      const fixture = TestBed.createComponent(AppComponent);
      const app = fixture.componentInstance;
      expect(app.showHeaderFooter).toBe(false);
    });

    it('should hide header/footer on register route', async () => {
      await setupTestBed('/register');
      const fixture = TestBed.createComponent(AppComponent);
      const app = fixture.componentInstance;
      expect(app.showHeaderFooter).toBe(false);
    });

    it('should show header/footer on store detail route', async () => {
      await setupTestBed('/store/123');
      const fixture = TestBed.createComponent(AppComponent);
      const app = fixture.componentInstance;
      expect(app.showHeaderFooter).toBe(true);
    });

    it('should update showHeaderFooter when navigating to login', async () => {
      await setupTestBed('/');
      const fixture = TestBed.createComponent(AppComponent);
      const app = fixture.componentInstance;
      expect(app.showHeaderFooter).toBe(true);

      // Simulate navigation to login
      routerEventsSubject.next(new NavigationEnd(1, '/login', '/login'));
      expect(app.showHeaderFooter).toBe(false);
    });

    it('should update showHeaderFooter when navigating from login to home', async () => {
      await setupTestBed('/login');
      const fixture = TestBed.createComponent(AppComponent);
      const app = fixture.componentInstance;
      expect(app.showHeaderFooter).toBe(false);

      // Simulate navigation to home
      routerEventsSubject.next(new NavigationEnd(1, '/', '/'));
      expect(app.showHeaderFooter).toBe(true);
    });
  });
});

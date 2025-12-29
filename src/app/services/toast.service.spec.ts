import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add a toast when show is called', (done) => {
    service.toasts$.subscribe(toasts => {
      if (toasts.length > 0) {
        expect(toasts.length).toBe(1);
        expect(toasts[0].message).toBe('Test message');
        expect(toasts[0].type).toBe('success');
        done();
      }
    });

    service.show('Test message', 'success');
  });

  it('should auto-dismiss toast after duration', (done) => {
    service.show('Test message', 'info', 100);

    setTimeout(() => {
      service.toasts$.subscribe(toasts => {
        expect(toasts.length).toBe(0);
        done();
      });
    }, 150);
  });

  it('should dismiss specific toast by id', (done) => {
    service.show('Toast 1', 'info', 5000);
    service.show('Toast 2', 'info', 5000);

    setTimeout(() => {
      service.toasts$.subscribe(toasts => {
        if (toasts.length === 2) {
          const firstToastId = toasts[0].id;
          service.dismiss(firstToastId);
          
          setTimeout(() => {
            service.toasts$.subscribe(remainingToasts => {
              expect(remainingToasts.length).toBe(1);
              expect(remainingToasts[0].message).toBe('Toast 2');
              done();
            });
          }, 10);
        }
      });
    }, 10);
  });

  it('should clear all toasts', (done) => {
    service.show('Toast 1', 'info', 5000);
    service.show('Toast 2', 'info', 5000);
    service.show('Toast 3', 'info', 5000);

    setTimeout(() => {
      service.clearAll();
      service.toasts$.subscribe(toasts => {
        expect(toasts.length).toBe(0);
        done();
      });
    }, 10);
  });
});

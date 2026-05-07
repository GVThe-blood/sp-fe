import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoreAnalyticsComponent } from './store-analytics.component';

describe('StoreAnalyticsComponent', () => {
  let component: StoreAnalyticsComponent;
  let fixture: ComponentFixture<StoreAnalyticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoreAnalyticsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StoreAnalyticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

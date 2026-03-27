import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublisherDashboardComponent } from './dashboard.component';

describe('PublisherDashboardComponent', () => {
  let component: PublisherDashboardComponent;
  let fixture: ComponentFixture<PublisherDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublisherDashboardComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(PublisherDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

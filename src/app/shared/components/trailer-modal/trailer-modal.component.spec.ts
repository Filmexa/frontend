import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrailerModalComponent } from './trailer-modal.component';

describe('TrailerModalComponent', () => {
  let component: TrailerModalComponent;
  let fixture: ComponentFixture<TrailerModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrailerModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrailerModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

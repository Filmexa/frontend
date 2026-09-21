import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActorRowComponent } from './actor-row.component';

describe('ActorRowComponent', () => {
  let component: ActorRowComponent;
  let fixture: ComponentFixture<ActorRowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActorRowComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActorRowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

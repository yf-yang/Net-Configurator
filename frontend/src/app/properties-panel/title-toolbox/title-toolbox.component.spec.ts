import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TitleToolboxComponent } from './title-toolbox.component';

describe('TitleToolboxComponent', () => {
  let component: TitleToolboxComponent;
  let fixture: ComponentFixture<TitleToolboxComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TitleToolboxComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TitleToolboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

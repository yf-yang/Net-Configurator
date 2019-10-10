import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditPortsDialogComponent } from './edit-ports-dialog.component';

describe('EditPortsDialogComponent', () => {
  let component: EditPortsDialogComponent;
  let fixture: ComponentFixture<EditPortsDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditPortsDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditPortsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

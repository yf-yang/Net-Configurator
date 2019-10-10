import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditReceiverDialogComponent } from './edit-receiver-dialog.component';

describe('EditReceiverDialogComponent', () => {
  let component: EditReceiverDialogComponent;
  let fixture: ComponentFixture<EditReceiverDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditReceiverDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditReceiverDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

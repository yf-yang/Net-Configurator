import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LinkConnectionDialogComponent } from './link-connection-dialog.component';

describe('LinkConnectionDialogComponent', () => {
  let component: LinkConnectionDialogComponent;
  let fixture: ComponentFixture<LinkConnectionDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LinkConnectionDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LinkConnectionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

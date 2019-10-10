import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NetEdgePanelComponent } from './net-edge-panel.component';

describe('NetEdgePanelComponent', () => {
  let component: NetEdgePanelComponent;
  let fixture: ComponentFixture<NetEdgePanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NetEdgePanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NetEdgePanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

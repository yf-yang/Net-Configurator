import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NetNodePanelComponent } from './net-node-panel.component';

describe('NetNodePanelComponent', () => {
  let component: NetNodePanelComponent;
  let fixture: ComponentFixture<NetNodePanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NetNodePanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NetNodePanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

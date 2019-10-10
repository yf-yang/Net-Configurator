import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NetTopologyDataSaveComponent } from './net-topology-data-save.component';

describe('NetTopologyDataSaveComponent', () => {
  let component: NetTopologyDataSaveComponent;
  let fixture: ComponentFixture<NetTopologyDataSaveComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NetTopologyDataSaveComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NetTopologyDataSaveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

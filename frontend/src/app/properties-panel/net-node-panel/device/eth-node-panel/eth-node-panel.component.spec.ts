import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EthNodePanelComponent } from './eth-node-panel.component';

describe('EthNodePanelComponent', () => {
  let component: EthNodePanelComponent;
  let fixture: ComponentFixture<EthNodePanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EthNodePanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EthNodePanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

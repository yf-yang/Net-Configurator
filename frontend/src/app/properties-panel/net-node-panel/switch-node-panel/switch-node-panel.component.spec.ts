import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SwitchNodePanelComponent } from './switch-node-panel.component';

describe('SwitchNodePanelComponent', () => {
  let component: SwitchNodePanelComponent;
  let fixture: ComponentFixture<SwitchNodePanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SwitchNodePanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SwitchNodePanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

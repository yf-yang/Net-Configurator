import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { SidepanelService } from './sidepanel.service';
import { ToolbarModel } from '../shared/models/toolbar/toolbar-model';

@Component({
  selector: 'app-sidepanel',
  templateUrl: './sidepanel.component.html',
  styleUrls: ['./sidepanel.component.scss']
})
export class SidepanelComponent implements OnInit, OnDestroy {

  public genericToolbars: ToolbarModel[];
  private subscriptions: Subscription = new Subscription();

  constructor(
    private sidepanelService: SidepanelService
  ) {}

  ngOnInit() {
    this.genericToolbars = [];

    this.subscriptions.add(this.sidepanelService.getToolbars()
      .subscribe(
        data => {
          setTimeout(() => {
            this.genericToolbars = data;
          });
        },
        error => console.error('Error loading toolbars:', error)
      )
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

}

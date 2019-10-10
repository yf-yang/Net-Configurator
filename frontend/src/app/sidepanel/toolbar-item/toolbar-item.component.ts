import { Component, OnInit, Input } from '@angular/core';
import { ToolbarItemModel } from '../../shared/models/toolbar/toolbar-item-model';

@Component({
  selector: 'app-toolbar-item',
  templateUrl: './toolbar-item.component.html',
  styleUrls: ['./toolbar-item.component.scss']
})
export class ToolbarItemComponent implements OnInit {

  @Input() item: ToolbarItemModel;

  constructor() { }

  ngOnInit() {
  }

}

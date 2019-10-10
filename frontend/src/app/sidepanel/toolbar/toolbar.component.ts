import { Component, OnInit, Input } from '@angular/core';
import { ToolbarItemModel } from '../../shared/models/toolbar/toolbar-item-model';
import { DragAndDropService } from '../../shared/common/drag-and-drop.service';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent implements OnInit {

  @Input()
  title: string;

  @Input()
  icon: string;

  @Input()
  items: ToolbarItemModel[];

  constructor(
    private dragAndDropService: DragAndDropService
  ) { }

  ngOnInit() {
  }

  dragStart(e: DragEvent, item: ToolbarItemModel) {
    this.dragAndDropService.setDraggedItem(item, e);
  }

  dragStop() {
    this.dragAndDropService.stopDragging();
  }

}

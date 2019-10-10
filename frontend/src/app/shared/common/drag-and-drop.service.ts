import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { DragItemModel } from '../models/drag-item-model';
import { ToolbarItemModel } from '../models/toolbar/toolbar-item-model';

import { CoreService } from '../core.service';
import { DataService } from '../data.service';

@Injectable()
export class DragAndDropService {

  private draggedItem: DragItemModel = null;
  public isDraggingSubject: Subject<boolean> = new Subject<boolean>();

  constructor(
    private coreService: CoreService,
    private dataService: DataService
  ) { }

  public getDraggedItem(): DragItemModel {
    const item = this.draggedItem;
    this.draggedItem = null;
    return item;
  }

  public setDraggedItem(item: ToolbarItemModel, e: DragEvent) {
    this.draggedItem = new DragItemModel(this.coreService, this.dataService, item, e);

    this.isDraggingSubject.next(true);
  }

  public stopDragging() {
    this.isDraggingSubject.next(false);
  }
}

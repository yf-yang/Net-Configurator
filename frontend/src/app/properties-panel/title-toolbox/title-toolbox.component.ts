import { Component, Input, OnInit, ElementRef } from '@angular/core';
import { EditPropertiesDialogComponent } from '../edit-properties-dialog/edit-properties-dialog.component';
import { ClrDatagrid } from '@clr/angular';

@Component({
  selector: 'app-title-toolbox',
  templateUrl: './title-toolbox.component.html',
  styleUrls: ['./title-toolbox.component.scss']
})
export class TitleToolboxComponent implements OnInit {

  public collapsed: boolean;
  private el: ElementRef;

  @Input()
  title: string;

  @Input()
  addProperty: any;

  @Input()
  editProperty: any;

  @Input()
  editDialog: EditPropertiesDialogComponent;

  @Input()
  showAdd: boolean;

  @Input()
  showEdit: boolean;

  @Input()
  showDelete: boolean;

  @Input()
  active: boolean;

  @Input()
  isError: boolean;

  @Input()
  collapse: any;

  @Input()
  disabledED: boolean;

  constructor() { }

  ngOnInit() {
    this.collapsed = true;

    if (this.isCollapsive()) {
      this.initElementRef();
    }
  }

  newItemDialogOpen () {
    this.editDialog.dialogControl('new');
  }

  editItemDialogOpen () {
    this.editDialog.dialogControl('edit', this.editProperty);
  }

  removeItem() {
    this.editDialog.dialogControl('remove', this.editProperty);
  }

  public areControlsShown(): boolean {
    return this.showAdd || this.showEdit || this.showDelete;
  }

  public initElementRef() {
    if (this.collapse instanceof ClrDatagrid) {
      this.el = this.collapse['el'] as ElementRef;
    } else {
      this.el = this.collapse;
    }

    this.el.nativeElement.classList.add('collapsible-block');
  }

  public toggleCollapse() {
    if (!this.isCollapsive()) {
      return;
    }

    if (this.collapsed) {
      this.el.nativeElement.style.height = 'auto';
    } else {
      this.el.nativeElement.style.height = '0px';
    }

    this.collapsed = !this.collapsed;
  }

  public isCollapsive(): boolean {
    return this.collapse;
  }
}

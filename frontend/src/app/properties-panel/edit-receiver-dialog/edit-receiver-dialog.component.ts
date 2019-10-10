import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { EditPropertiesDialogComponent } from '../edit-properties-dialog/edit-properties-dialog.component';
import { TopologyService } from '../../topology/topology.service';
import { NetNodeDataModel } from '../../topology/net-topology-data/net-node-data-model';

@Component({
  selector: 'app-edit-receiver-dialog',
  templateUrl: './edit-receiver-dialog.component.html',
  styleUrls: ['./edit-receiver-dialog.component.scss']
})
export class EditReceiverDialogComponent extends EditPropertiesDialogComponent implements OnInit, OnChanges {

  @Input()
  item: any;

  @Input()
  itemsArray: [any];

  public receivers: [string];
  public nodeArray: NetNodeDataModel[];

  constructor(
    private topologyService: TopologyService
  ) {
    super();
  }

  ngOnInit() {
    this.nodeArray = this.topologyService.getTopologyData().getAllTopologyNodes();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.item && !changes.item.currentValue) {
      this.item = '';
    }
  }

  setItem(value: string, item?: any) {
    if (value === 'edit') {
      this.item = item;
      this.receivers = this.item.receiverNames.map(r => r);
    }
  }

  saveItem() {
    this.item.receiverNames = this.receivers;
    this.dialogControl('close');
    this.itemEdited.emit();
  }

  removeItem(item: string) {

  }

}

import { Input, Output, EventEmitter } from '@angular/core';
import { MessageModel } from '../../shared/models/messages/message-model';
import { NetNodeDataModel } from '../../topology/net-topology-data/net-node-data-model';
import { IpMessageModel } from '../../shared/models/messages/ip-message-model';
import { MessageDestination } from '../../shared/interfaces/messages/message-destination';

export abstract class EditPropertiesDialogComponent {
  @Input()
  item: any;

  @Input()
  itemsArray: [any];

  @Output()
  itemEdited = new EventEmitter();

  @Output()
  itemAdded = new EventEmitter();

  public isEditPropertiesDialogOpen: boolean;

  public submitMethod: string;

  constructor() {
  }

  addItem() {
    this.itemsArray.push(this.item);
    this.dialogControl('close');
    this.itemAdded.emit(this.item);
  }

  editItem(item: MessageModel, key: string, originalItemId: string, node: NetNodeDataModel, port: number) {
    if (item.getDestinationAddressMethod() === 'UNICAST') {
      const dstData: MessageDestination = {
        nodes: [node],
        address_method: 'UNICAST'
      };

      item.setDestination(dstData);
    }

    if (item instanceof IpMessageModel) {
      item.destination.port = port;
    }

    const itemIndex = this.itemsArray.findIndex(i => i[key] === originalItemId);
    this.itemsArray[itemIndex].setData(item);
    this.dialogControl('close', item);
    this.itemEdited.emit();
  }

  dialogControl(value: string, item?: any): void {
    this.isEditPropertiesDialogOpen = ['new', 'edit'].includes(value) ? true : false;

    if (value !== 'close') {
      this.submitMethod = value;
      this.setItem(value, item);
    }

    if (value === 'remove') {
      this.removeItem(item);
    }
  }

  abstract setItem(value: string, item?: any): void;

  abstract removeItem(item?: any): void;


}

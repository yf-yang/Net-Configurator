import { NetItemsExtrasModel } from '../net-items-extras-model';
import { ValidationErrorModel } from '../../validation/validation-error-model';
import { MessageData } from '../../interfaces/message-data';
import { NetNodeDataModel } from '../../../topology/net-topology-data/net-node-data-model';
import { MessageDestination } from '../../interfaces/messages/message-destination';

export abstract class MessageModel extends NetItemsExtrasModel implements MessageData {

  public id: string;
  public name: string;
  public bandwidth: number;
  public priority: number;
  public srcNode: NetNodeDataModel;
  public dstNodes: NetNodeDataModel[];
  public max_jitter: number;
  public max_latency: number;

  public abstract copyObject(): any;
  public abstract setSource(node: NetNodeDataModel): void;
  public abstract setDestination(data: MessageDestination): void;
  public abstract extractBasicData(): any;
  public abstract getSourceId(): string;
  public abstract getDestinationAddressMethod(): 'UNICAST' | 'MULTICAST';
  public abstract getMulticastGroupId(): string;
  public abstract getDestinationDeviceIds(): string[];
  public abstract getRawDestinationDeviceId(): string;

  constructor(data?: MessageData) {
    super();

    this.dstNodes = [];

    if (data) {
      this.setData(data);
    }
  }

  public setData(data: MessageData) {
    Object.keys(data).forEach(
      key => {
        this[key] = data[key];
      }
    );
  }

  public getDestinationIds(): string[] {
    return this.dstNodes.map(n => n.id);
  }

  public validate(rules: any): ValidationErrorModel[] {
    return [];
  }

  public setErrorStyle(isError: boolean): void {
  }

}

import { MessageModel } from './message-model';
import { IpMessageData } from '../../interfaces/messages/ip-message-data';
import { NetNodeDataModel } from '../../../topology/net-topology-data/net-node-data-model';
import { IpMessageSource } from '../../interfaces/messages/ip/ip-message-source';
import { IpMessageDestination } from '../../interfaces/messages/ip/ip-message-destination';

export class IpMessageModel extends MessageModel implements IpMessageData {

  public source: IpMessageSource;
  public destination: IpMessageDestination;
  public protocol: string;
  public VLAN: string;
  public COS: string;
  public length: number;
  public frequency: number;
  public bandwidth: number;

  constructor(data?: IpMessageData) {
    super(data);

    this.init();

    if (data) {
      Object.keys(data).forEach(key => {
        this[key] = data[key];
      });
    }
  }

  public copyObject(): IpMessageModel {
    return new IpMessageModel(this);
  }

  public setSource(node: NetNodeDataModel) {
    this.source.device = node.id;
    this.srcNode = node;
  }

  public setDestination(data: IpMessageDestination) {
    this.destination.address_method = data.address_method;
    this.dstNodes = data.nodes;
    this.destination.port = data.port;

    if (data.address_method === 'UNICAST') {
      this.destination.device = data.nodes[0].id;
    } else {
      this.destination.multicast_group = data.multicast_group;
    }
  }

  public extractBasicData(): IpMessageData {
    return <IpMessageData>{
      COS: this.COS,
      VLAN: this.VLAN,
      destination: this.destination,
      frequency: this.frequency,
      length: this.length,
      name: this.name,
      protocol: this.protocol,
      source: this.source,
      bandwidth: this.bandwidth,
      max_latency: this.max_latency,
      max_jitter: this.max_jitter
    };
  }

  public getDestinationDeviceIds(): string[] {
    return this.dstNodes.map(dn => dn.id);
  }

  public getRawDestinationDeviceId(): string {
    return this.destination.device;
  }

  public getSourceId(): string {
    return this.source.device;
  }

  public getDestinationAddressMethod(): 'UNICAST' | 'MULTICAST' {
    return this.destination.address_method;
  }

  public getMulticastGroupId(): string {
    return this.destination.multicast_group;
  }

  private init() {
    this.source = {
      device: '',
      port: 0
    };

    this.destination = {
      address_method: 'UNICAST',
      // device: '',
      port: 0
    };
  }
}

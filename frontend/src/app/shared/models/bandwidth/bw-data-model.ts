import { BwData } from '../../interfaces/bandwidth/bw-data';
import { BwTrafficData } from '../../interfaces/bandwidth/bw-traffic-data';
import { NetNodeDataModel } from '../../../topology/net-topology-data/net-node-data-model';
import { MessageModel } from '../messages/message-model';

export class BwDataModel implements BwData {

  public bandwidth: number;
  public traffic: BwTrafficData[];
  public from: string;
  public to: string;
  public fromNode: NetNodeDataModel;
  public toNode: NetNodeDataModel;

  constructor(data: BwData) {
    this.bandwidth = data.bandwidth;
    this.from = data.from;
    this.to = data.to;
    this.traffic = data.traffic.map((t: any) => {
      return {
        bandwidth: t.bandwidth,
        trafficId: t.ID
      };
    });
  }

  public setNodes(fromNode: NetNodeDataModel, toNode: NetNodeDataModel) {
    this.fromNode = fromNode;
    this.toNode = toNode;
  }

  public isBandwidthOverload(speed: number): boolean {
    return this.bandwidth > speed;
  }

}

import { NetNodeDataModel } from '../../../topology/net-topology-data/net-node-data-model';

export interface EdgeData {
  id: string;
  fromNodeObj: NetNodeDataModel;
  toNodeObj: NetNodeDataModel;
  speed?: number;
  protocol?: string;
  bandwidth?: number;
}

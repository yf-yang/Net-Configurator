import { NetNodeDataModel } from '../../../../topology/net-topology-data/net-node-data-model';

export interface NodeClickEvent {
  netNode: NetNodeDataModel;
  svgNode: any;
}

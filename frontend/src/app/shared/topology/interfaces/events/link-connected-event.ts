import { NetNodeDataModel } from '../../../../topology/net-topology-data/net-node-data-model';
import { NetEdgeDataModel } from '../../../../topology/net-topology-data/net-edge-data-model';
import { LinkControlNodeModel } from '../../../../topology/net-topology-data/nodes/link-control-node-model';

export interface LinkConnectedEvent {
  node: NetNodeDataModel;
  controlNode: LinkControlNodeModel;
  link: NetEdgeDataModel;
  portId?: string;
}

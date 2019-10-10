import { TopologyNodeDataModel } from './topology-node-data-model';
import { TopologyEdgeDataModel } from './topology-edge-data-model';

/**
 * Interface defining model for storing data for topology visualiser
 */
export interface TopologyDataModel {

  nodes: TopologyNodeDataModel[];
  links: TopologyEdgeDataModel[];

  getNodeById(nodeId: string): TopologyNodeDataModel;
  getLinksByNodes(node1: TopologyNodeDataModel, node2: TopologyNodeDataModel): any[];

}

import { NetEdgeDataModel } from '../../../../topology/net-topology-data/net-edge-data-model';

export interface LinkClickEvent {
  netLink: NetEdgeDataModel;
  svgLink: any;
}

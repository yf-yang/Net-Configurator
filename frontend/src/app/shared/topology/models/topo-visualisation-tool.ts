import { TopologyDataModel } from './topology-data-model';

export interface TopoVisualisationTool {

  topologyData: TopologyDataModel;

  setData(data: TopologyDataModel): void;

}

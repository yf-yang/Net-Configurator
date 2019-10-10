import { PortData } from '../interfaces/port-data';
import { NetNodeDataModel } from '../../topology/net-topology-data/net-node-data-model';
import { NetEdgeDataModel } from '../../topology/net-topology-data/net-edge-data-model';

export class PortModel implements PortData {
  public link: NetEdgeDataModel;
  public connectedNode: NetNodeDataModel;

  public bandwidth: number;
  public id: string;
  public portType: string;

  constructor(port: PortData) {
    this.link = null;
    this.bandwidth = port.bandwidth;
    this.portType = port.portType;
    this.id = port.id;
  }

  public setData(link: NetEdgeDataModel, node: NetNodeDataModel) {
    this.link = link;
    this.connectedNode = node;
  }

  public setConnectedNodeData(node: NetNodeDataModel) {
    this.connectedNode = node;
  }

  public setConnectedLinkData(link: NetEdgeDataModel) {
    this.link = link;
  }

  public resetLinkData() {
    this.link = null;
    this.connectedNode = null;
  }

  public copyObject(): PortModel {
    const retVal = new PortModel(this);
    retVal.setData(this.link, this.connectedNode);

    return retVal;
  }

  public getNodeId() {
    return this.connectedNode ? this.connectedNode.id : null;
  }

  public getNodeLabel() {
    return this.connectedNode ? this.connectedNode.label : null;
  }

  public getLinkId() {
    return this.link ? this.link.id : null;
  }

}

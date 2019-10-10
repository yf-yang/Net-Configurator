import { TopologyNodeDataModel } from '../../shared/topology/models/topology-node-data-model';
import { DragItemModel } from '../../shared/models/drag-item-model';
import { NetItemsExtrasModel } from '../../shared/models/net-items-extras-model';

import { TopologyType } from '../../shared/topology/types/topology-type';
import { NodeData } from '../../shared/topology/interfaces/node-data';
import { PortModel } from '../../shared/models/port-model';
import { NetEdgeDataModel } from './net-edge-data-model';
import { PortData } from '../../shared/interfaces/port-data';

export abstract class NetNodeDataModel extends NetItemsExtrasModel implements TopologyNodeDataModel, NodeData {

  public id: string;
  public label: string;
  public group: string;

  public icon: string;
  public iconWidth: number;
  public iconHeight: number;
  public x: number;
  public y: number;
  public type: TopologyType;
  public ports: PortModel[];
  public category: string;

  public abstract saveData(): any;

  constructor(data?: NodeData) {
    super();

    this.id = '';
    this.label = '';
    this.group = '';
    this.icon = '';
    this.iconWidth = 0;
    this.iconHeight = 0;
    this.x = 0;
    this.y = 0;
    this.type = '';
    this.ports = [];
    this.category = '';

    if (data) {
      this.setData(data);
    }
  }

  public setData(data: NodeData): void {
    Object.keys(data).forEach(
      key => {
        this[key] = data[key];
      }
    );
  }

  /** To be deprecated - use constructor instead */
  public setDataFromDragItem(data: DragItemModel, type: TopologyType, position: {x: number, y: number}) {
    this.id = data.id;
    this.label = data.title;
    this.icon = data.icon;
    this.iconHeight = data.iconHeight;
    this.iconWidth = data.iconWidth;
    this.type = type;
    this.x = position.x;
    this.y = position.y;
  }

  public setErrorStyle(isError: boolean) {
    this.icon = this.getIcon(this.icon, isError);
  }

  public createPorts(ports: PortData[]) {
    this.ports = ports.map(port => new PortModel(port));
  }

  public setPorts(ports: PortModel[]) {
    this.ports = ports;
  }

  public getEmptyPorts(): PortModel[] {
    return this.ports.filter(port => port.link === null);
  }

  public connectLinkToPort(link: NetEdgeDataModel, portId: string) {
    const port = this.ports.find(p => p.id === portId);
    port.setConnectedLinkData(link);
  }

  public setPortNode(link: NetEdgeDataModel, node: NetNodeDataModel) {
    const port = this.getPortByLinkId(link.id);

    port.setConnectedNodeData(node);
  }

  public disconnectLink(linkId: string) {
    const port = this.getPortByLinkId(linkId);

    if (port) {
      port.resetLinkData();
    }
  }

  public getLinkPortId(linkId: string): string {
    return this.getPortByLinkId(linkId).id;
  }

  public getPortByLinkId(linkId: string): PortModel {
    return this.ports.find(p => {
      if (p.link) {
        return p.link.id === linkId;
      }

      return false;
    });
  }

}

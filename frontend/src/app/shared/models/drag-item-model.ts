import { ToolbarItemModel } from './toolbar/toolbar-item-model';
import { NetTopologyDataModel } from '../../topology/net-topology-data/net-topology-data-model';
import { NetEdgeDataModel } from '../../topology/net-topology-data/net-edge-data-model';

import { SwitchModel } from 'src/app/topology/net-topology-data/nodes/switch-model';
import { LinkControlNodeModel } from 'src/app/topology/net-topology-data/nodes/link-control-node-model';

import { CoreService } from '../core.service';

import { IconSizes } from '../constants/icon-sizes';
import { NetNodeDataModel } from 'src/app/topology/net-topology-data/net-node-data-model';
import { EdgeData } from '../topology/interfaces/edge-data';
import { DataService } from '../data.service';
import { NodeDataQuery } from '../interfaces/data/node-data-query';
import { Observable } from 'rxjs';
import { CommonDeviceModel } from '../../topology/net-topology-data/nodes/deviceNodes/common-device-model';
import { SwitchData } from '../topology/interfaces/nodes/switch-data';
import { NodeData } from '../topology/interfaces/node-data';
import { EthDeviceData } from '../topology/interfaces/nodes/eth-device-data';
import { NodeProfileData } from '../interfaces/node-profile-data';

export class DragItemModel extends ToolbarItemModel {

  iconWidth: number;
  iconHeight: number;
  cursorOffsetX: number;
  cursorOffsetY: number;

  constructor(
    private coreService: CoreService,
    private dataService: DataService,
    toolbarItem: ToolbarItemModel,
    e: DragEvent
  ) {
    super(toolbarItem);

    const target: any = e.target;
    const domRect = target.getBoundingClientRect();

    this.iconWidth = this.isDEVICE() ? IconSizes.DEVICE_SIZE : target.clientWidth;
    this.iconHeight = this.isDEVICE() ? IconSizes.DEVICE_SIZE : target.clientHeight;
    this.cursorOffsetX = e.pageX - domRect.left;
    this.cursorOffsetY = e.pageY - domRect.top;
  }

  /**
   * Aggregated method for creating various objects from dragged item
   */
  createTopologyItem(position: { x: number, y: number }): Observable<NetTopologyDataModel> {
      return this[this.createMethod](position, this);
  }

  /**
   * Create link with two nodes (drag handlers) from dragged toolbar icon
   */
  private createLink(position: { x: number, y: number }, droppedIdem: DragItemModel): Observable<NetTopologyDataModel> {
    return new Observable<NetTopologyDataModel>(
      observer => {
        const retVal = new NetTopologyDataModel();

        droppedIdem.iconWidth = 14;
        droppedIdem.iconHeight = 14;
        droppedIdem.icon = '/assets/images/links/white-point.svg';
        droppedIdem.title = '';

        const droppedItemFrom = Object.assign({}, droppedIdem);
        droppedItemFrom.id = this.coreService.generateRandomString(5);

        const nodeFrom = new LinkControlNodeModel();
        nodeFrom.setDataFromDragItem(droppedItemFrom, 'link-drag-from', {x: position.x + IconSizes.ROUTER_SIZE, y: position.y});
        nodeFrom.isValidable = false;

        const droppedItemTo = Object.assign({}, droppedIdem);
        droppedItemTo.id = this.coreService.generateRandomString(5);

        const nodeTo = new LinkControlNodeModel();
        nodeTo.setDataFromDragItem(droppedItemTo, 'link-drag-to', {x: position.x, y: position.y + IconSizes.ROUTER_SIZE});
        nodeTo.isValidable = false;

        const edgeData: EdgeData = {
          id: this.coreService.generateRandomString(5),
          fromNodeObj: nodeFrom,
          toNodeObj: nodeTo,
        };

        const link = new NetEdgeDataModel(edgeData);
        link.setClickable(false);
        link.setDashed(true);

        retVal.netLinks.push(link);
        retVal.netNodes.push(nodeFrom);
        retVal.netNodes.push(nodeTo);

        observer.next(retVal);
        observer.complete();
      }
    );
  }

  /**
   * Create node from dragged toolbar icon
   */
  private createNode(position: { x: number, y: number }, droppedItem: DragItemModel): Observable<NetTopologyDataModel> {
    return new Observable<NetTopologyDataModel>(
      observer => {
        const retVal = new NetTopologyDataModel();

        const nodeQuery: NodeDataQuery = {
          node_type: droppedItem.nodeType,
          model: droppedItem.model,
        };

        this.coreService.isWorkingSubject.next(true);
        this.dataService.createNode(nodeQuery, droppedItem.title).subscribe(
          res => {
            const newNode = this.createNodeModel(droppedItem, res, position);

            if (newNode.icon === '/assets/images/device/device.svg') {
              newNode.icon = '/assets/images/device/microchip.svg';
            }

            retVal.netNodes.push(newNode);
            this.coreService.isWorkingSubject.next(false);
            observer.next(retVal);
            observer.complete();
          },
          error => {
            this.coreService.isWorkingSubject.next(false);
            observer.error(error);
          }
        );
      }
    );
  }

  private createNodeModel(node: DragItemModel, profile: NodeProfileData, position: { x: number, y: number }): NetNodeDataModel {
    let newNode: NetNodeDataModel;

    const nodeData: NodeData = {
      id: profile.id,
      label: profile.name,
      icon: node.icon,
      iconWidth: node.iconWidth,
      iconHeight: node.iconHeight,
      type: 'topology-item',
      x: position.x,
      y: position.y
    };

    if (node.nodeType === 'SWITCH') {
      const data: SwitchData = Object.assign({
        IP: profile.IP,
        MAC: profile.MAC,
        role: profile.role
      }, nodeData);

      newNode = new SwitchModel(data);
    } else {
      const ethData: EthDeviceData = Object.assign({
        IP: profile.IP,
        MAC: profile.MAC,
        traffics: node.traffics
      }, nodeData);

      newNode = new CommonDeviceModel(ethData);
    }

    if (profile.ports && profile.ports.length) {
      newNode.createPorts(profile.ports);
    }

    return newNode;
  }

}

import { NetEdgeDataModel } from './net-edge-data-model';
import { NetNodeDataModel } from './net-node-data-model';

import { TopologyDataModel } from '../../shared/topology/models/topology-data-model';
import { TopologyNodeDataModel } from '../../shared/topology/models/topology-node-data-model';
import { TopologyEdgeDataModel } from '../../shared/topology/models/topology-edge-data-model';
import { ValidationErrorModel } from '../../shared/validation/validation-error-model';
import { ValidationError } from '../../shared/validation/validation-error.enum';
import { EthDeviceModel } from './nodes/eth-device-model';
import { MessageModel } from '../../shared/models/messages/message-model';
import { IpMessageModel } from '../../shared/models/messages/ip-message-model';
import { MulticastGroupModel } from '../../shared/models/messages/multicast-group-model';

export class NetTopologyDataModel implements TopologyDataModel {

  nodes: TopologyNodeDataModel[];
  links: TopologyEdgeDataModel[];

  netNodes: NetNodeDataModel[];
  netLinks: NetEdgeDataModel[];
  multicastGroups: MulticastGroupModel[];

  public getNodeById(nodeId: string): TopologyNodeDataModel {
    return this.nodes.filter(
      (node: TopologyNodeDataModel) => node.id === nodeId
    )[0];
  }

  public getLinksByNodes(node1: TopologyNodeDataModel, node2: TopologyNodeDataModel): any[] {
    return this.links.filter(
      (link: TopologyEdgeDataModel) => link.from === node1.id && link.to === node2.id
                                        || link.from === node2.id && link.to === node1.id
    );
  }

  public getNetNodeById(nodeId: string): NetNodeDataModel {
    return this.netNodes.filter(
      (node: NetNodeDataModel) => node.id === nodeId
    )[0];
  }

  public getNetNodeByName(nodeName: string): NetNodeDataModel {
    return this.netNodes.filter(
      (node: NetNodeDataModel) => node.label === nodeName.trim()
    )[0];
  }

  public getNetNodesByCluster(clusterId: string) {
    return this.netNodes.filter(node => node.group === clusterId);
  }

  public getNetLinksByNodes(node1: NetNodeDataModel, node2: NetNodeDataModel): NetEdgeDataModel[] {
    return this.netLinks.filter(
      (link: NetEdgeDataModel) => link.from === node1.id && link.to === node2.id
                                    || link.from === node2.id && link.to === node1.id
    );
  }

  public getNetLinksByNode(node: NetNodeDataModel): NetEdgeDataModel[] {
    return this.netLinks.filter(
      link => link.from === node.id || link.to === node.id
    );
  }

  public getNetLinkById(id: string): NetEdgeDataModel {
    return this.netLinks.filter(link => link.id === id)[0];
  }

  /**
   * Returns all Nodes of type 'topology-item'.
   */
  public getAllTopologyNodes(): NetNodeDataModel[] {
    return this.netNodes.filter(n => n.type === 'topology-item');
  }

  public getNeighboringLinks(node: NetNodeDataModel): Array<NetEdgeDataModel> {
    return this.netLinks.filter(link =>
      link.fromNodeObj === node || link.toNodeObj === node
    );
  }

  public getNeighboringNodes(node: NetNodeDataModel): Array<NetNodeDataModel> {
    const links = this.getNeighboringLinks(node);
    const nodes = [];

    links.forEach(link => {
      if (link.fromNodeObj === node) { nodes.push(link.toNodeObj); }
      if (link.toNodeObj === node) { nodes.push(link.fromNodeObj); }
    });

    return nodes;
  }

    /**
   * Return Net Node from signal information (reciever name)
   */
  public getNodeByKey(receiver: string, key: string = 'label'): NetNodeDataModel {
    let nodes = [];

    nodes = this.netNodes.filter(node => node[key] !== '');

    return nodes.filter(
      (node: NetNodeDataModel) => node[key].toUpperCase() === receiver.trim().toUpperCase()
      )[0];
  }

  public getAllDevices(): NetNodeDataModel[] {
    return this.netNodes.filter(n => n instanceof EthDeviceModel);
  }

  public removeMulticastGroupById(mgId: string) {
    this.multicastGroups.splice(this.multicastGroups.findIndex(mg => mg.id === mgId), 1);
  }

  public removeNetNodeByNode(node: NetNodeDataModel) {
    this.netNodes.splice(this.netNodes.findIndex(n => n.id === node.id), 1);
  }

  public removeNetLinkByLink(link: NetEdgeDataModel) {
    this.netLinks.splice(this.netLinks.indexOf(link), 1);
  }

  public removeNetLinksByNodeId(nodeId: string) {
    this.netLinks = this.netLinks.filter(
      link => {
        if (link.from === nodeId) {
          if (link.isConnected()) {
            link.toNodeObj.disconnectLink(link.id);
          } else {
            this.removeNetNodeByNode(link.toNodeObj);
          }
        } else {
          if (link.isConnected()) {
            link.fromNodeObj.disconnectLink(link.id);
          } else {
            this.removeNetNodeByNode(link.fromNodeObj);
          }
        }

        return (link.from !== nodeId && link.to !== nodeId);
      }
    );
  }

  public validateNetTopologyItems(rules: any): ValidationErrorModel[][] {
    const errors: ValidationErrorModel[][] = [];
    const ipErrors = this.checkUniqueProp('IP');
    const macErrors = this.checkUniqueProp('MAC');
    const uniqueErrors = ipErrors.concat(macErrors);

    Object.keys(rules).forEach(topologyItems => {
      this[topologyItems].forEach((item: NetNodeDataModel | NetEdgeDataModel) => {
        if (item.isValidable) {
          let itemErrors: ValidationErrorModel[] = [];

          itemErrors = item.validate(rules[topologyItems]);

          if (item instanceof NetNodeDataModel && uniqueErrors.length) {
            const itemUniqueErrors = uniqueErrors.filter(e => e.itemId === item.id);

            if (itemUniqueErrors) {
              itemErrors = itemErrors.concat(itemUniqueErrors);
            }
          }

          if (itemErrors.length) {
            itemErrors.forEach(error => item.setError(error));
            errors.push(itemErrors);
          }
        }
      });
    });

    return errors;
  }

  private checkUniqueProp(property: string): ValidationErrorModel[] {
    const errors: ValidationErrorModel[] = [];

    let nodes: NetNodeDataModel[] = [];
    const errorNodes: NetNodeDataModel[] = [];

    nodes = this.netNodes.filter(n => n.isValidable);

    nodes.sort((a, b) => {
      if (!a[property]) {
        return -1;
      }

      if (!b[property]) {
        return 1;
      }

      return a[property].localeCompare(b[property]);
    });

    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i + 1] && nodes[i][property] && nodes[i + 1][property]) {
        if (nodes[i][property] === nodes[i + 1][property]) {
          if (errorNodes[errorNodes.length - 1] !== nodes[i]) {
            errorNodes.push(nodes[i]);
          }
          errorNodes.push(nodes[i + 1]);
        }
      }
    }

    errorNodes.forEach(node => {
      let e: ValidationError;

      switch (property) {
        case 'IP':
          e = ValidationError.IpIsUsed;
          break;
        case 'MAC':
          e = ValidationError.MacIsUsed;
          break;
        default:
          e = ValidationError.WrongValue;
      }

      const error = new ValidationErrorModel(node.id, 'node', property, e);
      errors.push(error);
      node.setErrorStyle(true);
    });

    return errors;
  }

  public getMessageById(msgId: string): MessageModel {
    let message: MessageModel;

    this.netNodes.forEach(n => {
      if (n instanceof EthDeviceModel) {
        const msg = n.getMessageById(msgId);
        if (msg) {
          message = msg;
          return;
        }
      }
    });

    return message;
  }

  public getIpMessagesByDst(dst: NetNodeDataModel): IpMessageModel[] {
    let messages: IpMessageModel[] = [];

    this.netNodes.forEach(node => {
      if (node instanceof EthDeviceModel) {
        messages = node.ipMessages.filter(msg => msg.getDestinationDeviceIds().some(dstId => dstId === dst.id)).concat(messages);
      }
    });

    return messages;
  }

  constructor() {
    this.netNodes = [];
    this.netLinks = [];
  }
}

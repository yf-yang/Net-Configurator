import { NetNodeDataModel } from '../../../topology/net-topology-data/net-node-data-model';

export interface MessageDestination {
  address_method: 'UNICAST' | 'MULTICAST';
  multicast_group?: string;
  device?: string;
  nodes?: NetNodeDataModel[];
}

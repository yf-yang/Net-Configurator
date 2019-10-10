import { ImportLinkDataModel } from './import-link-data-model';
import { ImportNodeDataModel } from './import-node-data-model';
import { MessageModel } from '../../../shared/models/messages/message-model';
import { IpMessageModel } from '../../../shared/models/messages/ip-message-model';
import { BackendDataInterface } from '../interfaces/backend-data-interface';
import { MulticastGroupModel } from '../../../shared/models/messages/multicast-group-model';

export class ImportDataModel {
  public links: ImportLinkDataModel[];
  public nodes: ImportNodeDataModel[];
  public traffics: MessageModel[];
  public multicastGroups: MulticastGroupModel[];

  constructor(data: BackendDataInterface) {
    this.links = Object.keys(data.link).map(key => {
      data.link[key]._key = key;

      return new ImportLinkDataModel(data.link[key]);
    });

    this.nodes = Object.keys(data.node).map(key => {
      data.node[key]._key = key;

      return new ImportNodeDataModel(data.node[key]);
    });

    this.traffics = Object.keys(data.traffic).map(key => {
      data.traffic[key].id = key;
      return new IpMessageModel(data.traffic[key]);
    });

    this.multicastGroups = Object.keys(data.multicast_group).map(key => {
      data.multicast_group[key].id = key;

      return new MulticastGroupModel(data.multicast_group[key]);
    });
  }
}

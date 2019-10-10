import { PortModel } from '../../../shared/models/port-model';
import { PortData } from '../../../shared/interfaces/port-data';

export class ImportNodeDataModel {

  public id: string;
  public name: string;
  public ports: PortModel[];
  public type: string;
  public IP: string;
  public MAC: string;
  public subtype: string;
  public category: string;
  public protocol: string;
  public role: 'AGENT' | 'CONTROLLER';

  constructor(node: any) {
    this.id = node._key;
    this.name = node.name;
    this.type = node.type;
    this.subtype = node.subtype;
    this.category = node.category;
    this.protocol = node.protocol;
    this.role = node.role;

    if (node.unicast) {
      this.IP = node.unicast.IP;
      this.MAC = node.unicast.MAC;
    } else {
      this.IP = node.IP;
      this.MAC = node.MAC;
    }

    if (node.ports) {
      this.ports = Object.keys(node.ports).map((key, i) => {
        node.ports[key]._key = key;

        const portData: PortData = {
          id: key,
          bandwidth: node.ports[key]['available_bandwidth'],
          portType: node.ports[key]['port_type']
        };

        return new PortModel(portData);
      });
    }
  }
}

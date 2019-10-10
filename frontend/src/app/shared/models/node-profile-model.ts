import { NodeProfileData } from '../interfaces/node-profile-data';
import { PortData } from '../interfaces/port-data';

export class NodeProfileModel implements NodeProfileData {

  public id: string;
  public ports: PortData[];
  public name: string;
  public type: string;
  public model: string;
  public IP?: string;
  public MAC?: string;
  public role?: 'AGENT' | 'CONTROLLER';

  constructor(data: any) {
    Object.keys(data).forEach(key => {
      if (key === '_key') {
        this.id = data[key];
        return;
      }

      this[key] = data[key];
    });

    if (data.ports) {
      this.ports = this.extractPorts(data.ports);
    }
  }

  private extractPorts(data: any): PortData[] {
    const ports: PortData[] = [];

    Object.keys(data).forEach(portName => {
      if (portName === '_key') {
        return;
      }

      const portData: PortData = {
        id: portName,
        bandwidth: data[portName]['available_bandwidth'],
        portType: data[portName]['port_type']
      };

      ports.push(portData);
    });

    return ports;
  }
}

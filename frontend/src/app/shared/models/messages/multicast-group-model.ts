import { MulticastGroupData } from '../../interfaces/messages/multicast-group-data';

export class MulticastGroupModel implements MulticastGroupData {

  public id: string;
  public IP: string;
  public MAC: string;
  public devices: string[];

  constructor(data?: MulticastGroupData) {

    if (data) {
      this.setData(data);
    } else {
      this.IP = '';
      this.MAC = '';
      this.devices = [];
    }
  }

  public setData(data: MulticastGroupData) {
    Object.keys(data).forEach(key => {
      this[key] = data[key];
    });
  }

}

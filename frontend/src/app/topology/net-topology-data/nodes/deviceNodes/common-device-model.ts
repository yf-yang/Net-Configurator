import { EthDeviceModel } from '../eth-device-model';
import { CommonDeviceData } from '../../../../shared/topology/interfaces/nodes/eth-device/common-device-data';

export class CommonDeviceModel extends EthDeviceModel implements CommonDeviceData {

  constructor(data?: CommonDeviceData) {
    super(data);

    if (data) {
      this.setData(data);
    }
  }

  public saveData() {
    const data = {
      x: this.x,
      y: this.y
    };

    return data;
  }
}

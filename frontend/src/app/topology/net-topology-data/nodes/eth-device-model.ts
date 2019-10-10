import { NetNodeDataModel } from '../net-node-data-model';
import { ValidationErrorModel } from 'src/app/shared/validation/validation-error-model';
import { ValidationError } from 'src/app/shared/validation/validation-error.enum';
import { PortModel } from '../../../shared/models/port-model';
import { PortData } from '../../../shared/interfaces/port-data';
import { IpMessageModel } from '../../../shared/models/messages/ip-message-model';
import { MessageModel } from '../../../shared/models/messages/message-model';
import { EthDeviceData } from '../../../shared/topology/interfaces/nodes/eth-device-data';

export abstract class EthDeviceModel extends NetNodeDataModel implements EthDeviceData {

  public MAC: string;
  public IP: string;
  public ipMessages: IpMessageModel[];
  public traffics: string[];

  constructor(data?: EthDeviceData) {
    super(data);

    this.MAC = '';
    this.IP = '';
    this.ipMessages = [];
    this.traffics = [];

    if (data) {
      this.setData(data);
    }

    const portData: PortData = {
      id: 'DEVICE-0',
      portType: 'DEVICE0'
    };

    const port = new PortModel(portData);
    this.ports.push(port);
  }

  public validate(rules: any): ValidationErrorModel[] {
    const errors: ValidationErrorModel[] = [];

    Object.keys(rules.properties).forEach(property => {
      if (!this[property]) {
        errors.push(new ValidationErrorModel(this.id, 'node', property, ValidationError.Required));
      }
    });

    if (errors.length) {
      this.setErrorStyle(true);
    }

    return errors;
  }

  public addIpMessage(msg: IpMessageModel) {
    this.ipMessages.push(msg);
  }

  public getMessageById(msgId: string): MessageModel {
    const ipMessage = this.ipMessages.find(ipMsg => ipMsg.id === msgId);
    if (ipMessage) {
      return ipMessage;
    }
  }

}

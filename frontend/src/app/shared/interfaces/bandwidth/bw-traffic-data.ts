import { MessageModel } from '../../models/messages/message-model';

export interface BwTrafficData {
  bandwidth: number;
  trafficId: string;
  message?: MessageModel;
}

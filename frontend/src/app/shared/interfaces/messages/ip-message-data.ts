import { MessageData } from '../message-data';
import { IpMessageDestination } from './ip/ip-message-destination';
import { IpMessageSource } from './ip/ip-message-source';

export interface IpMessageData extends MessageData {

  source: IpMessageSource;
  destination: IpMessageDestination;
  protocol: string;
  VLAN: string;
  COS: string;
  length: number;
  frequency: number;
}

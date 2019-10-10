import { MessageDestination } from '../message-destination';

export interface IpMessageDestination extends MessageDestination {
  port: number;
}

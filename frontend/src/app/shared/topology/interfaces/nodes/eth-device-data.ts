import { NodeData } from '../node-data';

export interface EthDeviceData extends NodeData {
  MAC: string;
  IP: string;
  traffics: string[];
}

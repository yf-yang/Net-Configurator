import { NodeData } from '../node-data';

export interface SwitchData extends NodeData {
  role: 'AGENT' | 'CONTROLLER';
  IP: string;
  MAC: string;
}

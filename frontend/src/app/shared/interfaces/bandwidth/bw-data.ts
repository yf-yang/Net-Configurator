import { BwTrafficData } from './bw-traffic-data';

export interface BwData {
  bandwidth: number;
  traffic: BwTrafficData[];
  from: string;
  to: string;
}

import { PortData } from './port-data';

export interface NodeProfileData {
  id: string;
  ports: PortData[];
  name: string;
  type: string;
  model: string;
  IP?: string;
  MAC?: string;
  role?: 'AGENT' | 'CONTROLLER';
}

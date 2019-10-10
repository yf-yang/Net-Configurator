import { TopologyType } from '../types/topology-type';
import { PortModel } from '../../models/port-model';

export interface NodeData {
  id: string;
  label: string;
  group?: string;
  icon: string;
  iconWidth: number;
  iconHeight: number;
  x: number;
  y: number;
  type: TopologyType;
  isValidable?: boolean;
  errorsList?: string[];
  ports?: PortModel[];
  category?: string;
}

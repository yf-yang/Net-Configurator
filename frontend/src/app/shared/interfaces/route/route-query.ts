import { RouteLinkData } from './route-link-data';

export interface RouteQuery {
  dst: string;
  links: RouteLinkData[];
  method: string;
  src: string;
  traffic: string;
}

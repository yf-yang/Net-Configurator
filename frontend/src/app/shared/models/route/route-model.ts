import { RouteQuery } from '../../interfaces/route/route-query';
import { RouteLinkData } from '../../interfaces/route/route-link-data';

export class RouteModel implements RouteQuery {
  public dst: string;
  public links: RouteLinkData[];
  public method: string;
  public src: string;
  public traffic: string;

  constructor (data: RouteQuery) {
    Object.keys(data).forEach(key => {
      this[key] = data[key];
    });
  }
}

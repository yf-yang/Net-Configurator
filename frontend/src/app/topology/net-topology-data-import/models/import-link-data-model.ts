import { ImportEndpointDataModel } from './import-endpoint-data-model';

export class ImportLinkDataModel {
  public id: string;
  public bandwidth: number;
  public endpoints: ImportEndpointDataModel[];
  public protocol: string;

  constructor(link: any) {
    this.id = link._key;
    this.bandwidth = link.available_bandwidth;
    this.protocol = link.protocol;
    this.endpoints = link.endpoints.map((ep: string[]) => new ImportEndpointDataModel(ep));
  }
}

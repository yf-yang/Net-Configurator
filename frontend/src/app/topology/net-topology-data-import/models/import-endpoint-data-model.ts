export class ImportEndpointDataModel {

  public nodeId: string;
  public portId: string;

  constructor(data: string[]) {
    this.nodeId = data[0];
    this.portId = data[1];
  }
}

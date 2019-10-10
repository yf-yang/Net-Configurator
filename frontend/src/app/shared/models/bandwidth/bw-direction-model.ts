import { BwDataModel } from './bw-data-model';
import { BwData } from '../../interfaces/bandwidth/bw-data';

export class BwDirectionModel {

  public directions: BwDataModel[];
  public linkId: string;

  constructor(data: BwData[]) {
    this.directions = data.map(d => new BwDataModel(d));
    this.linkId = data['_key'];
  }
}

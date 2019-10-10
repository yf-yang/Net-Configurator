import { FrontendDataInterface } from '../interfaces/frontend-data-interface';
import { SvgTransform } from '../../../shared/topology/interfaces/svg-transform';

export class FrontendImportDataModel {

  public nodes: any[];
  public links: any[];
  public transform: SvgTransform;

  constructor(data: FrontendDataInterface) {
    this.links = Object.keys(data.link).map(key => {
      data.link[key].id = key;

      return data.link[key];
    });

    this.nodes = Object.keys(data.node).map(key => {
      data.node[key].id = key;

      return data.node[key];
    });

    if (data.transform) {
      this.transform = data.transform;
    } else {
      this.transform = {};
      this.transform.translate = [0, 0];
      this.transform.scale = [1];
    }
  }
}

import { ToolbarItemData } from '../../interfaces/toolbar-item-data';

export class ToolbarItemModel implements ToolbarItemData {

  public id: string;
  public title: string;
  public icon: string;
  public createMethod: string;
  public nodeType: string;
  public model: string;
  public traffics: string[];

  constructor(data: ToolbarItemData) {
    Object.keys(data).forEach(key => {
      this[key] = data[key];
    });
  }

  public isDEVICE(): boolean {
    return this.icon.indexOf('device') !== -1;
  }

}

import { ToolbarItemModel } from './toolbar-item-model';

export class ToolbarModel {

  id: string;
  title: string;
  icon: string;
  items: ToolbarItemModel[];

  constructor(data: any) {
    this.id = data.id;
    this.title = data.title;
    this.icon = data.icon;

    this.items = data.items && data.items.length ? data.items.map(i => new ToolbarItemModel(i)) : [];
  }

}

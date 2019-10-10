import { NetNodeDataModel } from '../net-node-data-model';
import { ValidationErrorModel } from 'src/app/shared/validation/validation-error-model';
import { NodeData } from 'src/app/shared/topology/interfaces/node-data';

export class LinkControlNodeModel extends NetNodeDataModel implements NodeData {

  constructor() {
    super();
  }

  public validate(rules: any): ValidationErrorModel[] {
    return [];
  }

  public saveData() {
    return {};
  }
}

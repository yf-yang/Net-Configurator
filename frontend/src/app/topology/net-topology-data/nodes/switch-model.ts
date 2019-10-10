import { NetNodeDataModel } from '../net-node-data-model';
import { ValidationErrorModel } from 'src/app/shared/validation/validation-error-model';
import { ValidationError } from 'src/app/shared/validation/validation-error.enum';
import { SwitchData } from '../../../shared/topology/interfaces/nodes/switch-data';

export class SwitchModel extends NetNodeDataModel implements SwitchData {

  public MAC: string;
  public IP: string;
  public role: 'AGENT' | 'CONTROLLER';

  constructor(data?: SwitchData) {
    super(data);

    this.MAC = '';
    this.IP = '';
    this.role = 'AGENT';

    if (data) {
      this.setData(data);

      if (!data.role) {
        this.role = 'AGENT';
      }

      if (data.role === 'CONTROLLER') {
        this.icon = this.icon.split('.svg')[0] + '-ctrl.svg';
      }
    }
  }

  public setController(state: boolean) {
    if (state) {
      if (this.role !== 'CONTROLLER') {
        this.role = 'CONTROLLER';
        this.icon = this.icon.split('.svg')[0] + '-ctrl.svg';
      }
    } else {
      if (this.role !== 'AGENT') {
        this.role = 'AGENT';
        this.icon = this.icon.split('-ctrl.svg')[0] + '.svg';
      }
    }
  }

  public validate(rules: any): ValidationErrorModel[] {
    const errors: ValidationErrorModel[] = [];

    Object.keys(rules.properties).forEach(property => {
      if (!this[property]) {
        errors.push(new ValidationErrorModel(this.id, 'node', property, ValidationError.Required));
      }
    });

    if (errors.length) {
      this.setErrorStyle(true);
    }

    return errors;
  }

  public saveData() {
    const data = {
      x: this.x,
      y: this.y
    };

    return data;
  }
}

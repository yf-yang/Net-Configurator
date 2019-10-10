import { ValidationInterface } from '../validation/validation-interface';
import { ValidationErrorModel } from '../validation/validation-error-model';
import { ValidationError } from '../validation/validation-error.enum';

export abstract class NetItemsExtrasModel implements ValidationInterface {
  public isValidable: boolean;
  public errorsList: string[];
  public errorsObj: ValidationErrorModel[];

  constructor() {
    this.isValidable = true;
    this.errorsList = [];
    this.errorsObj = [];
  }

  public abstract validate(rules: any): ValidationErrorModel[];
  public abstract setErrorStyle(isError: boolean): void;

  public isValidationError(): boolean {
    return this.errorsList.length > 0;
  }

  public getIcon(itemIcon: string, isError: boolean): string {
    if (isError) {
      if (this.isErrorIcon(itemIcon)) {
        return itemIcon;
      }

      const iconArr = itemIcon.split('.svg');

      return iconArr[0] + '-error.svg';
    } else {
      if (!this.isErrorIcon(itemIcon)) {
        return itemIcon;
      }

      const iconArr = itemIcon.split('-error.svg');

      return iconArr[0] + '.svg';
    }
  }

  public setError(error: ValidationErrorModel): void {
    let msg = '';

    switch (error.error) {
      case ValidationError.Required:
        msg = error.property + ' property is NOT specified';
        break;
      case ValidationError.WrongValue:
        msg = error.property + ' ' + ' has wrong value';
        break;
      case ValidationError.LinkNotConnected:
        msg = 'Link must be connecter to a node';
        break;
      case ValidationError.TooManyPorts:
        msg = 'Too many 1 Gb ports';
        break;
      case ValidationError.PortNotSpecified:
        msg = '1 Gb port is NOT specified';
        break;
      case ValidationError.MacIsUsed:
        msg = 'MAC address already in use';
        break;
      case ValidationError.IpIsUsed:
        msg = 'IP address already in use';
        break;
      default:
        msg = 'Unspecified error';
    }

    this.errorsList.push(msg);
    this.errorsObj.push(error);
  }

  public clearErrors(): void {
    this.errorsList = [];
  }

  private isErrorIcon(itemIcon: string): boolean {
    const iconArr = itemIcon.split('-');
    return iconArr[iconArr.length - 1] === 'error.svg';
  }
}

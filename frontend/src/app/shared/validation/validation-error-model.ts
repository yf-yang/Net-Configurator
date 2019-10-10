import { ValidationError } from './validation-error.enum';

export class ValidationErrorModel {

  itemId: string;
  type: 'node' | 'link' | 'message' | 'signal';
  property: string;
  error: ValidationError;

  constructor(
    itemId: string, type: 'node' | 'link' | 'message' | 'signal', property: string, error: ValidationError
  ) {
    this.itemId = itemId;
    this.type = type;
    this.property = property;
    this.error = error;
  }

}

import { ValidationErrorModel } from './validation-error-model';

export interface ValidationInterface {
  isValidable: boolean;
  errorsList: string[];

  validate(rules: any): ValidationErrorModel[];
  isValidationError(): boolean;
  setError(error: ValidationErrorModel): void;
  clearErrors(): void;
  setErrorStyle(isError: boolean): void;
  getIcon(itemIcon: string, isError: boolean): string;
}

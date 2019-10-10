import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { NotificationMessageType } from '../shared/models/notification-message-type';
import { NotificationMessage } from '../shared/models/notification-message-data';
import { CompilationOutput } from '../shared/models/compilation-output.enum';

const messages: Array<Array<NotificationMessage>> = [
  [
    new NotificationMessage('success', 'Validation has finished successfuly.', 'validation')
  ],
  [
    new NotificationMessage('success', 'Compilation has finished successfuly.', 'compilation'),
    new NotificationMessage('danger', 'Compilation has failed.', 'compilation'),
  ]
];

@Injectable()
export class NotificationDialogService {

  public isNotificationDialogOpenSubject = new Subject<{
    msgType: NotificationMessageType,
    errorCount: number,
    output: CompilationOutput
  }>();

  public isErrorDialogOpenSubject = new Subject<string>();
  public isValidationSuccessSubject = new Subject<boolean>();

  openModal(notificationMessageType: NotificationMessageType, errorCount: number, output: CompilationOutput) {
    this.isNotificationDialogOpenSubject.next({
      msgType: notificationMessageType,
      errorCount: errorCount,
      output: output
    });
  }

  openErrorModal(msg: string) {
    this.isErrorDialogOpenSubject.next(msg);
  }

  closeModal() {
    this.isNotificationDialogOpenSubject.next(null);
  }

  closeErrorModal() {
    this.isErrorDialogOpenSubject.next(null);
  }

  provideMessage(messageType: NotificationMessageType, errorCount: number, output: CompilationOutput): NotificationMessage {
    switch (messageType) {
      case NotificationMessageType.validation:
        if (errorCount === 0) {
          return new NotificationMessage('success', 'Validation has finished successfully.', 'validation');
        } else {
          const str = errorCount > 1 ? errorCount + ' errors.' : '1 error.';
          return new NotificationMessage('danger', 'Validation has failed with ' + str, 'validation');
        }
      case NotificationMessageType.compilation:
        if (errorCount === 0) {
          if (output === CompilationOutput.JSON) {
            return new NotificationMessage(
              'success', 'Policies have been successfully generated and downloaded to "output_json.zip"', 'compilation'
            );
          } else if (output === CompilationOutput.C) {
            return new NotificationMessage(
              'success', 'Policies have been successfully generated and downloaded to "output_C.zip"', 'compilation'
            );
          }
        } else {
          const str = errorCount > 1 ? errorCount + ' validation errors.' : '1 validation error.';
          return new NotificationMessage('danger', 'Policies could not be generated - ' + str, 'compilation');
        }
    }

    // const messageSubArray = messages[messageType];
    // const messageSubArrayLength: number = messageSubArray.length;
    // const messageIndex = Math.round(Math.random() * (messageSubArrayLength - 1));

    // return messageSubArray[messageIndex];
  }

  public setValidationSuccess() {
    this.isValidationSuccessSubject.next(true);
  }

  public resetValidation() {
    this.isValidationSuccessSubject.next(false);
  }

  public clearNotifications() {
    this.isErrorDialogOpenSubject.next(null);
    this.isNotificationDialogOpenSubject.next(null);
  }
}

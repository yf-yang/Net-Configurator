import { Component, OnInit, OnDestroy } from '@angular/core';
import { NotificationMessageType } from '../shared/models/notification-message-type';
import { NotificationMessage } from '../shared/models/notification-message-data';
import { CompilationOutput } from '../shared/models/compilation-output.enum';

import { NotificationDialogService } from './notification-dialog.service';
import { ValidationService } from '../shared/validation/validation.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-dialog',
  templateUrl: './notification-dialog.component.html',
  styleUrls: ['./notification-dialog.component.scss']
})
export class NotificationDialogComponent implements OnInit, OnDestroy {

  public isNotificationDialogOpen = false;

  public title: string;
  public messageText: string;
  public messageSeverity: string;
  public isJSON: boolean;
  public isError: boolean;
  private notificationSubscription: Subscription;
  private notificationErrorSubscription: Subscription;

  constructor(
    private notificationDialogService: NotificationDialogService,
    private validationService: ValidationService
  ) { }

  ngOnInit() {
    this.notificationSubscription = this.notificationDialogService.isNotificationDialogOpenSubject.subscribe(notification => {
      if (notification !== null) {
        this.isError = notification.errorCount > 0 ? true : false;

        if (notification.msgType === NotificationMessageType.validation) {
          this.title = 'Validation';
        } else {
          this.title = 'Policies';
        }
        const message: NotificationMessage = this.notificationDialogService.provideMessage(
          notification.msgType, notification.errorCount, notification.output);
        // possible values are info, warning, success, danger - it wasn't possible to use enum with string value (from TS version 2.4)

        this.messageSeverity = message.severity;
        this.messageText = message.text;
        this.isJSON = notification.output === CompilationOutput.JSON ? true : false;

        if (message.type === 'validation' && message.severity === 'success') {
          this.notificationDialogService.setValidationSuccess();
        }
      }
      this.isNotificationDialogOpen = notification !== null ? true : false;
    });

    this.notificationErrorSubscription = this.notificationDialogService.isErrorDialogOpenSubject.subscribe(msg => {
      if (msg) {
        this.title = 'Error';
        this.messageSeverity = 'danger';
        this.messageText = msg;
      }

      this.isNotificationDialogOpen = msg !== null ? true : false;
    });
  }

  onOk() {
    this.notificationDialogService.closeModal();
  }

  compileToC() {
  }

  ngOnDestroy() {
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }

    if (this.notificationErrorSubscription) {
      this.notificationErrorSubscription.unsubscribe();
    }
  }

}

import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NotificationDialogService } from '../../notification-dialog/notification-dialog.service';
import { HttpErrorData } from '../interfaces/http-error-data';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(
    private notificationService: NotificationDialogService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(catchError((err: HttpErrorResponse) => {
      console.error(err);

      if (err.status >= 400 && err.status < 500) {
        const errMsg: HttpErrorData = {
          code: err.status.toString(),
          context: '',
          message: err.message,
          trace_id: '',
          type: ''
        };

        /* Uncomment when ready */
        // this.notificationService.openErrorModal(errMsg.message);
      }

      return throwError(err);
    }));
  }

}

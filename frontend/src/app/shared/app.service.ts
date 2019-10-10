import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  public mouseSubject: Subject<MouseEvent> = new Subject<MouseEvent>();
  public allowPropPanelResize = false;

  constructor() { }

}

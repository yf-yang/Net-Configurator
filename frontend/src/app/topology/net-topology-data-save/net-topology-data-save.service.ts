import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NetTopologyDataSaveService {

  private isModalOpen = false;
  private isModalOpenSubject = new Subject<boolean>();

  constructor() { }

  openSaveModal() {
    this.isModalOpen = true;
    this.isModalOpenSubject.next(this.isModalOpen);
  }

  closeSaveModal() {
    this.isModalOpen = false;
    this.isModalOpenSubject.next(this.isModalOpen);
  }

  getIsOpenModal(): Observable<boolean> {
    return this.isModalOpenSubject.asObservable();
  }

}

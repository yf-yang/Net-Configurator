import { Component, ViewEncapsulation, OnInit } from '@angular/core';

import { NetTopologyDataImportService } from './topology/net-topology-data-import/net-topology-data-import.service';
import { TopologyService } from './topology/topology.service';
import { NotificationDialogService } from './notification-dialog/notification-dialog.service';
import { PropertiesPanelService } from './properties-panel/properties-panel.service';
import { ValidationService } from './shared/validation/validation.service';
import { CoreService } from './shared/core.service';
import { NetTopologyDataSaveService } from './topology/net-topology-data-save/net-topology-data-save.service';
import { DataService } from './shared/data.service';
import { AppService } from './shared/app.service';
import { NotificationMessageType } from './shared/models/notification-message-type';
import { TopologyVizService } from './topology-viz/topology-viz.service';
import { SvgTransform } from './shared/topology/interfaces/svg-transform';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent implements OnInit {

  public splashScreenOpened = true;
  public modalType: string;
  public modalTitle: string;
  public modalButtonLabel: string;
  public isValidationSuccess = false;
  public isWorking = false;

  constructor(
    private netTopologyDataImportService: NetTopologyDataImportService,
    private notificationDialogService: NotificationDialogService,
    private topologyService: TopologyService,
    private propertiesPanelService: PropertiesPanelService,
    private validationService: ValidationService,
    private coreService: CoreService,
    private netTopologyDataSaveService: NetTopologyDataSaveService,
    private dataService: DataService,
    private appService: AppService,
    private topologyVizService: TopologyVizService
  ) {}

  ngOnInit(): void {
    this.notificationDialogService.isValidationSuccessSubject.subscribe(
      state => this.isValidationSuccess = state
    );

    this.coreService.isWorkingSubject.subscribe(
      val => this.isWorking = val
    );
  }

  public openModal(type: string, title: string, label: string, ) {
    this.modalType = type;
    this.modalTitle = title;
    this.modalButtonLabel = label;
    this.netTopologyDataImportService.openImportModal();
  }

  public openSaveModal() {
    this.netTopologyDataSaveService.openSaveModal();
  }

  public validateTopology() {
    this.validationService.validateTopology().subscribe(errCount => {
      this.notificationDialogService.openModal(NotificationMessageType.validation, errCount, null);
    });
  }

  public generatePolicies() {
    this.validationService.validateTopology().subscribe(errCount => {
      if (errCount === 0) {
        this.dataService.generatePolicies().subscribe(res => {
          saveAs(res, 'policies.zip');
        });
      } else {
        this.notificationDialogService.openModal(NotificationMessageType.compilation, errCount, null);
      }
    });
  }

  public clearTopology() {
    this.dataService.resetBackendData().subscribe(
      res => {
        this.topologyService.clearTopology();
        this.netTopologyDataImportService.clearData();
        this.propertiesPanelService.closePropertiesPanel();
        this.notificationDialogService.clearNotifications();

        const transform: SvgTransform = {
          translate: [0, 0],
          scale: [1]
        };
        this.topologyVizService.setTopologyTransform(transform);
      },
      error => {
        this.notificationDialogService.openErrorModal('Failed to initialize backend.');
      }
    );
  }

  public loadTopology() {
    this.clearTopology();
    this.netTopologyDataImportService.loadDataFromBackend();
  }

  public setMouseEvent(e: MouseEvent) {
    if (this.appService.allowPropPanelResize) {
      this.appService.mouseSubject.next(e);
    }
  }

  public denyPropPanelResize() {
    this.appService.allowPropPanelResize = false;
  }

}

import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { NetTopologyDataImportService } from './net-topology-data-import.service';
import { TopologyService } from '../topology.service';
import { PropertiesPanelService } from '../../properties-panel/properties-panel.service';
import { NotificationDialogService } from '../../notification-dialog/notification-dialog.service';

@Component({
  selector: 'app-net-topology-import-component',
  templateUrl: './net-topology-data-import.component.html',
  styleUrls: ['./net-topology-data-import.component.scss']
})
export class NetTopologyDataImportComponent implements OnInit {

  @Input() title: string;
  @Input() buttonLabel: string;
  @Input() type: string;
  private selectedFilePath: string;
  private selectedFile: File;

  @ViewChild('fileInput')
  myInputVariable: any;

  public isImportModalOpen = false;
  public canImport = false;
  public fileFormat: string;

  constructor(
    private netTopologyDataImportService: NetTopologyDataImportService,
    private topologyService: TopologyService,
    private propertiesPanelService: PropertiesPanelService,
    private notificationDialogService: NotificationDialogService
  ) {}

  ngOnInit() {
    this.netTopologyDataImportService.isOpenModal().subscribe(open => {
      this.isImportModalOpen = open;
      this.reset();
    });
  }

  closeImportTopologyModal() {
    this.isImportModalOpen = false;
    this.selectedFilePath = '';
    this.selectedFile = null;
    this.canImport = false;
  }

  confirmButtonClicked() {
    this.topologyService.clearTopology();
    this.propertiesPanelService.closePropertiesPanel();
    this.notificationDialogService.clearNotifications();
    this.loadFile();
    this.closeImportTopologyModal();
  }

  public selectFile(event) {
    const fileList = event.target.files;
    if (fileList.length > 0) {
      this.selectedFile = fileList[0];
      this.selectedFilePath = this.selectedFile.name;
      this.canImport = true;
    }
  }

  private loadFile() {
    const fileReader: FileReader = new FileReader();

    if (this.selectedFile.type === 'application/json') {
      fileReader.readAsText(this.selectedFile);
      fileReader.onloadend = e => {
        const data = JSON.parse(fileReader.result.toString());
        if (data.be && data.fe) {
          this.netTopologyDataImportService.loadDataFromJson(data);
        } else {
          this.netTopologyDataImportService.parseFile(this.selectedFile);
        }
      };
    } else {
      this.netTopologyDataImportService.parseFile(this.selectedFile);
    }
  }

  reset() {
    this.myInputVariable.nativeElement.value = '';
    this.fileFormat = '';
  }

}

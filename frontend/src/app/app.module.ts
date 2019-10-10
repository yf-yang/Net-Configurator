import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {NgModule} from '@angular/core';

import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ClarityModule } from '@clr/angular';

import { AppComponent } from './app.component';
import { NetTopologyDataImportComponent } from './topology/net-topology-data-import/net-topology-data-import.component';
import { TopologyVizComponent } from './topology-viz/topology-viz.component';
import { SidepanelComponent } from './sidepanel/sidepanel.component';
import { ToolbarComponent } from './sidepanel/toolbar/toolbar.component';
import { ToolbarItemComponent } from './sidepanel/toolbar-item/toolbar-item.component';
import { PropertiesPanelComponent } from './properties-panel/properties-panel.component';
import { EditMessageDialogComponent } from './properties-panel/edit-message-dialog/edit-message-dialog.component';
import { EditReceiverDialogComponent } from './properties-panel/edit-receiver-dialog/edit-receiver-dialog.component';
import { EditNodeDialogComponent } from './edit-node-dialog/edit-node-dialog.component';
import { NotificationDialogComponent } from './notification-dialog/notification-dialog.component';
import { TitleToolboxComponent } from './properties-panel/title-toolbox/title-toolbox.component';
import { LinkConnectionDialogComponent } from './link-connection-dialog/link-connection-dialog.component';
import { TopologyComponent } from './topology/topology.component';
import { EditPortsDialogComponent } from './properties-panel/edit-ports-dialog/edit-ports-dialog.component';
import { NetNodePanelComponent } from './properties-panel/net-node-panel/net-node-panel.component';
import { NetEdgePanelComponent } from './properties-panel/net-edge-panel/net-edge-panel.component';
import { NetTopologyDataSaveComponent } from './topology/net-topology-data-save/net-topology-data-save.component';
import { SwitchNodePanelComponent } from './properties-panel/net-node-panel/switch-node-panel/switch-node-panel.component';
import { EthNodePanelComponent } from './properties-panel/net-node-panel/device/eth-node-panel/eth-node-panel.component';

import { CoreService } from './shared/core.service';
import { DragAndDropService } from './shared/common/drag-and-drop.service';
import { SidepanelService } from './sidepanel/sidepanel.service';
import { PropertiesPanelService } from './properties-panel/properties-panel.service';
import { NetTopologyDataImportService } from './topology/net-topology-data-import/net-topology-data-import.service';
import { TopologyService } from './topology/topology.service';
import { TopologyHighlightingService } from './shared/topology/services/topology-highlighting.service';
import { EditNodeDialogService } from './edit-node-dialog/edit-node-dialog.service';
import { FormsModule } from '@angular/forms';
import { NotificationDialogService } from './notification-dialog/notification-dialog.service';
import { ValidationService } from './shared/validation/validation.service';
import { LinkConnectionDialogService } from './link-connection-dialog/link-connection-dialog.service';
import { TopologyVizService } from './topology-viz/topology-viz.service';
import { NetTopologyDataSaveService } from './topology/net-topology-data-save/net-topology-data-save.service';

import { TextShortenPipe } from './shared/pipes/text-shorten.pipe';
import { DataService } from './shared/data.service';
import { BandwidthPipe } from './shared/pipes/bandwidth.pipe';
import { CollisionService } from './topology-viz/collision.service';
import { AppService } from './shared/app.service';
import { ErrorInterceptor } from './shared/interceptors/error-interceptor';

@NgModule({
  declarations: [
    AppComponent,
    TopologyVizComponent,
    SidepanelComponent,
    ToolbarComponent,
    ToolbarItemComponent,
    PropertiesPanelComponent,
    NetTopologyDataImportComponent,
    EditNodeDialogComponent,
    NotificationDialogComponent,
    TitleToolboxComponent,
    EditMessageDialogComponent,
    EditReceiverDialogComponent,
    LinkConnectionDialogComponent,
    EditPortsDialogComponent,
    TopologyComponent,
    NetNodePanelComponent,
    NetEdgePanelComponent,
    NetTopologyDataSaveComponent,
    TextShortenPipe,
    SwitchNodePanelComponent,
    EthNodePanelComponent,
    BandwidthPipe
  ],
  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    HttpClientModule,
    ClarityModule,
    FormsModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    CoreService,
    DragAndDropService,
    SidepanelService,
    PropertiesPanelService,
    TopologyService,
    TopologyHighlightingService,
    NetTopologyDataImportService,
    EditNodeDialogService,
    NotificationDialogService,
    ValidationService,
    LinkConnectionDialogService,
    TopologyVizService,
    NetTopologyDataSaveService,
    DataService,
    CollisionService,
    AppService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}

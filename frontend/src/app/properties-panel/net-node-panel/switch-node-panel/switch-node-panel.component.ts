import { Component, OnInit, OnChanges, Input, SimpleChanges, OnDestroy } from '@angular/core';
import { SwitchModel } from '../../../topology/net-topology-data/nodes/switch-model';
import { EditNodeDialogService } from '../../../edit-node-dialog/edit-node-dialog.service';
import { PropertiesPanelService } from '../../properties-panel.service';
import { TopologyService } from '../../../topology/topology.service';
import { TopologyHighlightingService } from '../../../shared/topology/services/topology-highlighting.service';
import { NetNodePanel } from '../net-node-panel';
import { DataService } from '../../../shared/data.service';
import { NotificationDialogService } from '../../../notification-dialog/notification-dialog.service';
import { Subscription } from 'rxjs';
import { CoreService } from '../../../shared/core.service';

@Component({
  selector: 'app-switch-node-panel',
  templateUrl: './switch-node-panel.component.html',
  styleUrls: [
    './switch-node-panel.component.scss',
    '../net-node-panel.component.scss',
    '../../properties-panel.component.scss'
  ]
})
export class SwitchNodePanelComponent extends NetNodePanel implements OnInit, OnChanges, OnDestroy {

  @Input() element: SwitchModel;

  public isController: boolean;
  private roleSubscription: Subscription;

  constructor(
    public editNodeDialogService: EditNodeDialogService,
    public propertiesPanelService: PropertiesPanelService,
    public topologyService: TopologyService,
    public topologyHighlightingService: TopologyHighlightingService,
    private dataService: DataService,
    private notificationDialogService: NotificationDialogService,
    public coreService: CoreService
  ) {
    super(
      propertiesPanelService,
      editNodeDialogService,
      topologyHighlightingService,
      topologyService,
      coreService
    );
  }

  ngOnInit() {
    this.isController = this.element.role === 'CONTROLLER';
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.isController = this.element.role === 'CONTROLLER';
  }

  public removeElement() {
    const linksId = this.topologyService.getTopologyData().getNetLinksByNode(this.element).filter(l => l.isConnected()).map(l => l.id);
    const removeLinkObs = linksId.map(id => this.dataService.removeLink(id));

    this.propertiesPanelService.removeElement(this.element, removeLinkObs);

    this.closePanel();
  }

  public setAsController() {
    this.topologyService.getTopologyData().netNodes.forEach(n => {
      if (n instanceof SwitchModel) {
        if (n.id === this.element.id) {
          if (this.element.role === 'AGENT') {
            n.setController(true);
            this.updateNodeRole(n.id, 'CONTROLLER');
          } else {
            n.setController(false);
            this.updateNodeRole(n.id, 'AGENT');
          }
        } else {
          n.setController(false);
          this.updateNodeRole(n.id, 'AGENT');
        }
      }
    });

    this.topologyService.updateTopology();
    this.topologyHighlightingService.selectNode(this.element);
  }

  private updateNodeRole(id: string, role: 'AGENT' | 'CONTROLLER') {
    this.roleSubscription = this.dataService.setSwitchAsController(id, role).subscribe(
      res => {},
      error => {
        this.notificationDialogService.openErrorModal('Failed to update the node.');
      }
    );
  }

  ngOnDestroy() {
    if (this.roleSubscription) {
      this.roleSubscription.unsubscribe();
    }
  }

}

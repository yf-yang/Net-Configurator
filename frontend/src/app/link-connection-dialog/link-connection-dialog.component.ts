import { Component, OnInit } from '@angular/core';
import { PortModel } from '../shared/models/port-model';
import { LinkConnectionDialogService } from './link-connection-dialog.service';
import { TopologyHighlightingService } from '../shared/topology/services/topology-highlighting.service';
import { NetNodeDataModel } from '../topology/net-topology-data/net-node-data-model';

@Component({
  selector: 'app-link-connection-dialog',
  templateUrl: './link-connection-dialog.component.html',
  styleUrls: ['./link-connection-dialog.component.scss']
})
export class LinkConnectionDialogComponent implements OnInit {

  public isConnectionDialogOpen: boolean;
  public ports: PortModel[];
  public posX: number;
  public posY: number;
  public node: NetNodeDataModel;

  private x: number;
  private y: number;
  private k: number;

  constructor(
    private linkConnectionDialogService: LinkConnectionDialogService,
    public topologyHighlightingService: TopologyHighlightingService
  ) { }

  ngOnInit() {
    this.ports = [];

    this.linkConnectionDialogService.isConnectionDialogOpenSubject.subscribe(
      node => {
        if (node) {
          this.node = node;
          this.ports = node.getEmptyPorts();
          this.setPosition();
        } else {
          this.ports = [];
        }

        this.isConnectionDialogOpen = node ? true : false;
      }
    );
  }

  public onSubmit(portId: string) {
    this.linkConnectionDialogService.closeConnectionDialog(portId);
  }

  public setOffset(x: number, y: number, k: number) {
    this.x = x;
    this.y = y;
    this.k = k;

    this.setPosition();
  }

  private setPosition() {
    if (this.node) {
      this.posX = (this.node.x + this.node.iconWidth) * this.k + this.x;
      this.posY = this.node.y * this.k + this.y;
    }
  }

}

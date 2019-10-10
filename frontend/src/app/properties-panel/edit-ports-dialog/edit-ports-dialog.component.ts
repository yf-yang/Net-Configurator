import { Component, OnInit, OnChanges, Input, SimpleChanges } from '@angular/core';
import { EditPropertiesDialogComponent } from '../edit-properties-dialog/edit-properties-dialog.component';
import { PortModel } from '../../shared/models/port-model';
import { TopologyService } from '../../topology/topology.service';
import { SwitchModel } from 'src/app/topology/net-topology-data/nodes/switch-model';

@Component({
  selector: 'app-edit-ports-dialog',
  templateUrl: './edit-ports-dialog.component.html',
  styleUrls: ['./edit-ports-dialog.component.scss']
})
export class EditPortsDialogComponent extends EditPropertiesDialogComponent implements OnInit, OnChanges {

  @Input()
  item: SwitchModel;

  @Input()
  itemsArray: [PortModel];

  ports: PortModel[];

  constructor(private topologyService: TopologyService) {
    super();
  }

  ngOnInit() {
    // const keys = Object.keys(PortBandwidthEnum);
    // const portsEnum = keys.slice(keys.length / 2);
    // this.bwList = [];

    // for (let i = 0; i < keys.length / 2; i++) {
    //   const bw = new PortBandwidth(PortBandwidthEnum[portsEnum[i]]);
    //   this.bwList.push(bw);
    // }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.item && !changes.item.currentValue) {
      this.item = null;
    }
  }

  setItem(value: string, item?: SwitchModel): void {
    this.ports = item.ports.map(port => {
      return port.copyObject();
    });
  }

  saveItem() {
    const portChanges = this.getPortChanges(this.item.ports, this.ports);
    this.item.ports = this.ports;
    portChanges.forEach(portIndex => {
      const link = this.topologyService.getTopologyData().getNetLinkById(this.item.ports[portIndex].link.id);

      /* Set/unset dashed link */
      if (link) {
        // this.topologyService.findAndRemoveLinkFromTopology(link);
        // this.item.ports[portIndex].resetData();
        if (link.fromNodeObj instanceof SwitchModel && link.toNodeObj instanceof SwitchModel && link.isDashed) {
          const fromPortNum = link.fromNodeObj.getLinkPortId(link.id);
          const toPortNum = link.toNodeObj.getLinkPortId(link.id);

          if (link.fromNodeObj.ports[fromPortNum].bandwidth === link.toNodeObj.ports[toPortNum].bandwidth) {
            link.setDashed(false);
            link.setSpeed(link.fromNodeObj.ports[fromPortNum].bandwidth);
            link.setLinkColorByPortSpeed();
          }
        } else {
          link.setDashed(true);
        }

        this.topologyService.updateTopology();
      }
    });

    this.dialogControl('close');
    this.itemEdited.emit();
  }

  removeItem(item?: any): void {

  }

  private getPortChanges(arr1: PortModel[], arr2: PortModel[]): number[] {
    const indexes: number[] = [];

    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i].bandwidth !== arr2[i].bandwidth) {
        indexes.push(i);
      }
    }

    return indexes;
  }

}

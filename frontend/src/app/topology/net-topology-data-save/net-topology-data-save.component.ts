import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { NetTopologyDataSaveService } from './net-topology-data-save.service';
import { TopologyService } from '../topology.service';
import { Subscription } from 'rxjs';
import { DataService } from '../../shared/data.service';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-net-topology-data-save',
  templateUrl: './net-topology-data-save.component.html',
  styleUrls: ['./net-topology-data-save.component.scss']
})
export class NetTopologyDataSaveComponent implements OnInit, OnDestroy {

  @ViewChild('input')
  input: any;

  public isSaveModalOpen = false;
  public fileName: string;
  private dumpSubscription: Subscription;

  constructor(
    private netTopologyDataSaveService: NetTopologyDataSaveService,
    private topologyService: TopologyService,
    private dataService: DataService
  ) { }

  ngOnInit() {
    this.netTopologyDataSaveService.getIsOpenModal().subscribe(open => {
      this.isSaveModalOpen = open;
      this.fileName = '';
    });
  }

  public closeSaveTopologyModal() {
    this.isSaveModalOpen = false;
  }

  public confirmButtonClicked() {
    this.closeSaveTopologyModal();

    this.dumpSubscription = this.dataService.dumpBackend().subscribe(dump => {
      const data: any = {
        be: dump,
        fe: this.getTopologyData()
      };

      const blob = new Blob([JSON.stringify(data, null, 4)], {type: 'application/json'});

      saveAs(blob, this.fileName + '.json');
    });
  }

  private getTopologyData() {
    const topoData = this.topologyService.getTopologyData();
    const nodes: any = {};
    const links: any = {};

    topoData.netNodes.forEach(n => {
      if (n.type !== 'topology-item') {
        return;
      }

      nodes[n.id] = n.saveData();
    });

    topoData.netLinks.forEach(l => {
      if (!l.isConnected()) {
        return;
      }

      links[l.id] = l.saveData();
    });

    const data = {
      node: nodes,
      link: links,
      transform: this.topologyService.getTopologyTransform()
    };

    return data;
  }

  ngOnDestroy() {
    if (this.dumpSubscription) {
      this.dumpSubscription.unsubscribe();
    }
  }

}

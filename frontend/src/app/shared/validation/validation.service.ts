import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { TopologyService } from '../../topology/topology.service';

import { Observable } from 'rxjs';
import { ValidationErrorModel } from './validation-error-model';
import { NetNodeDataModel } from '../../topology/net-topology-data/net-node-data-model';
import { NetEdgeDataModel } from '../../topology/net-topology-data/net-edge-data-model';
import { MessageModel } from '../models/messages/message-model';

@Injectable()
export class ValidationService {

  private errors: Array<ValidationErrorModel[]>;
  private errorsCount: number;

  constructor(
    private http: HttpClient,
    private topologyService: TopologyService
  ) {
    this.errors = [];
  }

  private loadValidationSchema(): Observable<any> {
    return this.http
      .get('/assets/validation-schema.json');
  }

  private getErrorItem(itemId: string, type: 'node' | 'link' | 'message' | 'signal'):
  NetNodeDataModel | NetEdgeDataModel | MessageModel {
    /* TODO: Implement get MessageModel, SignalModel */
    const data = this.topologyService.getTopologyData();
    let item: NetNodeDataModel | NetEdgeDataModel | MessageModel ;
    switch (type) {
      case 'node':
        item = data.getNetNodeById(itemId);
        break;
      case 'link':
        item = data.getNetLinkById(itemId);
        break;
    }

    return item;
  }

  public validateTopology(): Observable<number> {
    return new Observable<number>(
      observer => {
        this.clearValidation();
        this.errorsCount = 0;

        this.loadValidationSchema().subscribe(
          schema => {
            const topologyData = this.topologyService.getTopologyData();
            this.errors = topologyData.validateNetTopologyItems(schema.properties);

            this.errors.forEach(errors => {
              this.errorsCount += errors.length;
            });

            this.topologyService.updateTopology();

            observer.next(this.errorsCount);
            observer.complete();
          }
        );
      }
    );
  }

  public clearValidation() {
    this.errors.forEach(error => {
      const item = this.getErrorItem(error[0].itemId, error[0].type);
      if (item['controlNodeId']) {
        const controlNode = this.topologyService.getTopologyData().getNetNodeById(item['controlNodeId']);
        if (controlNode) {
          controlNode.setErrorStyle(false);
        }
      }

      item.clearErrors();
      item.setErrorStyle(false);
    });
    this.errors = [];
  }

  public clearItemValidation(item: NetNodeDataModel | NetEdgeDataModel) {
    if (item.isValidationError()) {
      const i = this.errors.findIndex(error => {
        return error[0].itemId === item.id;
      });

      if (i > -1) {
        item.clearErrors();
        item.setErrorStyle(false);

        this.errors.splice(i, 1);
      }
    }
  }

  public isValidIP(ip: string): boolean {
    if (!ip) {
      return false;
    }

    const blocks = ip.split('.');

    if (blocks.length === 4) {
      return blocks.every(
        block => {
          if (block !== '') {
            const num = Number(block);
            if (isNaN(num)) {
              return false;
            }
            return num >= 0 && num <= 255;
          }
          return false;
        }
      );
    }

    return false;
  }

  public isValidMAC(mac: string): boolean {
    if (!mac) {
      return false;
    }

    const re = new RegExp('^([0-9A-Fa-f]{2}[:]){5}([0-9A-Fa-f]{2})$');

    return re.test(mac);
  }

  public isValidPort(port: string): boolean {
    const num = Number(port);

    return port !== '' && !isNaN(num) && num > 0;
  }

  public isEmptyProp(item: any, property: string): boolean {
    return item[property] === '';
  }

}

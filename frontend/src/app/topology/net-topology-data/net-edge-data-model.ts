import { NetNodeDataModel } from './net-node-data-model';
import { TopologyEdgeDataModel } from '../../shared/topology/models/topology-edge-data-model';
import { ColorConstants } from '../../shared/constants/color-constants';
import { ValidationErrorModel } from '../../shared/validation/validation-error-model';
import { NetItemsExtrasModel } from '../../shared/models/net-items-extras-model';
import { ValidationError } from '../../shared/validation/validation-error.enum';
import { EdgeData } from '../../shared/topology/interfaces/edge-data';
import { Point } from '../../shared/models/point';
import { BwDataModel } from '../../shared/models/bandwidth/bw-data-model';

export class NetEdgeDataModel extends NetItemsExtrasModel implements TopologyEdgeDataModel, EdgeData {

  public id: string;
  public from: string;
  public to: string;
  public fromNodeObj: NetNodeDataModel;
  public toNodeObj: NetNodeDataModel;
  public color: string;
  public clickable = true;
  public isDashed = false;
  public speed: number;
  public protocol: string;
  public source: string;
  public target: string;
  public bandwidth: number;
  public disabled: boolean;
  public isFlipped: boolean;
  public traffics: BwDataModel[];

  constructor(edge: EdgeData) {
    super();

    Object.keys(edge).forEach(
      key => {
        this[key] = edge[key];
      }
    );

    this.from = edge.fromNodeObj.id;
    this.to = edge.toNodeObj.id;
    this.source = this.from;
    this.target = this.to;
    this.clickable = true;
    this.disabled = false;
    this.bandwidth = 0;
    this.isFlipped = false;
    this.traffics = [];
    this.setLinkColor();
  }

  public setSpeed(speed: number) {
    this.speed = speed;
    this.setLinkColorByPortSpeed();
  }

  public setLinkColor(color?: string) {
    if (color) {
      this.color = color;
      return;
    }

    this.color = ColorConstants.ETHERNET_LINK_COLOR;
    this.setLinkColorByPortSpeed();
  }

  public setLinkColorByPortSpeed() {
    if (this.speed) {
      switch (this.speed) {
        case 1000:
          this.color = ColorConstants.LINK_1G_COLOR;
          break;
        case 100:
          this.color = ColorConstants.LINK_100M_COLOR;
          break;
        default:
          this.color = ColorConstants.LINK_1G_COLOR;
      }
    }
  }

  public setLinkDstNode(toNodeObj: NetNodeDataModel) {
    this.toNodeObj = toNodeObj;
    this.to = toNodeObj.id;
  }

  public setPorts(fromNodeObj: NetNodeDataModel, toNodeObj: NetNodeDataModel, oldLinkId: string) {
    const fromPort = fromNodeObj.getPortByLinkId(oldLinkId);
    const toPort = toNodeObj.getPortByLinkId(oldLinkId);

    fromPort.setConnectedLinkData(this);
    toPort.setConnectedLinkData(this);
  }

  public setDashed(state: boolean) {
    this.isDashed = state;
  }

  public setClickable(state: boolean) {
    this.clickable = state;
  }

  public swapFromToNodes(flip?: boolean) {
    const fromId = this.from;
    const fromNode = this.fromNodeObj;

    this.from = this.to;
    this.fromNodeObj = this.toNodeObj;

    this.to = fromId;
    this.toNodeObj = fromNode;
  }

  public validate(rules: any): ValidationErrorModel[] {
    const errors: ValidationErrorModel[] = [];

    Object.keys(rules.properties).forEach(property => {
      if (!this[property]) {
        errors.push(new ValidationErrorModel(this.id, 'link', property, ValidationError.Required));
      }
    });

    const isNotConnected = [this.fromNodeObj, this.toNodeObj].some(node => {
      return node.type === 'link-drag-from' || node.type === 'link-drag-to';
    });

    if (isNotConnected) {
      errors.push(new ValidationErrorModel(this.id, 'link', '', ValidationError.LinkNotConnected));
    }

    if (errors.length) {
      this.setErrorStyle(true);
    }

    return errors;
  }

  public setErrorStyle(isError: boolean) {
    if (isError) {
      this.color = ColorConstants.ERROR_COLOR;
    } else {
      this.color = ColorConstants.ETHERNET_LINK_COLOR;
    }

    [this.fromNodeObj, this.toNodeObj].filter(node => node.type === 'link-drag-from' || node.type === 'link-drag-to')
      .forEach(node => {
        node.icon = node.getIcon(node.icon, isError);
      });
  }

  public saveData() {
    return {
      isFlipped: this.isFlipped
    };
  }

  public setData(data: EdgeData): void {
    Object.keys(data).forEach(
      key => {
        this[key] = data[key];
      }
    );
  }

  public getOrthogonalPoint(start: Point, end: Point, angle: number): Point {
    return this.isFlipped ? {
      x: end.x,
      y: start.y
    } : {
      x: start.x,
      y: end.y
    };
  }

  public getPerimeterPoints() {
    const points: Point[] = [];
    const perimeterOffset = 0.8;

    const fromAngle = this.getLinkAngle();
    const fromR1 = this.fromNodeObj.iconWidth / 2 * perimeterOffset;
    const fromR2 = this.fromNodeObj.iconHeight / 2 * perimeterOffset;
    const fromPortConstant: 0 | 1 = this.fromNodeObj.ports.length > 1 ? 1 : 0;

    points.push({
      x: (this.fromNodeObj.x + this.fromNodeObj.iconWidth / 2) + (fromR1 * Math.cos(fromAngle) * fromPortConstant),
      y: (this.fromNodeObj.y + this.fromNodeObj.iconHeight / 2) + (fromR2 * Math.sin(fromAngle) * fromPortConstant)
    });

    const toAngle = this.getLinkAngle(true);
    const toR1 = this.toNodeObj.iconWidth / 2 * perimeterOffset;
    const toR2 = this.toNodeObj.iconHeight / 2 * perimeterOffset;
    const toPortConstant: 0 | 1 = this.toNodeObj.ports.length > 1 ? 1 : 0;

    points.push({
      x: (this.toNodeObj.x + this.toNodeObj.iconWidth / 2) + (toR1 * Math.cos(toAngle) * toPortConstant),
      y: (this.toNodeObj.y + this.toNodeObj.iconHeight / 2) + (toR2 * Math.sin(toAngle) * toPortConstant)
    });

    return points;
  }

  public getLinkAngle(reverse?: boolean): number {
    if (reverse) {
      return Math.atan2(
        this.fromNodeObj.y - this.toNodeObj.y,
        this.fromNodeObj.x - this.toNodeObj.x
      );
    }

    return Math.atan2(
      this.toNodeObj.y - this.fromNodeObj.y,
      this.toNodeObj.x - this.fromNodeObj.x
    );
  }

  public flip() {
    this.isFlipped = !this.isFlipped;
  }

  public disable() {
    this.traffics = [];
    this.disabled = true;
  }

  public setTraffic(traffic: BwDataModel[]) {
    this.traffics = traffic;
  }

  public resetTraffic() {
    this.traffics = [];
  }

  public isConnected() {
    return this.fromNodeObj.type === 'topology-item' && this.toNodeObj.type === 'topology-item';
  }

  private isVertical(angle: number): boolean {
    angle = Math.abs(angle);
    return angle < 3 * Math.PI / 4 && angle > Math.PI / 4;
  }
}

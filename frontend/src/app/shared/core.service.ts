import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Point } from './models/point';

import { SvgTransform } from './topology/interfaces/svg-transform';

@Injectable()
export class CoreService {

  public isWorkingSubject = new Subject<boolean>();

  constructor() { }

  /**
   * Create list of objects based on type
   */
  public extractListData<T>(response: Array<any>, type: { new (value: any): T }): Array<T> {
    return response.map(
      data => {
        return new type(data);
      }
    );
  }

  public extractObjectData<T>(response: any, type: { new (value: any): T }): T {
    return new type(response);
  }

  public extractObjectDataToArray<T>(response: any, type: { new (value: any): T }): Array<T> {
    return Object.keys(response).map(
      key => {
        response[key]._key = key;
        return new type(response[key]);
      }
    );
  }

  /**
   * Extract values from string
   * Match `property1(..values) property2(..values) ...`
   */
  public parseTransform(str: string): SvgTransform {
    if (!str) {
      return {
        translate: [0, 0],
        scale: [1]
      };
    }

    const obj = {};
    const properties = str.match(/(\w+\((\-?\d+\.?\d*e?\-?\d*,?)+\))+/g);

    properties.forEach(element => {
      const match = element.match(/[\w\.\-]+/g);

      const matchArr = match.map(
        (value, i) => {
          if (i !== 0) {
            return parseFloat(value);
          } else {
            return value;
          }
        }
      );

      obj[matchArr.shift()] = matchArr;
    });

    return obj;
  }

  /**
   * Generate random string
   */
  public generateRandomString(length: number): string {
    return Math.random().toString(36).substr(2, length);
  }

  /**
   * Get vector length from two points
   */
  public getVectorLength(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  }

  /**
   * Get angle between two points
   */
  public getPointsAngle(p1: Point, p2: Point, deg?: boolean): number {
    if (deg) {
      return Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
    } else {
      return Math.atan2(p2.y - p1.y, p2.x - p1.x);
    }
  }

  public generateColor() {
    return '#' + Math.random().toString(16).substr(-6);
  }

  public getOrthogonalPoint(p1: Point, p2: Point, isFlipped?: boolean): Point {
    return !isFlipped ? {
      x: p1.x,
      y: p2.y
    } :
    {
      x: p2.x,
      y: p1.y
    };
  }

  public isVerticalLine(from: Point, to: Point): boolean {
    return from.x === to.x;
  }

  public parsePoint(str: string): Point {
    const arr = str.split(' ');

    return {
      x: parseInt(arr[0], 10),
      y: parseInt(arr[1], 10)
    };
  }

  public isBetween(num: number, interval: [number, number]): boolean {
    interval.sort((a, b) => a - b);

    return num < interval[1] && num > interval[0];
  }

  public getUniqueArray<T>(arr: T[], prop: string): T[] {
    const unique: T[] = arr.map(e => e[prop])
      .map((e, i, final) => final.indexOf(e) === i && i)
      .filter(e => arr[e]).map(e => arr[e]);

    return unique;
  }

}

import { Injectable } from '@angular/core';
import { Point } from '../shared/models/point';
import { AppConfig } from '../shared/app-config';
import { CoreService } from '../shared/core.service';
import * as d3 from 'd3';

interface Line {
  id: string;
  points: Point[];
}

interface LineData {
  horizontalLines: Line[];
  verticalLines: Line[];
}

export interface Collision {
  id: string;
  hLineId: string;
  intersection: Point;
}

@Injectable({
  providedIn: 'root'
})
export class CollisionService {

  private svg: any;

  constructor(private coreService: CoreService) {
  }

  private init(svg: any) {
    this.svg = svg;
  }

  private getLinesByPoints(points: Point[]): {hLine: Point[], vLine: Point[]} {
    const hLine: Point[] = [];
    const vLine: Point[] = [];
    const orthoPoint = points[2];

    for (let i = 0; i <= 1; i++) {
      if (orthoPoint.x === points[i].x) {
        vLine.push({
          x: orthoPoint.x,
          y: orthoPoint.y
        });

        vLine.push({
          x: points[i].x,
          y: points[i].y
        });
      } else {
        hLine.push({
          x: orthoPoint.x,
          y: orthoPoint.y
        });

        hLine.push({
          x: points[i].x,
          y: points[i].y
        });
      }
    }

    return {
      hLine: hLine,
      vLine: vLine
    };
  }

  private getLinesForCollision(): LineData {
    const self = this;
    const linksSel = this.svg.selectAll('.links .link');
    const hLines: Line[] = [];
    const vLines: Line[] = [];

    let point: Point;
    let p: string;

    linksSel.each(function (d: any) {
      const points: Point[] = [];

      p = d3.select(this).attr('p1');
      point = self.coreService.parsePoint(p);
      points.push(point);

      p = d3.select(this).attr('p2');
      point = self.coreService.parsePoint(p);
      points.push(point);

      p = d3.select(this).attr('p3');
      point = self.coreService.parsePoint(p);
      points.push(point);

      const lines = self.getLinesByPoints(points);

      hLines.push({
        id: d['id'],
        points: lines.hLine
      });

      vLines.push({
        id: d['id'],
        points: lines.vLine
      });
    });

    return {
      horizontalLines: hLines,
      verticalLines: vLines
    };
  }

  public checkCollisions(svg: any): Collision[] {
    this.init(svg);

    const collisions: Collision[] = [];
    const data = this.getLinesForCollision();

    data.horizontalLines.forEach(
      hLine => {
        data.verticalLines.forEach(
          vLine => {
            if (hLine.points.length && vLine.points.length) {
              if (this.coreService.isBetween(vLine.points[0].x, [hLine.points[0].x, hLine.points[1].x])) {
                if (this.coreService.isBetween(hLine.points[0].y, [vLine.points[0].y, vLine.points[1].y])) {
                  collisions.push({
                    id: this.coreService.generateRandomString(5),
                    hLineId: hLine.id,
                    intersection: {
                      x: vLine.points[0].x,
                      y: hLine.points[0].y
                    }
                  });
                }
              }
            }
          }
        );
      }
    );

    return collisions;
  }

  public getCollisionPath(from: Point, to: Point, collisions: Collision[]): string {
    let path = '';

    const i = from.x > to.x ? 1 : -1;

    collisions.sort((a, b) => (b.intersection.x - a.intersection.x) * i);

    collisions.forEach(c => {
      path += ' L' + (c.intersection.x + (AppConfig.LINK_LOOP_R * i)) + ' ' + c.intersection.y;
      path += ' A' + AppConfig.LINK_LOOP_R + ' ' + AppConfig.LINK_LOOP_R + ' 0 0 ';
      path += i === 1 ? '0 ' : '1 ';
      path += (c.intersection.x - (AppConfig.LINK_LOOP_R * i)) + ' ' + c.intersection.y;
    });

    return path;
  }
}

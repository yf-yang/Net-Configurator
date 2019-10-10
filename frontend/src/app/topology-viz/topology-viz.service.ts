import { Injectable } from '@angular/core';
import { CoreService } from '../shared/core.service';

import { LinkConnectionDialogComponent } from '../link-connection-dialog/link-connection-dialog.component';
import { SvgTransform } from '../shared/topology/interfaces/svg-transform';
import * as d3 from 'd3';

@Injectable({
  providedIn: 'root'
})
export class TopologyVizService {

  private svgObject: d3.Selection<SVGSVGElement, {}, null, undefined>;
  private zoomBeh: d3.ZoomBehavior<SVGSVGElement, any>;

  constructor(
    private coreService: CoreService
  ) { }

  public getSvgTransform(): SvgTransform {
    return this.coreService.parseTransform(this.svgObject.select('.content').attr('transform'));
  }

  public setLinkDialogTransform(linkDialog: LinkConnectionDialogComponent) {
    const tranform = this.getSvgTransform();
    linkDialog.setOffset(tranform.translate[0], tranform.translate[1], tranform.scale[0]);
  }

    /**
   * Set d3.svg to local property
   */
  public setSvgObject(svgObject: any) {
    this.svgObject = svgObject;
  }

  /**
   * Return d3.svg object for use
   */
  public getSvgObject() {
    return this.svgObject;
  }

  public setZoomBeh(zoom: d3.ZoomBehavior<SVGSVGElement, any>) {
    this.zoomBeh = zoom;
  }

  public getZoomBeh(): d3.ZoomBehavior<SVGSVGElement, any> {
    return this.zoomBeh;
  }

  public setTopologyTransform(transform: SvgTransform) {
    this.svgObject.call(this.zoomBeh.transform, d3.zoomIdentity
      .scale(transform.scale[0])
      .translate(transform.translate[0] / transform.scale[0], transform.translate[1] / transform.scale[0])
    );
  }
}

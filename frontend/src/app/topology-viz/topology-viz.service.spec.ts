import { TestBed, inject } from '@angular/core/testing';

import { TopologyVizService } from './topology-viz.service';

describe('TopologyVizService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TopologyVizService]
    });
  });

  it('should be created', inject([TopologyVizService], (service: TopologyVizService) => {
    expect(service).toBeTruthy();
  }));
});

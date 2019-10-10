import { TestBed } from '@angular/core/testing';

import { NetTopologyDataImportService } from './net-topology-data-import.service';

describe('NetTopologyDataImportService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: NetTopologyDataImportService = TestBed.get(NetTopologyDataImportService);
    expect(service).toBeTruthy();
  });
});

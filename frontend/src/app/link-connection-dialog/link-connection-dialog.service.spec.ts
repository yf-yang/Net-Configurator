import { TestBed, inject } from '@angular/core/testing';

import { LinkConnectionDialogService } from './link-connection-dialog.service';

describe('LinkConnectionDialogService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LinkConnectionDialogService]
    });
  });

  it('should be created', inject([LinkConnectionDialogService], (service: LinkConnectionDialogService) => {
    expect(service).toBeTruthy();
  }));
});

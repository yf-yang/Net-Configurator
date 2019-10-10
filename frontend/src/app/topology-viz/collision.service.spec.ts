import { TestBed } from '@angular/core/testing';

import { CollisionService } from './collision.service';

describe('CollisionService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: CollisionService = TestBed.get(CollisionService);
    expect(service).toBeTruthy();
  });
});

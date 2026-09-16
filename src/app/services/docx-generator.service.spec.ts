import { TestBed } from '@angular/core/testing';

import { DocxGeneratorService } from './docx-generator.service';

describe('DocxGeneratorService', () => {
  let service: DocxGeneratorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DocxGeneratorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

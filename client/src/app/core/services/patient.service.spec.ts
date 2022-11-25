import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { makePatient } from '../../testing/test-data';
import { PatientService } from './patient.service';

describe('PatientService', () => {
  let service: PatientService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(PatientService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends only non-empty query params when listing', () => {
    const page = { items: [makePatient()], total: 1, page: 2, pageSize: 10 };
    let result: unknown;

    service
      .list({ search: 'doe', status: '', page: 2, doctorId: null })
      .subscribe((p) => (result = p));

    const req = http.expectOne((r) => r.url === '/api/patients');
    expect(req.request.params.get('search')).toBe('doe');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.has('status')).toBeFalse();
    expect(req.request.params.has('doctorId')).toBeFalse();
    req.flush({ success: true, data: page });

    expect(result).toEqual(page);
  });

  it('unwraps a single patient', () => {
    const patient = makePatient({ id: 7 });
    let result: unknown;

    service.get(7).subscribe((p) => (result = p));
    http.expectOne('/api/patients/7').flush({ success: true, data: patient });

    expect(result).toEqual(patient);
  });

  it('creates and updates patients', () => {
    const { id, doctor, ...payload } = makePatient();

    service.create(payload).subscribe();
    const create = http.expectOne('/api/patients');
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual(payload);
    create.flush({ success: true, data: { id, doctor, ...payload } });

    service.update(id, payload).subscribe();
    const update = http.expectOne(`/api/patients/${id}`);
    expect(update.request.method).toBe('PUT');
    update.flush({ success: true, data: { id, ...payload } });
  });

  it('deletes a patient', () => {
    service.delete(3).subscribe();
    const req = http.expectOne('/api/patients/3');
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true, data: null });
  });
});

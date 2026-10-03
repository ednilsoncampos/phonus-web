import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { EmpresaService } from './empresa.service';

describe('EmpresaService', () => {
  let service: EmpresaService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(EmpresaService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('buscar() faz GET /empresa', () => {
    service.buscar().subscribe();
    const req = http.expectOne((r) => r.url.endsWith('/empresa'));
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('atualizar() faz PUT /empresa com o corpo', () => {
    const body = { nome: 'Loja', endereco: null, telefone: '(11) 99999-0000' };
    service.atualizar(body).subscribe();
    const req = http.expectOne((r) => r.url.endsWith('/empresa'));
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(body);
    req.flush({});
  });
});

import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, HttpHeaders, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ReciboService } from './recibo.service';

describe('ReciboService', () => {
  let service: ReciboService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ReciboService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('baixa o recibo como blob e lê o nome em Content-Disposition', () => {
    let nome = '';
    service.baixar('abcdef12-0000', 'png').subscribe((a) => (nome = a.nome));

    const req = http.expectOne((r) => r.url.endsWith('/lancamentos/abcdef12-0000/recibo'));
    expect(req.request.params.get('formato')).toBe('png');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['x']), {
      headers: new HttpHeaders({ 'Content-Disposition': 'inline; filename="recibo-ABCDEF12.png"' }),
    });

    expect(nome).toBe('recibo-ABCDEF12.png');
  });

  it('usa nome padrão sem Content-Disposition e reaproveita o arquivo na segunda chamada', () => {
    let nome = '';
    service.baixar('abcdef12-0000').subscribe();
    http.expectOne((r) => r.url.includes('/recibo')).flush(new Blob(['x']));

    service.baixar('abcdef12-0000').subscribe((a) => (nome = a.nome));
    http.expectNone((r) => r.url.includes('/recibo'));

    expect(nome).toBe('recibo-ABCDEF12.pdf');
  });

  it('extrai Retry-After de um 429', () => {
    const err = new HttpErrorResponse({ status: 429, headers: new HttpHeaders({ 'Retry-After': '12' }) });
    expect(service.segundosParaTentarNovamente(err)).toBe(12);
    expect(service.segundosParaTentarNovamente(new HttpErrorResponse({ status: 404 }))).toBeNull();
  });
});

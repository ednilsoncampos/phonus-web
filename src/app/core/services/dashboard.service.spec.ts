import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DashboardService } from './dashboard.service';
import { DashboardData } from '../models/dashboard.model';

describe('DashboardService', () => {
  let service: DashboardService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('carregar faz GET /dashboard e retorna dados', () => {
    const mockData: DashboardData = {
      saldoCaixa: 10000,
      totalAReceber: 5000,
      totalAPagar: 3000,
      contasVencidas: 1,
      produtosAbaixoDoMinimo: 2,
    };

    let result: DashboardData | undefined;
    service.carregar().subscribe((d) => (result = d));

    httpMock.expectOne((r) => r.url.endsWith('/dashboard')).flush(mockData);

    expect(result).toEqual(mockData);
  });
});

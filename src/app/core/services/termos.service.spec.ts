import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TermosService } from './termos.service';
import { Termos } from '../models/termos.model';

const mockTermos: Termos = {
  id: 't1',
  versao: '1.0',
  titulo: 'Termos de Uso',
  conteudo: 'Conteúdo dos termos...',
  declaracaoAceite: 'Li e aceito os termos.',
  ativo: true,
};

describe('TermosService', () => {
  let service: TermosService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TermosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('listarVersoes faz GET /termos/admin', () => {
    let result: Termos[] | undefined;
    service.listarVersoes().subscribe((r) => (result = r));

    httpMock.expectOne((r) => r.url.endsWith('/termos/admin')).flush([mockTermos]);
    expect(result).toHaveLength(1);
    expect(result![0].versao).toBe('1.0');
  });

  it('criarVersao faz POST /termos/admin com os dados corretos', () => {
    let result: Termos | undefined;
    service
      .criarVersao({
        versao: '2.0',
        titulo: 'Novos Termos',
        conteudo: 'Novo conteúdo',
        declaracaoAceite: 'Aceito os novos termos.',
      })
      .subscribe((r) => (result = r));

    const req = httpMock.expectOne(
      (r) => r.url.endsWith('/termos/admin') && r.method === 'POST',
    );
    expect(req.request.body.versao).toBe('2.0');
    expect(req.request.body.titulo).toBe('Novos Termos');
    req.flush({ ...mockTermos, versao: '2.0' });
    expect(result?.versao).toBe('2.0');
  });

  it('buscarAtual faz GET /termos/atual', () => {
    let result: Termos | undefined;
    service.buscarAtual().subscribe((r) => (result = r));

    httpMock.expectOne((r) => r.url.endsWith('/termos/atual')).flush(mockTermos);
    expect(result?.ativo).toBe(true);
    expect(result?.titulo).toBe('Termos de Uso');
  });
});

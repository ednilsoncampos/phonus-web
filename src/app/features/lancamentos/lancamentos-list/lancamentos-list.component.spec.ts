import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { of } from 'rxjs';
import { LancamentosListComponent } from './lancamentos-list.component';
import { LancamentoService } from '../../../core/services/lancamento.service';
import { LancamentoResponse, ParcelaResponse } from '../../../core/models/lancamento.model';

const mockLancamento: LancamentoResponse = {
  id: 'l1',
  usuarioId: 'u1',
  tipo: 'SAIDA_CAIXA',
  descricao: 'Compra de material',
  valorTotal: 5000,
  formaPagamento: 'PIX',
  origem: 'TEXTO',
  dataLancamento: '2026-04-01',
  parcelas: [],
  itens: [],
};

describe('LancamentosListComponent', () => {
  let service: LancamentoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [LancamentosListComponent],
      providers: [
        provideRouter([]),
        provideAnimationsAsync(),
      ],
    });
    service = TestBed.inject(LancamentoService);
    vi.spyOn(service, 'listar').mockReturnValue(
      of({ content: [mockLancamento], totalElements: 1, totalPages: 1, page: 0, size: 20, last: true }),
    );
  });

  it('formaLabel retorna o rótulo correto para cada forma de pagamento', () => {
    const fixture = TestBed.createComponent(LancamentosListComponent);
    const comp = fixture.componentInstance as any;
    expect(comp.formaLabel('PIX')).toBe('PIX');
    expect(comp.formaLabel('DINHEIRO')).toBe('Dinheiro');
    expect(comp.formaLabel('DEBITO')).toBe('Débito');
    expect(comp.formaLabel('CREDITO')).toBe('Crédito');
    expect(comp.formaLabel('CHEQUE')).toBe('Cheque');
    expect(comp.formaLabel('PROMISSORIA')).toBe('Promissória');
  });

  it('formaLabel retorna o próprio valor para forma desconhecida', () => {
    const fixture = TestBed.createComponent(LancamentosListComponent);
    const comp = fixture.componentInstance as any;
    expect(comp.formaLabel('DESCONHECIDA')).toBe('DESCONHECIDA');
  });

  it('todosPago retorna false quando array é vazio', () => {
    const fixture = TestBed.createComponent(LancamentosListComponent);
    const comp = fixture.componentInstance;
    expect(comp.todosPago([])).toBe(false);
  });

  it('todosPago retorna true quando todas as parcelas estão pagas', () => {
    const fixture = TestBed.createComponent(LancamentosListComponent);
    const comp = fixture.componentInstance;
    const parcelas: ParcelaResponse[] = [
      { id: 'p1', numeroParcela: 1, totalParcelas: 2, valorParcela: 500, dataVencimento: '2026-05-01', status: 'PAGA' },
      { id: 'p2', numeroParcela: 2, totalParcelas: 2, valorParcela: 500, dataVencimento: '2026-06-01', status: 'PAGA' },
    ];
    expect(comp.todosPago(parcelas)).toBe(true);
  });

  it('todosPago retorna false quando alguma parcela está em aberto', () => {
    const fixture = TestBed.createComponent(LancamentosListComponent);
    const comp = fixture.componentInstance;
    const parcelas: ParcelaResponse[] = [
      { id: 'p1', numeroParcela: 1, totalParcelas: 2, valorParcela: 500, dataVencimento: '2026-05-01', status: 'PAGA' },
      { id: 'p2', numeroParcela: 2, totalParcelas: 2, valorParcela: 500, dataVencimento: '2026-06-01', status: 'EM_ABERTO' },
    ];
    expect(comp.todosPago(parcelas)).toBe(false);
  });

  it('resumoParcelas retorna "—" quando array é vazio', () => {
    const fixture = TestBed.createComponent(LancamentosListComponent);
    const comp = fixture.componentInstance;
    expect(comp.resumoParcelas([])).toBe('—');
  });

  it('resumoParcelas retorna "Pago" quando todas estão pagas', () => {
    const fixture = TestBed.createComponent(LancamentosListComponent);
    const comp = fixture.componentInstance;
    const parcelas: ParcelaResponse[] = [
      { id: 'p1', numeroParcela: 1, totalParcelas: 1, valorParcela: 1000, dataVencimento: '2026-05-01', status: 'PAGA' },
    ];
    expect(comp.resumoParcelas(parcelas)).toBe('Pago');
  });

  it('resumoParcelas retorna "Em aberto" para uma única parcela não paga', () => {
    const fixture = TestBed.createComponent(LancamentosListComponent);
    const comp = fixture.componentInstance;
    const parcelas: ParcelaResponse[] = [
      { id: 'p1', numeroParcela: 1, totalParcelas: 1, valorParcela: 1000, dataVencimento: '2026-05-01', status: 'EM_ABERTO' },
    ];
    expect(comp.resumoParcelas(parcelas)).toBe('Em aberto');
  });

  it('resumoParcelas retorna "X/Y pagas" para parcelamentos parcialmente pagos', () => {
    const fixture = TestBed.createComponent(LancamentosListComponent);
    const comp = fixture.componentInstance;
    const parcelas: ParcelaResponse[] = [
      { id: 'p1', numeroParcela: 1, totalParcelas: 3, valorParcela: 333, dataVencimento: '2026-05-01', status: 'PAGA' },
      { id: 'p2', numeroParcela: 2, totalParcelas: 3, valorParcela: 333, dataVencimento: '2026-06-01', status: 'EM_ABERTO' },
      { id: 'p3', numeroParcela: 3, totalParcelas: 3, valorParcela: 334, dataVencimento: '2026-07-01', status: 'EM_ABERTO' },
    ];
    expect(comp.resumoParcelas(parcelas)).toBe('1/3 pagas');
  });

  it('onFiltroChange reseta a página para 0 e recarrega', () => {
    const fixture = TestBed.createComponent(LancamentosListComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.page.set(3);
    comp.onFiltroChange();

    expect(comp.page()).toBe(0);
    expect(service.listar).toHaveBeenCalledTimes(2); // ngOnInit + onFiltroChange
  });
});

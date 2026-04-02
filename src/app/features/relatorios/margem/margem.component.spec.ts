import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { of, throwError } from 'rxjs';
import { MargemComponent } from './margem.component';
import { RelatorioService } from '../../../core/services/relatorio.service';
import { RelatorioMargemResponse } from '../../../core/models/relatorio.model';

const mockMargem: RelatorioMargemResponse = {
  totalProdutos: 3,
  margemMedia: 42,
  itens: [
    { produtoId: 'p1', nome: 'A', precoVenda: 1000, precoCusto: 900, margemPercentual: 10 },
    { produtoId: 'p2', nome: 'B', precoVenda: 2000, precoCusto: 1000, margemPercentual: 50 },
    { produtoId: 'p3', nome: 'C', precoVenda: 500, precoCusto: 460, margemPercentual: 8 },
  ],
};

describe('MargemComponent', () => {
  let service: RelatorioService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MargemComponent],
      providers: [provideRouter([]), provideAnimationsAsync()],
    });
    service = TestBed.inject(RelatorioService);
    vi.spyOn(service, 'buscarMargem').mockReturnValue(of(mockMargem));
  });

  it('carregar preenche dados após sucesso', () => {
    const fixture = TestBed.createComponent(MargemComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    expect(service.buscarMargem).toHaveBeenCalled();
    expect(comp.dados()).toEqual(mockMargem);
  });

  it('carregar define erro quando falha', () => {
    vi.spyOn(service, 'buscarMargem').mockReturnValue(
      throwError(() => new Error('falha')),
    );
    const fixture = TestBed.createComponent(MargemComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    expect(comp.erro()).toBe('Não foi possível carregar o relatório de margem.');
    expect(comp.dados()).toBeNull();
  });

  it('qtdBaixa conta corretamente produtos com margem < 10 (p3=8% é baixa, p1=10% não é)', () => {
    const fixture = TestBed.createComponent(MargemComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    // MARGEM_BAIXA = 10, condição é < 10
    // p1=10% NÃO é baixa, p2=50% NÃO é baixa, p3=8% É baixa → qtdBaixa = 1
    expect(comp.qtdBaixa()).toBe(1);
  });
});

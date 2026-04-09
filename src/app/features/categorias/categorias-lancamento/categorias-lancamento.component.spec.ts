import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { of, throwError } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { CategoriasLancamentoComponent } from './categorias-lancamento.component';
import { CategoriaLancamentoService } from '../../../core/services/categoria-lancamento.service';
import { CategoriaLancamento } from '../../../core/models/categoria-lancamento.model';

const mockCat: CategoriaLancamento = { id: 'cat1', nome: 'Salário', tipo: 'ENTRADA_CAIXA', ativo: true };

describe('CategoriasLancamentoComponent', () => {
  let service: CategoriaLancamentoService;
  let dialog: MatDialog;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CategoriasLancamentoComponent],
      providers: [provideRouter([]), provideAnimationsAsync()],
    });
    service = TestBed.inject(CategoriaLancamentoService);
    dialog = TestBed.inject(MatDialog);
    vi.spyOn(service, 'listar').mockReturnValue(of([mockCat]));
  });

  it('tipoLabel retorna o rótulo correto para ENTRADA_CAIXA', () => {
    const fixture = TestBed.createComponent(CategoriasLancamentoComponent);
    const comp = fixture.componentInstance;
    expect(comp.tipoLabel('ENTRADA_CAIXA')).toBe('Entrada de Caixa');
  });

  it('tipoLabel retorna o rótulo correto para SAIDA_CAIXA', () => {
    const fixture = TestBed.createComponent(CategoriasLancamentoComponent);
    const comp = fixture.componentInstance;
    expect(comp.tipoLabel('SAIDA_CAIXA')).toBe('Saída de Caixa');
  });

  it('tipoCss retorna a classe correta para ENTRADA_CAIXA', () => {
    const fixture = TestBed.createComponent(CategoriasLancamentoComponent);
    const comp = fixture.componentInstance;
    expect(comp.tipoCss('ENTRADA_CAIXA')).toBe('badge badge--green');
  });

  it('carregar preenche categorias após sucesso', () => {
    const fixture = TestBed.createComponent(CategoriasLancamentoComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    expect(service.listar).toHaveBeenCalled();
    expect(comp.categorias()).toEqual([mockCat]);
  });

  it('carregar define erro após falha', () => {
    vi.spyOn(service, 'listar').mockReturnValue(
      throwError(() => new Error('falha')),
    );
    const fixture = TestBed.createComponent(CategoriasLancamentoComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    expect(comp.erro()).toBe('Não foi possível carregar as categorias.');
    expect(comp.categorias()).toEqual([]);
  });
});

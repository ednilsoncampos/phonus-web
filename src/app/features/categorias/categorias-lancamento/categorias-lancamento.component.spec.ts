import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { of, throwError } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { CategoriasLancamentoComponent } from './categorias-lancamento.component';
import { CategoriaLancamentoService } from '../../../core/services/categoria-lancamento.service';
import { CategoriaLancamento } from '../../../core/models/categoria-lancamento.model';

const mockCat: CategoriaLancamento = { id: 'cat1', nome: 'Salário', tipo: 'ENTRADA', ativo: true };

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

  it('tipoLabel retorna o rótulo correto para ENTRADA', () => {
    const fixture = TestBed.createComponent(CategoriasLancamentoComponent);
    const comp = fixture.componentInstance;
    expect(comp.tipoLabel('ENTRADA')).toBe('Entrada');
  });

  it('tipoLabel retorna o rótulo correto para SAIDA', () => {
    const fixture = TestBed.createComponent(CategoriasLancamentoComponent);
    const comp = fixture.componentInstance;
    expect(comp.tipoLabel('SAIDA')).toBe('Saída');
  });

  it('tipoLabel retorna o rótulo correto para AMBOS', () => {
    const fixture = TestBed.createComponent(CategoriasLancamentoComponent);
    const comp = fixture.componentInstance;
    expect(comp.tipoLabel('AMBOS')).toBe('Ambos');
  });

  it('tipoCss retorna a classe correta para ENTRADA', () => {
    const fixture = TestBed.createComponent(CategoriasLancamentoComponent);
    const comp = fixture.componentInstance;
    expect(comp.tipoCss('ENTRADA')).toBe('badge badge--green');
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

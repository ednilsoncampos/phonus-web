import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { of, throwError } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { CategoriasProdutoComponent } from './categorias-produto.component';
import { CategoriaProdutoService } from '../../../core/services/categoria-produto.service';
import { CategoriaProduto } from '../../../core/models/categoria-produto.model';

const mockCategoria: CategoriaProduto = { id: 'cp1', nome: 'Alimentos', ativo: true };

describe('CategoriasProdutoComponent', () => {
  let service: CategoriaProdutoService;
  let dialog: MatDialog;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CategoriasProdutoComponent],
      providers: [provideRouter([]), provideAnimationsAsync()],
    });
    service = TestBed.inject(CategoriaProdutoService);
    dialog = TestBed.inject(MatDialog);
    vi.spyOn(service, 'listar').mockReturnValue(of([mockCategoria]));
  });

  it('carregar preenche categorias após sucesso', () => {
    const fixture = TestBed.createComponent(CategoriasProdutoComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    expect(service.listar).toHaveBeenCalled();
    expect(comp.categorias()).toEqual([mockCategoria]);
  });

  it('carregar define erro após falha', () => {
    vi.spyOn(service, 'listar').mockReturnValue(
      throwError(() => new Error('falha')),
    );
    const fixture = TestBed.createComponent(CategoriasProdutoComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    expect(comp.erro()).toBe('Não foi possível carregar as categorias.');
    expect(comp.categorias()).toEqual([]);
  });

  it('abrirDialog novo: quando fecha com resultado, adiciona à lista', () => {
    const novaCategoria: CategoriaProduto = { id: 'cp2', nome: 'Bebidas', ativo: true };
    vi.spyOn(dialog, 'open').mockReturnValue({
      afterClosed: () => of(novaCategoria),
    } as any);

    const fixture = TestBed.createComponent(CategoriasProdutoComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.abrirDialog();

    expect(dialog.open).toHaveBeenCalled();
    expect(comp.categorias()).toContain(novaCategoria);
  });
});

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { of, throwError } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { FornecedoresListComponent } from './fornecedores-list.component';
import { FornecedorService } from '../../../core/services/fornecedor.service';
import { Fornecedor } from '../../../core/models/fornecedor.model';

const mockFornecedor: Fornecedor = { id: 'f1', nome: 'Distribuidora ABC', ativo: true };
const mockPage = {
  content: [mockFornecedor],
  totalElements: 1,
  totalPages: 1,
  page: 0,
  size: 20,
  last: true,
};

describe('FornecedoresListComponent', () => {
  let service: FornecedorService;
  let dialog: MatDialog;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FornecedoresListComponent],
      providers: [provideRouter([]), provideAnimationsAsync()],
    });
    service = TestBed.inject(FornecedorService);
    dialog = TestBed.inject(MatDialog);
    vi.spyOn(service, 'listar').mockReturnValue(of(mockPage));
  });

  it('carregar chama FornecedorService.listar e preenche o signal fornecedores', () => {
    const fixture = TestBed.createComponent(FornecedoresListComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    expect(service.listar).toHaveBeenCalled();
    expect(comp.fornecedores()).toEqual([mockFornecedor]);
    expect(comp.totalElements()).toBe(1);
  });

  it('carregar define erro quando a requisição falha', () => {
    vi.spyOn(service, 'listar').mockReturnValue(
      throwError(() => new Error('falha')),
    );
    const fixture = TestBed.createComponent(FornecedoresListComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    expect(comp.erro()).toBe('Não foi possível carregar os fornecedores.');
    expect(comp.fornecedores()).toEqual([]);
  });

  it('setApenasAtivos(false) reseta page para 0 e recarrega', () => {
    const fixture = TestBed.createComponent(FornecedoresListComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.page.set(3);
    comp.setApenasAtivos(false);

    expect(comp.page()).toBe(0);
    expect(comp.apenasAtivos()).toBe(false);
    expect(service.listar).toHaveBeenCalledTimes(2); // ngOnInit + setApenasAtivos
  });

  it('onPage atualiza page e recarrega', () => {
    const fixture = TestBed.createComponent(FornecedoresListComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.onPage({ pageIndex: 2, pageSize: 20, length: 40 });

    expect(comp.page()).toBe(2);
    expect(service.listar).toHaveBeenCalledTimes(2); // ngOnInit + onPage
  });

  it('abrirDialog novo fornecedor: quando fecha com resultado, adiciona à lista', () => {
    const novoFornecedor: Fornecedor = { id: 'f2', nome: 'Fornecedor XYZ', ativo: true };
    vi.spyOn(dialog, 'open').mockReturnValue({
      afterClosed: () => of(novoFornecedor),
    } as any);

    const fixture = TestBed.createComponent(FornecedoresListComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.abrirDialog();

    expect(dialog.open).toHaveBeenCalled();
    expect(comp.fornecedores()).toContain(novoFornecedor);
  });

  it('abrirDialog edição: quando fecha com resultado, atualiza o item existente', () => {
    const fornecedorAtualizado: Fornecedor = { id: 'f1', nome: 'Distribuidora Atualizada', ativo: true };
    vi.spyOn(dialog, 'open').mockReturnValue({
      afterClosed: () => of(fornecedorAtualizado),
    } as any);

    const fixture = TestBed.createComponent(FornecedoresListComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.abrirDialog(mockFornecedor);

    expect(comp.fornecedores()).toEqual([fornecedorAtualizado]);
  });
});

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { of, throwError } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ClientesListComponent } from './clientes-list.component';
import { ClienteService } from '../../../core/services/cliente.service';
import { Cliente } from '../../../core/models/cliente.model';

const mockCliente: Cliente = { id: 'c1', nome: 'João', ativo: true };
const mockPage = {
  content: [mockCliente],
  totalElements: 1,
  totalPages: 1,
  page: 0,
  size: 20,
  last: true,
};

describe('ClientesListComponent', () => {
  let service: ClienteService;
  let dialog: MatDialog;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ClientesListComponent],
      providers: [provideRouter([]), provideAnimationsAsync()],
    });
    service = TestBed.inject(ClienteService);
    dialog = TestBed.inject(MatDialog);
    vi.spyOn(service, 'listar').mockReturnValue(of(mockPage));
  });

  it('carregar chama ClienteService.listar e preenche o signal clientes', () => {
    const fixture = TestBed.createComponent(ClientesListComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    expect(service.listar).toHaveBeenCalled();
    expect(comp.clientes()).toEqual([mockCliente]);
    expect(comp.totalElements()).toBe(1);
  });

  it('carregar define erro quando a requisição falha', () => {
    vi.spyOn(service, 'listar').mockReturnValue(
      throwError(() => new Error('falha')),
    );
    const fixture = TestBed.createComponent(ClientesListComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    expect(comp.erro()).toBe('Não foi possível carregar os clientes.');
    expect(comp.clientes()).toEqual([]);
  });

  it('setApenasAtivos(false) reseta page para 0 e recarrega', () => {
    const fixture = TestBed.createComponent(ClientesListComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.page.set(3);
    comp.setApenasAtivos(false);

    expect(comp.page()).toBe(0);
    expect(comp.apenasAtivos()).toBe(false);
    expect(service.listar).toHaveBeenCalledTimes(2); // ngOnInit + setApenasAtivos
  });

  it('onPage atualiza page e recarrega', () => {
    const fixture = TestBed.createComponent(ClientesListComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.onPage({ pageIndex: 2, pageSize: 20, length: 40 });

    expect(comp.page()).toBe(2);
    expect(service.listar).toHaveBeenCalledTimes(2); // ngOnInit + onPage
  });

  it('abrirDialog novo cliente: quando fecha com resultado, adiciona à lista', () => {
    const novoCliente: Cliente = { id: 'c2', nome: 'Maria', ativo: true };
    vi.spyOn(dialog, 'open').mockReturnValue({
      afterClosed: () => of(novoCliente),
    } as any);

    const fixture = TestBed.createComponent(ClientesListComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.abrirDialog();

    expect(dialog.open).toHaveBeenCalled();
    expect(comp.clientes()).toContain(novoCliente);
  });

  it('abrirDialog edição: quando fecha com resultado, atualiza o item existente', () => {
    const clienteAtualizado: Cliente = { id: 'c1', nome: 'João Atualizado', ativo: true };
    vi.spyOn(dialog, 'open').mockReturnValue({
      afterClosed: () => of(clienteAtualizado),
    } as any);

    const fixture = TestBed.createComponent(ClientesListComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.abrirDialog(mockCliente);

    expect(comp.clientes()).toEqual([clienteAtualizado]);
  });
});

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { of, throwError } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { TermosListComponent } from './termos-list.component';
import { TermosService } from '../../../core/services/termos.service';
import { Termos } from '../../../core/models/termos.model';

const mockTermos: Termos = {
  id: 't1',
  versao: '1.0',
  titulo: 'Termos',
  conteudo: '...',
  declaracaoAceite: 'Aceito',
  ativo: true,
};

describe('TermosListComponent', () => {
  let service: TermosService;
  let dialog: MatDialog;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TermosListComponent],
      providers: [provideRouter([]), provideAnimationsAsync()],
    });
    service = TestBed.inject(TermosService);
    dialog = TestBed.inject(MatDialog);
    vi.spyOn(service, 'listarVersoes').mockReturnValue(of([mockTermos]));
  });

  it('carregar preenche versoes', () => {
    const fixture = TestBed.createComponent(TermosListComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    expect(service.listarVersoes).toHaveBeenCalled();
    expect(comp.versoes()).toEqual([mockTermos]);
  });

  it('carregar define erro quando falha', () => {
    vi.spyOn(service, 'listarVersoes').mockReturnValue(
      throwError(() => new Error('falha')),
    );
    const fixture = TestBed.createComponent(TermosListComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    expect(comp.erro()).toBe('Não foi possível carregar as versões dos termos.');
    expect(comp.versoes()).toEqual([]);
  });

  it('abrirNovaVersao: nova versão adicionada ao início e existentes ficam ativo: false', () => {
    const novaVersao: Termos = {
      id: 't2',
      versao: '2.0',
      titulo: 'Termos v2',
      conteudo: '...',
      declaracaoAceite: 'Aceito v2',
      ativo: true,
    };
    vi.spyOn(dialog, 'open').mockReturnValue({
      afterClosed: () => of(novaVersao),
    } as any);

    const fixture = TestBed.createComponent(TermosListComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.abrirNovaVersao();

    expect(dialog.open).toHaveBeenCalled();
    const lista = comp.versoes();
    expect(lista[0]).toEqual(novaVersao);
    expect(lista[1]).toEqual({ ...mockTermos, ativo: false });
  });
});

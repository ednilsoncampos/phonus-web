import { TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { ReaceiteTermosDialog } from './reaceite-termos-dialog';
import { TermosService } from '../../../core/services/termos.service';
import { Termos } from '../../../core/models/termos.model';

const mockTermos: Termos = {
  id: 't2',
  versao: '2.0',
  titulo: 'Termos de Uso',
  conteudo: 'Conteúdo atualizado dos termos.',
  declaracaoAceite: 'Declaro que li e aceito os termos.',
  ativo: true,
};

const dialogRefMock = { close: vi.fn() };

describe('ReaceiteTermosDialog', () => {
  let service: TermosService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReaceiteTermosDialog],
      providers: [
        provideAnimationsAsync(),
        { provide: MatDialogRef, useValue: dialogRefMock },
      ],
    });
    dialogRefMock.close.mockReset();
    service = TestBed.inject(TermosService);
  });

  it('carrega os termos vigentes ao iniciar', () => {
    vi.spyOn(service, 'buscarAtual').mockReturnValue(of(mockTermos));
    const fixture = TestBed.createComponent(ReaceiteTermosDialog);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    expect(comp.termos()).toEqual(mockTermos);
    expect(comp.carregando()).toBe(false);
  });

  it('exibe erro quando não consegue carregar os termos', () => {
    vi.spyOn(service, 'buscarAtual').mockReturnValue(throwError(() => ({ status: 500 })));
    const fixture = TestBed.createComponent(ReaceiteTermosDialog);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    expect(comp.erro()).toBe('Não foi possível carregar os termos vigentes.');
  });

  it('aceitar chama TermosService.aceitar e fecha o dialog', () => {
    vi.spyOn(service, 'buscarAtual').mockReturnValue(of(mockTermos));
    vi.spyOn(service, 'aceitar').mockReturnValue(of(undefined));
    const fixture = TestBed.createComponent(ReaceiteTermosDialog);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.aceitar();

    expect(service.aceitar).toHaveBeenCalledWith('t2');
    expect(dialogRefMock.close).toHaveBeenCalledWith(true);
  });

  it('exibe erro quando o aceite falha', () => {
    vi.spyOn(service, 'buscarAtual').mockReturnValue(of(mockTermos));
    vi.spyOn(service, 'aceitar').mockReturnValue(
      throwError(() => ({ error: { message: 'Versão não é mais a vigente.' } })),
    );
    const fixture = TestBed.createComponent(ReaceiteTermosDialog);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.aceitar();

    expect(comp.erro()).toBe('Versão não é mais a vigente.');
    expect(dialogRefMock.close).not.toHaveBeenCalled();
  });
});

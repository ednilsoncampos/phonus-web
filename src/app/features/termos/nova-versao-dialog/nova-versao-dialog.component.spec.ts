import { TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { NovaVersaoDialogComponent } from './nova-versao-dialog.component';
import { TermosService } from '../../../core/services/termos.service';
import { Termos } from '../../../core/models/termos.model';

const mockTermos: Termos = {
  id: 't1',
  versao: '1.0',
  titulo: 'Termos de Uso',
  conteudo: 'Conteúdo completo dos termos.',
  declaracaoAceite: 'Declaro que li e aceito os termos.',
  ativo: true,
};

const dialogRefMock = { close: vi.fn() };

describe('NovaVersaoDialogComponent', () => {
  let service: TermosService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NovaVersaoDialogComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: MatDialogRef, useValue: dialogRefMock },
      ],
    });
    dialogRefMock.close.mockReset();
    service = TestBed.inject(TermosService);
  });

  it('form inválido não chama criarVersao', () => {
    const criarSpy = vi.spyOn(service, 'criarVersao');
    const fixture = TestBed.createComponent(NovaVersaoDialogComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.form.patchValue({ versao: '', titulo: '', conteudo: '', declaracaoAceite: '' });
    comp.salvar();

    expect(criarSpy).not.toHaveBeenCalled();
  });

  it('salvar bem-sucedido fecha o dialog com os termos', () => {
    vi.spyOn(service, 'criarVersao').mockReturnValue(of(mockTermos));
    const fixture = TestBed.createComponent(NovaVersaoDialogComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.form.patchValue({
      versao: '1.0',
      titulo: 'Termos de Uso',
      conteudo: 'Conteúdo completo dos termos.',
      declaracaoAceite: 'Declaro que li e aceito os termos.',
    });
    comp.salvar();

    expect(service.criarVersao).toHaveBeenCalled();
    expect(dialogRefMock.close).toHaveBeenCalledWith(mockTermos);
    expect(comp.salvando()).toBe(false);
  });

  it('erro 409 exibe mensagem sobre versão duplicada', () => {
    vi.spyOn(service, 'criarVersao').mockReturnValue(
      throwError(() => ({ status: 409 })),
    );
    const fixture = TestBed.createComponent(NovaVersaoDialogComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.form.patchValue({
      versao: '1.0',
      titulo: 'Termos de Uso',
      conteudo: 'Conteúdo completo dos termos.',
      declaracaoAceite: 'Declaro que li e aceito os termos.',
    });
    comp.salvar();

    expect(comp.erro()).toBe('Já existe uma versão com esse número. Use uma versão diferente.');
    expect(dialogRefMock.close).not.toHaveBeenCalled();
  });

  it('outros erros exibem err.error.message', () => {
    vi.spyOn(service, 'criarVersao').mockReturnValue(
      throwError(() => ({ status: 500, error: { message: 'Erro interno do servidor.' } })),
    );
    const fixture = TestBed.createComponent(NovaVersaoDialogComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.form.patchValue({
      versao: '1.0',
      titulo: 'Termos de Uso',
      conteudo: 'Conteúdo.',
      declaracaoAceite: 'Aceito.',
    });
    comp.salvar();

    expect(comp.erro()).toBe('Erro interno do servidor.');
  });

  it('outros erros sem message exibem mensagem genérica', () => {
    vi.spyOn(service, 'criarVersao').mockReturnValue(
      throwError(() => ({ status: 500 })),
    );
    const fixture = TestBed.createComponent(NovaVersaoDialogComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.form.patchValue({
      versao: '1.0',
      titulo: 'Termos de Uso',
      conteudo: 'Conteúdo.',
      declaracaoAceite: 'Aceito.',
    });
    comp.salvar();

    expect(comp.erro()).toBe('Erro ao publicar versão.');
  });

  it('cancelar fecha o dialog sem dados', () => {
    const fixture = TestBed.createComponent(NovaVersaoDialogComponent);
    fixture.detectChanges();
    fixture.componentInstance.cancelar();
    expect(dialogRefMock.close).toHaveBeenCalledWith();
  });
});

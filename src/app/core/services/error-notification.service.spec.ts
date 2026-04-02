import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ErrorNotificationService } from './error-notification.service';

describe('ErrorNotificationService', () => {
  let service: ErrorNotificationService;
  let snackBar: MatSnackBar;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideAnimationsAsync()],
    });
    service = TestBed.inject(ErrorNotificationService);
    snackBar = TestBed.inject(MatSnackBar);
  });

  it('show abre o snackBar com a mensagem fornecida', () => {
    const openSpy = vi.spyOn(snackBar, 'open');
    service.show('Erro ao salvar.');
    expect(openSpy).toHaveBeenCalledWith('Erro ao salvar.', 'Fechar', expect.objectContaining({
      duration: 7000,
      panelClass: ['snack-error'],
    }));
  });

  it('show usa posição inferior direita', () => {
    const openSpy = vi.spyOn(snackBar, 'open');
    service.show('Qualquer erro');
    expect(openSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        horizontalPosition: 'end',
        verticalPosition: 'bottom',
      }),
    );
  });
});

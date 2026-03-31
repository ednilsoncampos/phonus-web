import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ConfirmDialogComponent, ConfirmDialogData } from './confirm-dialog.component';

const mockData: ConfirmDialogData = {
  title: 'Confirmar',
  message: 'Tem certeza?',
};

describe('ConfirmDialogComponent', () => {
  let dialogRefSpy: { close: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    dialogRefSpy = { close: vi.fn() };

    TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        { provide: MatDialogRef, useValue: dialogRefSpy },
      ],
    });
  });

  it('confirm fecha dialog com true', () => {
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    fixture.detectChanges();

    fixture.componentInstance.confirm();

    expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
  });

  it('cancel fecha dialog com false', () => {
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    fixture.detectChanges();

    fixture.componentInstance.cancel();

    expect(dialogRefSpy.close).toHaveBeenCalledWith(false);
  });

  it('exibe título e mensagem do data', () => {
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Confirmar');
    expect(el.textContent).toContain('Tem certeza?');
  });

  it('usa labels padrão quando não fornecidos', () => {
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Cancelar');
    expect(el.textContent).toContain('Confirmar');
  });
});

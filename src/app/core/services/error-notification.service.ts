import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class ErrorNotificationService {
  private readonly snackBar = inject(MatSnackBar);

  show(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 7000,
      panelClass: ['snack-error'],
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
    });
  }
}

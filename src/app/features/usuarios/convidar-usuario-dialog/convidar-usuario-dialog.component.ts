import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UsuarioService } from '../../../core/services/usuario.service';
import { ConvidarUsuarioRequest, Papel } from '../../../core/models/usuario.model';

export interface ConvidarUsuarioDialogData {
  papelDoConvidante: Papel;
}

@Component({
  selector: 'app-convidar-usuario-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './convidar-usuario-dialog.component.html',
  styleUrl: './convidar-usuario-dialog.component.scss',
})
export class ConvidarUsuarioDialogComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly usuarioService = inject(UsuarioService);
  private readonly dialogRef = inject(MatDialogRef<ConvidarUsuarioDialogComponent>);
  protected readonly data = inject<ConvidarUsuarioDialogData>(MAT_DIALOG_DATA);

  readonly salvando = signal(false);
  readonly erro = signal<string | null>(null);

  readonly papeisDisponiveis = this.data.papelDoConvidante === 'ADMIN'
    ? [{ value: 'OPERADOR', label: 'Operador' }]
    : [
        { value: 'ADMIN', label: 'Admin' },
        { value: 'OPERADOR', label: 'Operador' },
      ];

  readonly form = this.fb.group({
    nome: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    papel: [this.papeisDisponiveis[0].value as ConvidarUsuarioRequest['papel'], Validators.required],
  });

  salvar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.salvando.set(true);
    this.erro.set(null);

    this.usuarioService.convidar(this.form.getRawValue()).subscribe({
      next: (usuario) => {
        this.salvando.set(false);
        this.dialogRef.close(usuario);
      },
      error: (err) => {
        this.salvando.set(false);
        const msg = err?.error?.message;
        this.erro.set(msg ?? 'Erro ao convidar usuário. Tente novamente.');
      },
    });
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}

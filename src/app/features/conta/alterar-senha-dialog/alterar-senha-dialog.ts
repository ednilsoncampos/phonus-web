import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/auth/auth.service';
import {
  senhaDiferenteDeEmailValidator,
  senhaForteValidator,
  senhasConferemValidator,
} from '../../../shared/validators/senha.validator';

@Component({
  selector: 'app-alterar-senha-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  templateUrl: './alterar-senha-dialog.html',
  styleUrl: './alterar-senha-dialog.scss',
})
export class AlterarSenhaDialog {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly dialogRef = inject(MatDialogRef<AlterarSenhaDialog>);

  readonly salvando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly hideSenhaAtual = signal(true);
  readonly hideNovaSenha = signal(true);
  readonly hideConfirmacao = signal(true);

  readonly form = this.fb.group(
    {
      senhaAtual: ['', Validators.required],
      novaSenha: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(72),
          senhaForteValidator(),
          senhaDiferenteDeEmailValidator(() => this.authService.currentUser()?.email),
        ],
      ],
      confirmarNovaSenha: ['', Validators.required],
    },
    { validators: senhasConferemValidator('novaSenha', 'confirmarNovaSenha') },
  );

  salvar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.salvando.set(true);
    this.erro.set(null);

    const { senhaAtual, novaSenha } = this.form.getRawValue();

    this.authService.alterarSenha({ senhaAtual, novaSenha }).subscribe({
      next: () => {
        this.salvando.set(false);
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.salvando.set(false);
        this.erro.set(
          err?.error?.message ?? 'Não foi possível alterar a senha. Verifique a senha atual e tente novamente.',
        );
      },
    });
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }
}

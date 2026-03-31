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
  styles: `
    .dialog-form { display: flex; flex-direction: column; gap: 4px; min-width: 380px; }
    .error-msg { color: var(--phonus-error); font-size: 13px; margin-top: 8px; }
    .spinner-wrap { display: flex; justify-content: center; padding: 8px 0; }
  `,
  template: `
    <h2 mat-dialog-title>Convidar usuário</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form" id="convidar-form">
        <mat-form-field appearance="outline">
          <mat-label>Nome</mat-label>
          <input matInput formControlName="nome" autocomplete="off" />
          @if (form.controls.nome.invalid && form.controls.nome.touched) {
            <mat-error>Nome é obrigatório</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>E-mail</mat-label>
          <input matInput formControlName="email" type="email" autocomplete="off" />
          @if (form.controls.email.hasError('required') && form.controls.email.touched) {
            <mat-error>E-mail é obrigatório</mat-error>
          } @else if (form.controls.email.hasError('email') && form.controls.email.touched) {
            <mat-error>E-mail inválido</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Papel</mat-label>
          <mat-select formControlName="papel">
            @for (opcao of papeisDisponiveis; track opcao.value) {
              <mat-option [value]="opcao.value">{{ opcao.label }}</mat-option>
            }
          </mat-select>
          @if (form.controls.papel.invalid && form.controls.papel.touched) {
            <mat-error>Papel é obrigatório</mat-error>
          }
        </mat-form-field>

        @if (erro()) {
          <p class="error-msg" role="alert">{{ erro() }}</p>
        }
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button [disabled]="salvando()" (click)="cancelar()">Cancelar</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="salvando()"
        (click)="salvar()"
      >
        @if (salvando()) {
          <div class="spinner-wrap">
            <mat-spinner diameter="20" />
          </div>
        } @else {
          Convidar
        }
      </button>
    </mat-dialog-actions>
  `,
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

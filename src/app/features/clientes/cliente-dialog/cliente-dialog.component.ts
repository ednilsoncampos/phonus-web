import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ClienteService } from '../../../core/services/cliente.service';
import { Cliente } from '../../../core/models/cliente.model';

export interface ClienteDialogData {
  cliente?: Cliente;
}

@Component({
  selector: 'app-cliente-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
  ],
  styles: `
    .dialog-form { display: flex; flex-direction: column; gap: 4px; min-width: 400px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0 12px; }
    .error-msg { color: var(--phonus-error); font-size: 13px; margin-top: 8px; }
  `,
  template: `
    <h2 mat-dialog-title>{{ editando ? 'Editar cliente' : 'Novo cliente' }}</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">

        <mat-form-field appearance="outline">
          <mat-label>Nome *</mat-label>
          <input matInput formControlName="nome" autocomplete="off" />
          @if (form.controls.nome.invalid && form.controls.nome.touched) {
            <mat-error>Nome é obrigatório</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Documento (CPF/CNPJ)</mat-label>
          <input matInput formControlName="documento" autocomplete="off" />
        </mat-form-field>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>E-mail</mat-label>
            <input matInput formControlName="email" type="email" autocomplete="off" />
            @if (form.controls.email.hasError('email') && form.controls.email.touched) {
              <mat-error>E-mail inválido</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Telefone</mat-label>
            <input matInput formControlName="telefone" autocomplete="off" />
          </mat-form-field>
        </div>

        @if (editando) {
          <mat-slide-toggle formControlName="ativo">Ativo</mat-slide-toggle>
        }

        @if (erro()) {
          <p class="error-msg" role="alert">{{ erro() }}</p>
        }
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button [disabled]="salvando()" (click)="cancelar()">Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="salvando()" (click)="salvar()">
        @if (salvando()) { <mat-spinner diameter="20" /> } @else { Salvar }
      </button>
    </mat-dialog-actions>
  `,
})
export class ClienteDialogComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(ClienteService);
  private readonly dialogRef = inject(MatDialogRef<ClienteDialogComponent>);
  protected readonly data = inject<ClienteDialogData>(MAT_DIALOG_DATA);

  readonly editando = !!this.data.cliente;
  readonly salvando = signal(false);
  readonly erro = signal<string | null>(null);

  readonly form = this.fb.group({
    nome:      [this.data.cliente?.nome      ?? '', Validators.required],
    documento: [this.data.cliente?.documento ?? ''],
    email:     [this.data.cliente?.email     ?? '', Validators.email],
    telefone:  [this.data.cliente?.telefone  ?? ''],
    ativo:     [this.data.cliente?.ativo     ?? true],
  });

  salvar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.salvando.set(true);
    this.erro.set(null);

    const { nome, documento, email, telefone, ativo } = this.form.getRawValue();

    const req$ = this.editando
      ? this.service.atualizar(this.data.cliente!.id, {
          nome,
          documento: documento || undefined,
          email: email || undefined,
          telefone: telefone || undefined,
          ativo,
        })
      : this.service.criar({
          nome,
          documento: documento || undefined,
          email: email || undefined,
          telefone: telefone || undefined,
        });

    req$.subscribe({
      next: (cliente) => {
        this.salvando.set(false);
        this.dialogRef.close(cliente);
      },
      error: (err) => {
        this.salvando.set(false);
        this.erro.set(err?.error?.message ?? 'Erro ao salvar. Tente novamente.');
      },
    });
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}

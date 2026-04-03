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
import { PhoneMaskDirective } from '../../../shared/directives/phone-mask.directive';

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
    PhoneMaskDirective,
  ],
  templateUrl: './cliente-dialog.component.html',
  styleUrl: './cliente-dialog.component.scss',
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

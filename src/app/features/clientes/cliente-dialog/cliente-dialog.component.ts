import { A11yModule } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ClienteService } from '../../../core/services/cliente.service';
import { Cliente } from '../../../core/models/cliente.model';
import { DocumentMaskDirective } from '../../../shared/directives/document-mask.directive';
import { PhoneMaskDirective } from '../../../shared/directives/phone-mask.directive';

export interface ClienteDialogData {
  cliente?: Cliente;
}

function documentoValidator(control: AbstractControl): ValidationErrors | null {
  const digits = (control.value as string)?.replace(/\D/g, '') ?? '';
  if (!digits) return null;
  if (digits.length !== 11 && digits.length !== 14) {
    return { documentoInvalido: true };
  }
  return null;
}

@Component({
  selector: 'app-cliente-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    A11yModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    DocumentMaskDirective,
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
  readonly idParaReativar = signal<string | null>(null);
  readonly reativando = signal(false);

  readonly form = this.fb.group({
    nome:      [this.data.cliente?.nome      ?? '', Validators.required],
    documento: [this.data.cliente?.documento ?? '', documentoValidator],
    email:     [this.data.cliente?.email     ?? '', Validators.email],
    telefone:  [this.data.cliente?.telefone  ?? ''],
    ativo:     [this.data.cliente?.ativo     ?? true],
  });

  salvar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.salvando.set(true);
    this.erro.set(null);
    this.idParaReativar.set(null);

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
      error: (err: { status?: number; error?: { message?: string; details?: { idExistente?: string } } }) => {
        this.salvando.set(false);
        if (err.status === 409 && err.error?.details?.idExistente) {
          this.idParaReativar.set(err.error.details.idExistente);
        } else {
          this.erro.set(err?.error?.message ?? 'Erro ao salvar. Tente novamente.');
        }
      },
    });
  }

  reativar(): void {
    const id = this.idParaReativar();
    if (!id) return;

    this.reativando.set(true);
    const { nome, documento, email, telefone } = this.form.getRawValue();

    this.service.atualizar(id, {
      nome,
      documento: documento || undefined,
      email: email || undefined,
      telefone: telefone || undefined,
      ativo: true,
    }).subscribe({
      next: (cliente) => {
        this.reativando.set(false);
        this.dialogRef.close(cliente);
      },
      error: (err: { error?: { message?: string } }) => {
        this.reativando.set(false);
        this.idParaReativar.set(null);
        this.erro.set(err?.error?.message ?? 'Erro ao reativar. Tente novamente.');
      },
    });
  }

  cancelarReativacao(): void {
    this.idParaReativar.set(null);
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}

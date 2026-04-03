import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FornecedorService } from '../../../core/services/fornecedor.service';
import { Fornecedor } from '../../../core/models/fornecedor.model';
import { PhoneMaskDirective } from '../../../shared/directives/phone-mask.directive';

export interface FornecedorDialogData {
  fornecedor?: Fornecedor;
}

@Component({
  selector: 'app-fornecedor-dialog',
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
  templateUrl: './fornecedor-dialog.component.html',
  styleUrl: './fornecedor-dialog.component.scss',
})
export class FornecedorDialogComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(FornecedorService);
  private readonly dialogRef = inject(MatDialogRef<FornecedorDialogComponent>);
  protected readonly data = inject<FornecedorDialogData>(MAT_DIALOG_DATA);

  readonly editando = !!this.data.fornecedor;
  readonly salvando = signal(false);
  readonly erro = signal<string | null>(null);

  readonly form = this.fb.group({
    nome:      [this.data.fornecedor?.nome      ?? '', Validators.required],
    documento: [this.data.fornecedor?.documento ?? ''],
    email:     [this.data.fornecedor?.email     ?? '', Validators.email],
    telefone:  [this.data.fornecedor?.telefone  ?? ''],
    ativo:     [this.data.fornecedor?.ativo     ?? true],
  });

  salvar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.salvando.set(true);
    this.erro.set(null);

    const { nome, documento, email, telefone, ativo } = this.form.getRawValue();

    const req$ = this.editando
      ? this.service.atualizar(this.data.fornecedor!.id, {
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
      next: (fornecedor) => {
        this.salvando.set(false);
        this.dialogRef.close(fornecedor);
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

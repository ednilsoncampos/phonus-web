import { A11yModule } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CategoriaLancamentoService } from '../../../core/services/categoria-lancamento.service';
import { CategoriaLancamento, TipoCategoria } from '../../../core/models/categoria-lancamento.model';

export interface CategoriaLancamentoDialogData {
  categoria?: CategoriaLancamento;
}

const TIPO_OPTIONS: { value: TipoCategoria; label: string }[] = [
  { value: 'ENTRADA_CAIXA', label: 'Entrada de Caixa' },
  { value: 'SAIDA_CAIXA',   label: 'Saída de Caixa'   },
];

@Component({
  selector: 'app-categoria-lancamento-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    A11yModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
  ],
  templateUrl: './categoria-lancamento-dialog.component.html',
  styleUrl: './categoria-lancamento-dialog.component.scss',
})
export class CategoriaLancamentoDialogComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(CategoriaLancamentoService);
  private readonly dialogRef = inject(MatDialogRef<CategoriaLancamentoDialogComponent>);
  protected readonly data = inject<CategoriaLancamentoDialogData>(MAT_DIALOG_DATA);

  readonly editando = !!this.data.categoria;
  readonly tipoOptions = TIPO_OPTIONS;
  readonly salvando = signal(false);
  readonly erro = signal<string | null>(null);

  readonly form = this.fb.group({
    nome: [this.data.categoria?.nome ?? '', Validators.required],
    tipo: [this.data.categoria?.tipo ?? 'ENTRADA_CAIXA' as TipoCategoria, Validators.required],
    ativo: [this.data.categoria?.ativo ?? true],
  });

  salvar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.salvando.set(true);
    this.erro.set(null);

    const { nome, tipo, ativo } = this.form.getRawValue();

    const req$ = this.editando
      ? this.service.editar(this.data.categoria!.id, { nome, tipo, ativo })
      : this.service.criar({ nome, tipo });

    req$.subscribe({
      next: (categoria) => {
        this.salvando.set(false);
        this.dialogRef.close(categoria);
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

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { EstoqueService } from '../../../core/services/estoque.service';
import { MovimentacaoEstoque } from '../../../core/models/estoque.model';
import { Produto } from '../../../core/models/produto.model';

export interface AjusteEstoqueDialogData {
  produto?: Produto;
  produtos?: Produto[];
}

@Component({
  selector: 'app-ajuste-estoque-dialog',
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
  templateUrl: './ajuste-estoque-dialog.component.html',
  styleUrl: './ajuste-estoque-dialog.component.scss',
})
export class AjusteEstoqueDialogComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly estoqueService = inject(EstoqueService);
  private readonly dialogRef = inject(MatDialogRef<AjusteEstoqueDialogComponent>);
  protected readonly data = inject<AjusteEstoqueDialogData>(MAT_DIALOG_DATA);

  readonly salvando = signal(false);
  readonly erro = signal<string | null>(null);

  readonly form = this.fb.group({
    produtoId: [
      this.data.produto?.id ?? '',
      this.data.produto ? [] : [Validators.required],
    ],
    tipo: ['AJUSTE_POSITIVO' as 'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO', Validators.required],
    quantidade: [null as number | null, [Validators.required, Validators.min(1)]],
    observacao: [''],
  });

  salvar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const { produtoId, tipo, quantidade, observacao } = this.form.getRawValue();
    const pid = this.data.produto?.id ?? produtoId;

    this.salvando.set(true);
    this.erro.set(null);

    this.estoqueService
      .ajustar(pid, {
        tipo,
        quantidade: quantidade!,
        observacao: observacao || undefined,
      })
      .subscribe({
        next: (mov) => {
          this.salvando.set(false);
          this.dialogRef.close(mov);
        },
        error: (err) => {
          this.salvando.set(false);
          this.erro.set(err?.error?.message ?? 'Erro ao registrar ajuste.');
        },
      });
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}

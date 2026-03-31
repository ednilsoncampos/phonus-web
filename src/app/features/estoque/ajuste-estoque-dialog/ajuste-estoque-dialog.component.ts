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
  styles: `
    .dialog-form { display: flex; flex-direction: column; gap: 4px; min-width: 380px; }
    .error-msg { color: var(--phonus-error); font-size: 13px; margin-top: 8px; }
    .produto-info {
      font-size: 15px;
      font-weight: 600;
      color: var(--phonus-text);
      padding: 8px 0 4px;
    }
  `,
  template: `
    <h2 mat-dialog-title>Ajustar estoque</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">

        @if (data.produto) {
          <p class="produto-info">{{ data.produto.nome }}</p>
        } @else {
          <mat-form-field appearance="outline">
            <mat-label>Produto *</mat-label>
            <mat-select formControlName="produtoId">
              @for (p of data.produtos ?? []; track p.id) {
                <mat-option [value]="p.id">{{ p.nome }}</mat-option>
              }
            </mat-select>
            @if (form.controls.produtoId.invalid && form.controls.produtoId.touched) {
              <mat-error>Produto é obrigatório</mat-error>
            }
          </mat-form-field>
        }

        <mat-form-field appearance="outline">
          <mat-label>Tipo de ajuste *</mat-label>
          <mat-select formControlName="tipo">
            <mat-option value="AJUSTE_POSITIVO">Entrada (adicionar ao estoque)</mat-option>
            <mat-option value="AJUSTE_NEGATIVO">Saída (remover do estoque)</mat-option>
          </mat-select>
          @if (form.controls.tipo.invalid && form.controls.tipo.touched) {
            <mat-error>Tipo é obrigatório</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Quantidade *</mat-label>
          <input matInput type="number" min="1" step="1" formControlName="quantidade" />
          @if (form.controls.quantidade.hasError('required') && form.controls.quantidade.touched) {
            <mat-error>Quantidade é obrigatória</mat-error>
          } @else if (form.controls.quantidade.hasError('min') && form.controls.quantidade.touched) {
            <mat-error>Deve ser maior que zero</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Observação</mat-label>
          <textarea matInput formControlName="observacao" rows="2"></textarea>
        </mat-form-field>

        @if (erro()) {
          <p class="error-msg" role="alert">{{ erro() }}</p>
        }
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button [disabled]="salvando()" (click)="cancelar()">Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="salvando()" (click)="salvar()">
        @if (salvando()) { <mat-spinner diameter="20" /> } @else { Confirmar }
      </button>
    </mat-dialog-actions>
  `,
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

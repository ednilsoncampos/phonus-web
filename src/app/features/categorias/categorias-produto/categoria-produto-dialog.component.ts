import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CategoriaProdutoService } from '../../../core/services/categoria-produto.service';
import { CategoriaProduto } from '../../../core/models/categoria-produto.model';

export interface CategoriaProdutoDialogData {
  categoria?: CategoriaProduto;
}

@Component({
  selector: 'app-categoria-produto-dialog',
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
    .dialog-form { display: flex; flex-direction: column; gap: 4px; min-width: 340px; }
    .error-msg { color: var(--phonus-error); font-size: 13px; margin-top: 8px; }
  `,
  template: `
    <h2 mat-dialog-title>{{ editando ? 'Editar categoria' : 'Nova categoria de produto' }}</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline">
          <mat-label>Nome</mat-label>
          <input matInput formControlName="nome" autocomplete="off" />
          @if (form.controls.nome.invalid && form.controls.nome.touched) {
            <mat-error>Nome é obrigatório</mat-error>
          }
        </mat-form-field>

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
export class CategoriaProdutoDialogComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(CategoriaProdutoService);
  private readonly dialogRef = inject(MatDialogRef<CategoriaProdutoDialogComponent>);
  protected readonly data = inject<CategoriaProdutoDialogData>(MAT_DIALOG_DATA);

  readonly editando = !!this.data.categoria;
  readonly salvando = signal(false);
  readonly erro = signal<string | null>(null);

  readonly form = this.fb.group({
    nome: [this.data.categoria?.nome ?? '', Validators.required],
    ativo: [this.data.categoria?.ativo ?? true],
  });

  salvar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.salvando.set(true);
    this.erro.set(null);

    const { nome, ativo } = this.form.getRawValue();

    const req$ = this.editando
      ? this.service.editar(this.data.categoria!.id, { nome, ativo })
      : this.service.criar({ nome });

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

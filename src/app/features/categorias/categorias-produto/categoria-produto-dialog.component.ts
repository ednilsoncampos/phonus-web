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
  templateUrl: './categoria-produto-dialog.component.html',
  styleUrl: './categoria-produto-dialog.component.scss',
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

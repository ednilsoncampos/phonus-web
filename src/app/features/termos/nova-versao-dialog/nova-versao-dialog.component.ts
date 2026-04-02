import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TermosService } from '../../../core/services/termos.service';
import { Termos } from '../../../core/models/termos.model';

@Component({
  selector: 'app-nova-versao-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './nova-versao-dialog.component.html',
  styleUrl: './nova-versao-dialog.component.scss',
})
export class NovaVersaoDialogComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(TermosService);
  private readonly dialogRef = inject(MatDialogRef<NovaVersaoDialogComponent>);

  readonly salvando = signal(false);
  readonly erro = signal<string | null>(null);

  readonly form = this.fb.group({
    versao:           ['', [Validators.required, Validators.maxLength(20)]],
    titulo:           ['', [Validators.required, Validators.maxLength(255)]],
    conteudo:         ['', Validators.required],
    declaracaoAceite: ['', Validators.required],
  });

  salvar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.salvando.set(true);
    this.erro.set(null);

    this.service.criarVersao(this.form.getRawValue()).subscribe({
      next: (termos) => {
        this.salvando.set(false);
        this.dialogRef.close(termos);
      },
      error: (err) => {
        this.salvando.set(false);
        const status = err?.status;
        if (status === 409) {
          this.erro.set('Já existe uma versão com esse número. Use uma versão diferente.');
        } else {
          this.erro.set(err?.error?.message ?? 'Erro ao publicar versão.');
        }
      },
    });
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}

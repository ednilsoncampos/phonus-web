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
  styles: `
    .dialog-form { display: flex; flex-direction: column; gap: 4px; min-width: 560px; }
    .aviso {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 10px 14px;
      border-radius: 8px;
      background: #fff7ed;
      border: 1px solid #fed7aa;
      color: #c2410c;
      font-size: 13px;
      margin-bottom: 4px;
    }
    .error-msg { color: var(--phonus-error); font-size: 13px; margin-top: 8px; }
  `,
  template: `
    <h2 mat-dialog-title>Nova versão dos Termos de Uso</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">

        <div class="aviso" role="note">
          <span>⚠️</span>
          <span>Ao criar uma nova versão, a versão atual será desativada automaticamente.</span>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Versão *</mat-label>
          <input matInput formControlName="versao" placeholder="ex: 1.2.0" autocomplete="off" />
          @if (form.controls.versao.hasError('required') && form.controls.versao.touched) {
            <mat-error>Versão é obrigatória</mat-error>
          } @else if (form.controls.versao.hasError('maxlength') && form.controls.versao.touched) {
            <mat-error>Máximo 20 caracteres</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Título *</mat-label>
          <input matInput formControlName="titulo" autocomplete="off" />
          @if (form.controls.titulo.hasError('required') && form.controls.titulo.touched) {
            <mat-error>Título é obrigatório</mat-error>
          } @else if (form.controls.titulo.hasError('maxlength') && form.controls.titulo.touched) {
            <mat-error>Máximo 255 caracteres</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Conteúdo *</mat-label>
          <textarea matInput formControlName="conteudo" rows="8"></textarea>
          @if (form.controls.conteudo.invalid && form.controls.conteudo.touched) {
            <mat-error>Conteúdo é obrigatório</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Declaração de aceite *</mat-label>
          <textarea matInput formControlName="declaracaoAceite" rows="3"
            placeholder="ex: Li e aceito os Termos de Uso da plataforma Phonus."></textarea>
          @if (form.controls.declaracaoAceite.invalid && form.controls.declaracaoAceite.touched) {
            <mat-error>Declaração de aceite é obrigatória</mat-error>
          }
        </mat-form-field>

        @if (erro()) {
          <p class="error-msg" role="alert">{{ erro() }}</p>
        }
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button [disabled]="salvando()" (click)="cancelar()">Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="salvando()" (click)="salvar()">
        @if (salvando()) { <mat-spinner diameter="20" /> } @else { Publicar versão }
      </button>
    </mat-dialog-actions>
  `,
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

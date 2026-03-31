import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TermosService } from '../../../core/services/termos.service';
import { Termos } from '../../../core/models/termos.model';
import { DateBrPipe } from '../../../shared/pipes/date-br.pipe';

@Component({
  selector: 'app-preview-termos-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule, DateBrPipe],
  styles: `
    .state-center {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      min-height: 200px;
      color: var(--phonus-text-secondary);
    }
    .preview-meta {
      display: flex;
      gap: 16px;
      font-size: 13px;
      color: var(--phonus-text-secondary);
      margin-bottom: 16px;
    }
    .preview-content {
      white-space: pre-wrap;
      font-size: 14px;
      line-height: 1.7;
      color: var(--phonus-text);
      max-height: 400px;
      overflow-y: auto;
      border: 1px solid var(--phonus-border);
      border-radius: 8px;
      padding: 16px;
      background: var(--phonus-background);
    }
    .declaracao {
      margin-top: 16px;
      padding: 12px 16px;
      border-radius: 8px;
      background: var(--phonus-primary-light);
      color: var(--phonus-primary-dark);
      font-size: 13px;
      font-style: italic;
    }
  `,
  template: `
    <h2 mat-dialog-title>Preview — Termos de Uso em vigor</h2>

    <mat-dialog-content style="min-width: 560px">
      @if (carregando()) {
        <div class="state-center" role="status">
          <mat-spinner diameter="40" />
          <span>Carregando termos...</span>
        </div>
      } @else if (erro()) {
        <div class="state-center" role="alert">
          <span>{{ erro() }}</span>
        </div>
      } @else if (termos()) {
        <div class="preview-meta">
          <span>Versão: <strong>{{ termos()!.versao }}</strong></span>
          <span>Publicado em: <strong>{{ termos()!.createdAt?.substring(0, 10) | dateBr }}</strong></span>
        </div>
        <h3 style="margin: 0 0 12px; font-size: 16px;">{{ termos()!.titulo }}</h3>
        <div class="preview-content" role="document" [attr.aria-label]="termos()!.titulo">
          {{ termos()!.conteudo }}
        </div>
        <p class="declaracao">{{ termos()!.declaracaoAceite }}</p>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-flat-button color="primary" (click)="fechar()">Fechar</button>
    </mat-dialog-actions>
  `,
})
export class PreviewTermosDialogComponent implements OnInit {
  private readonly service = inject(TermosService);
  private readonly dialogRef = inject(MatDialogRef<PreviewTermosDialogComponent>);

  readonly carregando = signal(true);
  readonly erro = signal<string | null>(null);
  readonly termos = signal<Termos | null>(null);

  ngOnInit(): void {
    this.service.buscarAtual().subscribe({
      next: (t) => {
        this.termos.set(t);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar os termos em vigor.');
        this.carregando.set(false);
      },
    });
  }

  fechar(): void {
    this.dialogRef.close();
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { TermosService } from '../../../core/services/termos.service';
import { Termos } from '../../../core/models/termos.model';
import { DateBrPipe } from '../../../shared/pipes/date-br.pipe';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { NovaVersaoDialogComponent } from '../nova-versao-dialog/nova-versao-dialog.component';
import { PreviewTermosDialogComponent } from '../preview-termos-dialog/preview-termos-dialog.component';

@Component({
  selector: 'app-termos-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    DateBrPipe,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  styles: `
    .state-center {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      min-height: 200px;
      color: var(--phonus-text-secondary);
    }
    .table-wrap {
      border: 1px solid var(--phonus-border);
      border-radius: 12px;
      overflow-x: auto;
    }
    table { width: 100%; }
    th.mat-header-cell {
      font-weight: 600;
      color: var(--phonus-text-secondary);
      font-size: 13px;
      background: var(--phonus-background);
    }
    td.mat-cell { color: var(--phonus-text); }
    tr.mat-row:last-child td { border-bottom: none; }
    .col-versao { width: 110px; }
    .col-data   { width: 120px; }
    .col-status { width: 100px; }
    .col-acoes  { width: 80px; text-align: right; }
    .badge-ativo {
      display: inline-flex;
      align-items: center;
      padding: 2px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      background: var(--phonus-primary-light);
      color: var(--phonus-primary-dark);
    }
    .badge-inativo {
      font-size: 13px;
      color: var(--phonus-text-secondary);
    }
  `,
  template: `
    <app-page-header title="Termos de Uso" subtitle="Somente ROOT">
      <button mat-stroked-button (click)="abrirPreview()">
        <mat-icon>preview</mat-icon>
        Preview
      </button>
      <button mat-flat-button color="primary" (click)="abrirNovaVersao()">
        <mat-icon>add</mat-icon>
        Nova versão
      </button>
    </app-page-header>

    @if (carregando()) {
      <div class="state-center" role="status" aria-label="Carregando termos">
        <mat-spinner diameter="48" />
        <span>Carregando...</span>
      </div>
    } @else if (erro()) {
      <div class="state-center" role="alert">
        <mat-icon aria-hidden="true">error_outline</mat-icon>
        <span>{{ erro() }}</span>
        <button mat-stroked-button (click)="carregar()">Tentar novamente</button>
      </div>
    } @else if (versoes().length === 0) {
      <div class="state-center">
        <mat-icon aria-hidden="true">description</mat-icon>
        <span>Nenhuma versão publicada.</span>
      </div>
    } @else {
      <div class="table-wrap">
        <table mat-table [dataSource]="versoes()" aria-label="Versões dos Termos de Uso">

          <ng-container matColumnDef="versao">
            <th mat-header-cell *matHeaderCellDef class="col-versao">Versão</th>
            <td mat-cell *matCellDef="let t" class="col-versao">{{ t.versao }}</td>
          </ng-container>

          <ng-container matColumnDef="titulo">
            <th mat-header-cell *matHeaderCellDef>Título</th>
            <td mat-cell *matCellDef="let t">{{ t.titulo }}</td>
          </ng-container>

          <ng-container matColumnDef="data">
            <th mat-header-cell *matHeaderCellDef class="col-data">Publicado em</th>
            <td mat-cell *matCellDef="let t" class="col-data">
              {{ t.createdAt?.substring(0, 10) | dateBr }}
            </td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef class="col-status">Status</th>
            <td mat-cell *matCellDef="let t" class="col-status">
              @if (t.ativo) {
                <span class="badge-ativo">Em vigor</span>
              } @else {
                <span class="badge-inativo">Inativa</span>
              }
            </td>
          </ng-container>

          <ng-container matColumnDef="acoes">
            <th mat-header-cell *matHeaderCellDef class="col-acoes"></th>
            <td mat-cell *matCellDef="let t" class="col-acoes">
              @if (t.ativo) {
                <button
                  mat-icon-button
                  aria-label="Preview dos termos em vigor"
                  title="Preview"
                  (click)="abrirPreview()"
                >
                  <mat-icon>preview</mat-icon>
                </button>
              }
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="colunas"></tr>
          <tr mat-row *matRowDef="let row; columns: colunas;"></tr>
        </table>
      </div>
    }
  `,
})
export class TermosListComponent implements OnInit {
  private readonly service = inject(TermosService);
  private readonly dialog = inject(MatDialog);

  readonly colunas = ['versao', 'titulo', 'data', 'status', 'acoes'];
  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly versoes = signal<Termos[]>([]);

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);

    this.service.listarVersoes().subscribe({
      next: (lista) => {
        this.versoes.set(lista);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar as versões dos termos.');
        this.carregando.set(false);
      },
    });
  }

  abrirNovaVersao(): void {
    const ref = this.dialog.open<NovaVersaoDialogComponent, void, Termos | undefined>(
      NovaVersaoDialogComponent,
      { width: '640px', maxHeight: '90vh' },
    );

    ref.afterClosed().subscribe((nova) => {
      if (nova) {
        this.versoes.update((lista) =>
          [nova, ...lista.map((t) => ({ ...t, ativo: false }))],
        );
      }
    });
  }

  abrirPreview(): void {
    this.dialog.open(PreviewTermosDialogComponent, {
      width: '660px',
      maxHeight: '90vh',
    });
  }
}

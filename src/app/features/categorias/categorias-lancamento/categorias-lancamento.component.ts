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
import { MatTooltipModule } from '@angular/material/tooltip';
import { CategoriaLancamentoService } from '../../../core/services/categoria-lancamento.service';
import { CategoriaLancamento, TipoCategoria } from '../../../core/models/categoria-lancamento.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import {
  CategoriaLancamentoDialogComponent,
  CategoriaLancamentoDialogData,
} from './categoria-lancamento-dialog.component';

const TIPO_LABEL: Record<TipoCategoria, string> = {
  ENTRADA: 'Entrada',
  SAIDA:   'Saída',
  AMBOS:   'Ambos',
};

const TIPO_CSS: Record<TipoCategoria, string> = {
  ENTRADA: 'badge--green',
  SAIDA:   'badge--red',
  AMBOS:   'badge--blue',
};

@Component({
  selector: 'app-categorias-lancamento',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
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
      overflow: hidden;
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
    .col-acoes { width: 100px; text-align: right; }
    .status-ativo   { color: var(--phonus-primary); font-weight: 600; }
    .status-inativo { color: var(--phonus-text-secondary); }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
    }
    .badge--green { background: var(--phonus-primary-light); color: var(--phonus-primary-dark); }
    .badge--red   { background: #fee2e2; color: #b91c1c; }
    .badge--blue  { background: #dbeafe; color: #1d4ed8; }
  `,
  template: `
    <app-page-header title="Categorias de Lançamento">
      <button mat-flat-button color="primary" (click)="abrirDialog()">
        <mat-icon>add</mat-icon>
        Nova categoria
      </button>
    </app-page-header>

    @if (carregando()) {
      <div class="state-center" role="status" aria-label="Carregando categorias">
        <mat-spinner diameter="48" />
        <span>Carregando...</span>
      </div>
    } @else if (erro()) {
      <div class="state-center" role="alert">
        <mat-icon aria-hidden="true">error_outline</mat-icon>
        <span>{{ erro() }}</span>
        <button mat-stroked-button (click)="carregar()">Tentar novamente</button>
      </div>
    } @else if (categorias().length === 0) {
      <div class="state-center">
        <mat-icon aria-hidden="true">label</mat-icon>
        <span>Nenhuma categoria cadastrada.</span>
      </div>
    } @else {
      <div class="table-wrap">
        <table mat-table [dataSource]="categorias()" aria-label="Categorias de lançamento">

          <ng-container matColumnDef="nome">
            <th mat-header-cell *matHeaderCellDef>Nome</th>
            <td mat-cell *matCellDef="let c">{{ c.nome }}</td>
          </ng-container>

          <ng-container matColumnDef="tipo">
            <th mat-header-cell *matHeaderCellDef>Tipo</th>
            <td mat-cell *matCellDef="let c">
              <span class="badge" [class]="tipoCss(c.tipo)">{{ tipoLabel(c.tipo) }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let c">
              <span [class]="c.ativo ? 'status-ativo' : 'status-inativo'">
                {{ c.ativo ? 'Ativa' : 'Inativa' }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="acoes">
            <th mat-header-cell *matHeaderCellDef class="col-acoes"></th>
            <td mat-cell *matCellDef="let c" class="col-acoes">
              <button
                mat-icon-button
                matTooltip="Editar"
                [attr.aria-label]="'Editar ' + c.nome"
                (click)="abrirDialog(c)"
              >
                <mat-icon>edit</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="colunas"></tr>
          <tr mat-row *matRowDef="let row; columns: colunas;"></tr>
        </table>
      </div>
    }
  `,
})
export class CategoriasLancamentoComponent implements OnInit {
  private readonly service = inject(CategoriaLancamentoService);
  private readonly dialog = inject(MatDialog);

  readonly colunas = ['nome', 'tipo', 'status', 'acoes'];
  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly categorias = signal<CategoriaLancamento[]>([]);

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);

    this.service.listar().subscribe({
      next: (lista) => {
        this.categorias.set(lista);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar as categorias.');
        this.carregando.set(false);
      },
    });
  }

  tipoLabel(tipo: TipoCategoria): string {
    return TIPO_LABEL[tipo] ?? tipo;
  }

  tipoCss(tipo: TipoCategoria): string {
    return `badge ${TIPO_CSS[tipo] ?? ''}`;
  }

  abrirDialog(categoria?: CategoriaLancamento): void {
    const ref = this.dialog.open<
      CategoriaLancamentoDialogComponent,
      CategoriaLancamentoDialogData,
      CategoriaLancamento | undefined
    >(CategoriaLancamentoDialogComponent, {
      data: { categoria },
      width: '420px',
    });

    ref.afterClosed().subscribe((resultado) => {
      if (!resultado) return;

      if (categoria) {
        this.categorias.update((lista) =>
          lista.map((c) => (c.id === resultado.id ? resultado : c)),
        );
      } else {
        this.categorias.update((lista) => [...lista, resultado]);
      }
    });
  }
}

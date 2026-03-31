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
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FornecedorService } from '../../../core/services/fornecedor.service';
import { Fornecedor } from '../../../core/models/fornecedor.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import {
  FornecedorDialogComponent,
  FornecedorDialogData,
} from '../fornecedor-dialog/fornecedor-dialog.component';

@Component({
  selector: 'app-fornecedores-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  styles: `
    .filters { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }

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
    .col-doc    { width: 160px; }
    .col-status { width: 90px;  }
    .col-acoes  { width: 80px; text-align: right; }
    .status-ativo   { color: var(--phonus-primary); font-weight: 600; }
    .status-inativo { color: var(--phonus-text-secondary); }
  `,
  template: `
    <app-page-header title="Fornecedores">
      <button mat-flat-button color="primary" (click)="abrirDialog()">
        <mat-icon>add</mat-icon>
        Novo fornecedor
      </button>
    </app-page-header>

    <div class="filters">
      <mat-slide-toggle
        [checked]="apenasAtivos()"
        (change)="setApenasAtivos($event.checked)"
      >
        Somente ativos
      </mat-slide-toggle>
    </div>

    @if (carregando()) {
      <div class="state-center" role="status" aria-label="Carregando fornecedores">
        <mat-spinner diameter="48" />
        <span>Carregando...</span>
      </div>
    } @else if (erro()) {
      <div class="state-center" role="alert">
        <mat-icon aria-hidden="true">error_outline</mat-icon>
        <span>{{ erro() }}</span>
        <button mat-stroked-button (click)="carregar()">Tentar novamente</button>
      </div>
    } @else if (fornecedores().length === 0) {
      <div class="state-center">
        <mat-icon aria-hidden="true">local_shipping</mat-icon>
        <span>Nenhum fornecedor encontrado.</span>
      </div>
    } @else {
      <div class="table-wrap">
        <table mat-table [dataSource]="fornecedores()" aria-label="Lista de fornecedores">

          <ng-container matColumnDef="nome">
            <th mat-header-cell *matHeaderCellDef>Nome</th>
            <td mat-cell *matCellDef="let f">{{ f.nome }}</td>
          </ng-container>

          <ng-container matColumnDef="documento">
            <th mat-header-cell *matHeaderCellDef class="col-doc">Documento</th>
            <td mat-cell *matCellDef="let f" class="col-doc">{{ f.documento || '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>E-mail</th>
            <td mat-cell *matCellDef="let f">{{ f.email || '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="telefone">
            <th mat-header-cell *matHeaderCellDef>Telefone</th>
            <td mat-cell *matCellDef="let f">{{ f.telefone || '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef class="col-status">Status</th>
            <td mat-cell *matCellDef="let f" class="col-status">
              <span [class]="f.ativo ? 'status-ativo' : 'status-inativo'">
                {{ f.ativo ? 'Ativo' : 'Inativo' }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="acoes">
            <th mat-header-cell *matHeaderCellDef class="col-acoes"></th>
            <td mat-cell *matCellDef="let f" class="col-acoes">
              <button
                mat-icon-button
                matTooltip="Editar"
                [attr.aria-label]="'Editar ' + f.nome"
                (click)="abrirDialog(f)"
              >
                <mat-icon>edit</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="colunas"></tr>
          <tr mat-row *matRowDef="let row; columns: colunas;"></tr>
        </table>
      </div>

      <mat-paginator
        [length]="totalElements()"
        [pageSize]="pageSize"
        [pageIndex]="page()"
        [pageSizeOptions]="[20]"
        (page)="onPage($event)"
        aria-label="Paginação de fornecedores"
      />
    }
  `,
})
export class FornecedoresListComponent implements OnInit {
  private readonly service = inject(FornecedorService);
  private readonly dialog = inject(MatDialog);

  readonly colunas = ['nome', 'documento', 'email', 'telefone', 'status', 'acoes'];
  readonly pageSize = 20;

  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly fornecedores = signal<Fornecedor[]>([]);
  readonly totalElements = signal(0);
  readonly page = signal(0);
  readonly apenasAtivos = signal(true);

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);

    this.service
      .listar({ page: this.page(), size: this.pageSize, ativos: this.apenasAtivos() || undefined })
      .subscribe({
        next: (res) => {
          this.fornecedores.set(res.content);
          this.totalElements.set(res.totalElements);
          this.carregando.set(false);
        },
        error: () => {
          this.erro.set('Não foi possível carregar os fornecedores.');
          this.carregando.set(false);
        },
      });
  }

  setApenasAtivos(value: boolean): void {
    this.apenasAtivos.set(value);
    this.page.set(0);
    this.carregar();
  }

  onPage(event: PageEvent): void {
    this.page.set(event.pageIndex);
    this.carregar();
  }

  abrirDialog(fornecedor?: Fornecedor): void {
    const ref = this.dialog.open<
      FornecedorDialogComponent,
      FornecedorDialogData,
      Fornecedor | undefined
    >(FornecedorDialogComponent, { data: { fornecedor }, width: '480px' });

    ref.afterClosed().subscribe((resultado) => {
      if (!resultado) return;
      if (fornecedor) {
        this.fornecedores.update((lista) =>
          lista.map((f) => (f.id === resultado.id ? resultado : f)),
        );
      } else {
        this.fornecedores.update((lista) => [resultado, ...lista]);
      }
    });
  }
}

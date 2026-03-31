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
import { ClienteService } from '../../../core/services/cliente.service';
import { Cliente } from '../../../core/models/cliente.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import {
  ClienteDialogComponent,
  ClienteDialogData,
} from '../cliente-dialog/cliente-dialog.component';

@Component({
  selector: 'app-clientes-list',
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
    .col-doc    { width: 160px; }
    .col-status { width: 90px;  }
    .col-acoes  { width: 80px; text-align: right; }
    .status-ativo   { color: var(--phonus-primary); font-weight: 600; }
    .status-inativo { color: var(--phonus-text-secondary); }
  `,
  template: `
    <app-page-header title="Clientes">
      <button mat-flat-button color="primary" (click)="abrirDialog()">
        <mat-icon>person_add</mat-icon>
        Novo cliente
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
      <div class="state-center" role="status" aria-label="Carregando clientes">
        <mat-spinner diameter="48" />
        <span>Carregando...</span>
      </div>
    } @else if (erro()) {
      <div class="state-center" role="alert">
        <mat-icon aria-hidden="true">error_outline</mat-icon>
        <span>{{ erro() }}</span>
        <button mat-stroked-button (click)="carregar()">Tentar novamente</button>
      </div>
    } @else if (clientes().length === 0) {
      <div class="state-center">
        <mat-icon aria-hidden="true">people</mat-icon>
        <span>Nenhum cliente encontrado.</span>
      </div>
    } @else {
      <div class="table-wrap">
        <table mat-table [dataSource]="clientes()" aria-label="Lista de clientes">

          <ng-container matColumnDef="nome">
            <th mat-header-cell *matHeaderCellDef>Nome</th>
            <td mat-cell *matCellDef="let c">{{ c.nome }}</td>
          </ng-container>

          <ng-container matColumnDef="documento">
            <th mat-header-cell *matHeaderCellDef class="col-doc">Documento</th>
            <td mat-cell *matCellDef="let c" class="col-doc">{{ c.documento || '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>E-mail</th>
            <td mat-cell *matCellDef="let c">{{ c.email || '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="telefone">
            <th mat-header-cell *matHeaderCellDef>Telefone</th>
            <td mat-cell *matCellDef="let c">{{ c.telefone || '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef class="col-status">Status</th>
            <td mat-cell *matCellDef="let c" class="col-status">
              <span [class]="c.ativo ? 'status-ativo' : 'status-inativo'">
                {{ c.ativo ? 'Ativo' : 'Inativo' }}
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

      <mat-paginator
        [length]="totalElements()"
        [pageSize]="pageSize"
        [pageIndex]="page()"
        [pageSizeOptions]="[20]"
        (page)="onPage($event)"
        aria-label="Paginação de clientes"
      />
    }
  `,
})
export class ClientesListComponent implements OnInit {
  private readonly service = inject(ClienteService);
  private readonly dialog = inject(MatDialog);

  readonly colunas = ['nome', 'documento', 'email', 'telefone', 'status', 'acoes'];
  readonly pageSize = 20;

  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly clientes = signal<Cliente[]>([]);
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
          this.clientes.set(res.content);
          this.totalElements.set(res.totalElements);
          this.carregando.set(false);
        },
        error: () => {
          this.erro.set('Não foi possível carregar os clientes.');
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

  abrirDialog(cliente?: Cliente): void {
    const ref = this.dialog.open<ClienteDialogComponent, ClienteDialogData, Cliente | undefined>(
      ClienteDialogComponent,
      { data: { cliente }, width: '480px' },
    );

    ref.afterClosed().subscribe((resultado) => {
      if (!resultado) return;
      if (cliente) {
        this.clientes.update((lista) =>
          lista.map((c) => (c.id === resultado.id ? resultado : c)),
        );
      } else {
        this.clientes.update((lista) => [resultado, ...lista]);
      }
    });
  }
}

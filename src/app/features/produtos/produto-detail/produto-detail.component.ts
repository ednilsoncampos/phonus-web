import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProdutoService } from '../../../core/services/produto.service';
import { CategoriaProdutoService } from '../../../core/services/categoria-produto.service';
import { Produto } from '../../../core/models/produto.model';
import { CurrencyBrlPipe } from '../../../shared/pipes/currency-brl.pipe';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-produto-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    CurrencyBrlPipe,
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
    .detail-card {
      background: var(--phonus-surface);
      border: 1px solid var(--phonus-border);
      border-radius: 12px;
      padding: 24px;
      max-width: 720px;
    }
    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px 32px;
    }
    .detail-full { grid-column: 1 / -1; }
    .detail-field label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: var(--phonus-text-secondary);
      text-transform: uppercase;
      letter-spacing: .5px;
      margin-bottom: 4px;
    }
    .detail-field span {
      font-size: 15px;
      color: var(--phonus-text);
    }
    .section-divider {
      border: none;
      border-top: 1px solid var(--phonus-border);
      margin: 20px 0;
    }
    .actions-top {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
    }
    .badge-minimo {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      background: #fee2e2;
      color: #b91c1c;
    }
    .status-ativo   { color: var(--phonus-primary); font-weight: 600; }
    .status-inativo { color: var(--phonus-text-secondary); }
  `,
  template: `
    @if (carregando()) {
      <div class="state-center" role="status" aria-label="Carregando produto">
        <mat-spinner diameter="48" />
        <span>Carregando...</span>
      </div>
    } @else if (erro()) {
      <div class="state-center" role="alert">
        <mat-icon aria-hidden="true">error_outline</mat-icon>
        <span>{{ erro() }}</span>
        <button mat-stroked-button (click)="carregar()">Tentar novamente</button>
      </div>
    } @else if (produto()) {
      <app-page-header [title]="produto()!.nome" subtitle="Detalhe do produto">
        <button mat-stroked-button (click)="irEstoque()">
          <mat-icon>inventory</mat-icon>
          Histórico de estoque
        </button>
        @if (produto()!.ativo) {
          <button mat-stroked-button color="warn" (click)="confirmarDesativar()">
            <mat-icon>block</mat-icon>
            Desativar
          </button>
          <button mat-flat-button color="primary" (click)="editar()">
            <mat-icon>edit</mat-icon>
            Editar
          </button>
        }
      </app-page-header>

      <div class="detail-card">
        <div class="detail-grid">

          <div class="detail-field detail-full">
            <label>Nome</label>
            <span>{{ produto()!.nome }}</span>
          </div>

          @if (produto()!.descricao) {
            <div class="detail-field detail-full">
              <label>Descrição</label>
              <span>{{ produto()!.descricao }}</span>
            </div>
          }

          <div class="detail-field">
            <label>Categoria</label>
            <span>{{ nomeCategoria() }}</span>
          </div>

          <div class="detail-field">
            <label>Unidade de medida</label>
            <span>{{ produto()!.unidadeMedida }}</span>
          </div>

          <div class="detail-field">
            <label>Status</label>
            <span [class]="produto()!.ativo ? 'status-ativo' : 'status-inativo'">
              {{ produto()!.ativo ? 'Ativo' : 'Inativo' }}
            </span>
          </div>
        </div>

        <hr class="section-divider" />

        <div class="detail-grid">
          <div class="detail-field">
            <label>Preço de venda</label>
            <span>{{ produto()!.precoVenda | currencyBrl }}</span>
          </div>

          <div class="detail-field">
            <label>Preço de custo</label>
            <span>{{ produto()!.precoCusto | currencyBrl }}</span>
          </div>
        </div>

        <hr class="section-divider" />

        <div class="detail-grid">
          <div class="detail-field">
            <label>Estoque atual</label>
            <span>
              {{ produto()!.quantidadeEstoque }} {{ produto()!.unidadeMedida }}
              @if (produto()!.abaixoDoMinimo) {
                <span class="badge-minimo">
                  <mat-icon style="font-size:14px;width:14px;height:14px">warning</mat-icon>
                  Abaixo do mínimo
                </span>
              }
            </span>
          </div>

          <div class="detail-field">
            <label>Estoque mínimo</label>
            <span>{{ produto()!.estoqueMinimo }} {{ produto()!.unidadeMedida }}</span>
          </div>
        </div>

        @if (produto()!.codigoBarras || produto()!.ncm || produto()!.cest) {
          <hr class="section-divider" />
          <div class="detail-grid">
            @if (produto()!.codigoBarras) {
              <div class="detail-field">
                <label>Código de barras</label>
                <span>{{ produto()!.codigoBarras }}</span>
              </div>
            }
            @if (produto()!.ncm) {
              <div class="detail-field">
                <label>NCM</label>
                <span>{{ produto()!.ncm }}</span>
              </div>
            }
            @if (produto()!.cest) {
              <div class="detail-field">
                <label>CEST</label>
                <span>{{ produto()!.cest }}</span>
              </div>
            }
          </div>
        }
      </div>
    }
  `,
})
export class ProdutoDetailComponent implements OnInit {
  private readonly produtoService = inject(ProdutoService);
  private readonly categoriaService = inject(CategoriaProdutoService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly produto = signal<Produto | null>(null);

  private categoriasMap = new Map<string, string>();
  private produtoId = '';

  ngOnInit(): void {
    this.produtoId = this.route.snapshot.paramMap.get('id') ?? '';
    this.categoriaService.listar().subscribe((lista) => {
      lista.forEach((c) => this.categoriasMap.set(c.id, c.nome));
    });
    this.carregar();
  }

  carregar(): void {
    if (!this.produtoId) return;
    this.carregando.set(true);
    this.erro.set(null);

    this.produtoService.buscar(this.produtoId).subscribe({
      next: (p) => {
        this.produto.set(p);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar o produto.');
        this.carregando.set(false);
      },
    });
  }

  nomeCategoria(): string {
    const id = this.produto()?.categoriaId;
    if (!id) return '—';
    return this.categoriasMap.get(id) ?? '—';
  }

  editar(): void {
    this.router.navigate(['/produtos', this.produtoId, 'editar']);
  }

  irEstoque(): void {
    this.router.navigate(['/estoque'], { queryParams: { produtoId: this.produtoId } });
  }

  confirmarDesativar(): void {
    const p = this.produto();
    if (!p) return;

    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Desativar produto',
        message: `Deseja desativar "${p.nome}"? Ele não aparecerá em novos lançamentos.`,
        confirmLabel: 'Desativar',
      },
    });

    ref.afterClosed().subscribe((confirmado: boolean) => {
      if (!confirmado) return;
      this.produtoService.desativar(this.produtoId).subscribe({
        next: (atualizado) => this.produto.set(atualizado),
      });
    });
  }
}

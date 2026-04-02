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
  templateUrl: './produto-detail.component.html',
  styleUrl: './produto-detail.component.scss',
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

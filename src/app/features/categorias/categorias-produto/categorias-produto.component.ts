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
import { CategoriaProdutoService } from '../../../core/services/categoria-produto.service';
import { CategoriaProduto } from '../../../core/models/categoria-produto.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import {
  CategoriaProdutoDialogComponent,
  CategoriaProdutoDialogData,
} from './categoria-produto-dialog.component';

@Component({
  selector: 'app-categorias-produto',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './categorias-produto.component.html',
  styleUrl: './categorias-produto.component.scss',
})
export class CategoriasProdutoComponent implements OnInit {
  private readonly service = inject(CategoriaProdutoService);
  private readonly dialog = inject(MatDialog);

  readonly colunas = ['nome', 'status', 'acoes'];
  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly categorias = signal<CategoriaProduto[]>([]);

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

  abrirDialog(categoria?: CategoriaProduto): void {
    const ref = this.dialog.open<
      CategoriaProdutoDialogComponent,
      CategoriaProdutoDialogData,
      CategoriaProduto | undefined
    >(CategoriaProdutoDialogComponent, {
      data: { categoria },
      width: '400px',
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

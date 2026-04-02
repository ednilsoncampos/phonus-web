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
  templateUrl: './categorias-lancamento.component.html',
  styleUrl: './categorias-lancamento.component.scss',
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

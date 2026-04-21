import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
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
    FormsModule,
    PageHeaderComponent,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './categorias-produto.component.html',
  styleUrl: './categorias-produto.component.scss',
})
export class CategoriasProdutoComponent implements OnInit, AfterViewInit {
  private readonly service = inject(CategoriaProdutoService);
  private readonly dialog = inject(MatDialog);

  @ViewChild('buscaInput') buscaInput?: ElementRef<HTMLInputElement>;

  readonly colunas = ['nome', 'status', 'acoes'];
  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly apenasAtivas = signal(true);
  readonly busca = signal('');

  private readonly todasCategorias = signal<CategoriaProduto[]>([]);

  readonly categorias = computed(() => {
    const termo = this.busca().toLowerCase().trim();
    return this.todasCategorias().filter(
      (c) => !termo || c.nome.toLowerCase().includes(termo),
    );
  });

  ngOnInit(): void {
    this.carregar();
  }

  ngAfterViewInit(): void {
    this.buscaInput?.nativeElement.focus();
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);

    this.service.listar(this.apenasAtivas()).subscribe({
      next: (lista) => {
        this.todasCategorias.set(lista);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar as categorias.');
        this.carregando.set(false);
      },
    });
  }

  setApenasAtivas(value: boolean): void {
    this.apenasAtivas.set(value);
    this.carregar();
  }

  onBusca(event: Event): void {
    this.busca.set((event.target as HTMLInputElement).value);
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
      if (resultado) this.carregar();
    });
  }
}

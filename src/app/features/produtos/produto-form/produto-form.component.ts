import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProdutoService } from '../../../core/services/produto.service';
import { CategoriaProdutoService } from '../../../core/services/categoria-produto.service';
import { CriarProdutoRequest, UnidadeMedida } from '../../../core/models/produto.model';
import { CategoriaProduto } from '../../../core/models/categoria-produto.model';
import {
  CategoriaProdutoDialogComponent,
  CategoriaProdutoDialogData,
} from '../../categorias/categorias-produto/categoria-produto-dialog.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

const UNIDADES: { value: UnidadeMedida; label: string }[] = [
  { value: 'UN',  label: 'Unidade (UN)'    },
  { value: 'KG',  label: 'Quilograma (KG)' },
  { value: 'L',   label: 'Litro (L)'       },
  { value: 'M',   label: 'Metro (M)'       },
  { value: 'M2',  label: 'Metro² (M²)'     },
  { value: 'CX',  label: 'Caixa (CX)'      },
  { value: 'PCT', label: 'Pacote (PCT)'    },
];

@Component({
  selector: 'app-produto-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    PageHeaderComponent,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './produto-form.component.html',
  styleUrl: './produto-form.component.scss',
})
export class ProdutoFormComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly produtoService = inject(ProdutoService);
  private readonly categoriaService = inject(CategoriaProdutoService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);

  readonly unidades = UNIDADES;
  readonly carregando = signal(false);
  readonly salvando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly categorias = signal<CategoriaProduto[]>([]);

  editando = false;
  private produtoId: string | null = null;

  readonly form = this.fb.group({
    nome:          ['', Validators.required],
    descricao:     [''],
    categoriaId:   ['', Validators.required],
    unidadeMedida: ['UN' as UnidadeMedida, Validators.required],
    precoVenda:    [null as number | null, [Validators.required, Validators.min(0.01)]],
    precoCusto:    [null as number | null, [Validators.required, Validators.min(0.01)]],
    estoqueMinimo: [null as unknown as number, [Validators.required, Validators.min(1)]],
    codigoBarras:  [''],
    ncm:           [''],
    cest:          [''],
  });

  ngOnInit(): void {
    this.produtoId = this.route.snapshot.paramMap.get('id');
    this.editando = !!this.produtoId;

    this.categoriaService.listar().subscribe((lista) => this.categorias.set(lista));

    if (this.editando && this.produtoId) {
      this.carregando.set(true);
      this.produtoService.buscar(this.produtoId).subscribe({
        next: (p) => {
          this.form.patchValue({
            nome:          p.nome,
            descricao:     p.descricao ?? '',
            categoriaId:   p.categoriaId ?? '',
            unidadeMedida: p.unidadeMedida,
            precoVenda:    p.precoVenda / 100,
            precoCusto:    p.precoCusto != null ? p.precoCusto / 100 : null,
            estoqueMinimo: p.estoqueMinimo,
            codigoBarras:  p.codigoBarras ?? '',
            ncm:           p.ncm ?? '',
            cest:          p.cest ?? '',
          });
          this.carregando.set(false);
        },
        error: () => {
          this.erro.set('Não foi possível carregar o produto.');
          this.carregando.set(false);
        },
      });
    }
  }

  salvar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.salvando.set(true);
    this.erro.set(null);

    const raw = this.form.getRawValue();
    const body: CriarProdutoRequest = {
      nome:          raw.nome,
      descricao:     raw.descricao || undefined,
      categoriaId:   raw.categoriaId || undefined,
      unidadeMedida: raw.unidadeMedida,
      precoVenda:    Math.round((raw.precoVenda ?? 0) * 100),
      precoCusto:    Math.round((raw.precoCusto ?? 0) * 100),
      estoqueMinimo: raw.estoqueMinimo,
      codigoBarras:  raw.codigoBarras || undefined,
      ncm:           raw.ncm || undefined,
      cest:          raw.cest || undefined,
    };

    const req$ = this.editando && this.produtoId
      ? this.produtoService.atualizar(this.produtoId, body)
      : this.produtoService.criar(body);

    req$.subscribe({
      next: () => {
        this.salvando.set(false);
        this.router.navigate(['/produtos']);
      },
      error: (err) => {
        this.salvando.set(false);
        this.erro.set(err?.error?.message ?? 'Erro ao salvar o produto.');
      },
    });
  }

  abrirCriarCategoria(): void {
    const ref = this.dialog.open<
      CategoriaProdutoDialogComponent,
      CategoriaProdutoDialogData,
      CategoriaProduto | undefined
    >(CategoriaProdutoDialogComponent, { data: {}, width: '400px' });

    ref.afterClosed().subscribe((nova) => {
      if (!nova) return;
      this.categorias.update((lista) => [...lista, nova]);
      this.form.controls.categoriaId.setValue(nova.id);
    });
  }

  cancelar(): void {
    this.router.navigate(['/produtos']);
  }
}

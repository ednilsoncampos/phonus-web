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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ProdutoService } from '../../../core/services/produto.service';
import { CategoriaProdutoService } from '../../../core/services/categoria-produto.service';
import { CriarProdutoRequest, UnidadeMedida } from '../../../core/models/produto.model';
import { CategoriaProduto } from '../../../core/models/categoria-produto.model';
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
    categoriaId:   [''],
    unidadeMedida: ['UN' as UnidadeMedida, Validators.required],
    precoVenda:    [null as number | null, [Validators.required, Validators.min(0.01)]],
    precoCusto:    [null as number | null],
    estoqueMinimo: [0, [Validators.required, Validators.min(0)]],
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
      precoCusto:    raw.precoCusto != null ? Math.round(raw.precoCusto * 100) : undefined,
      estoqueMinimo: raw.estoqueMinimo,
      codigoBarras:  raw.codigoBarras || undefined,
      ncm:           raw.ncm || undefined,
      cest:          raw.cest || undefined,
    };

    const req$ = this.editando && this.produtoId
      ? this.produtoService.atualizar(this.produtoId, body)
      : this.produtoService.criar(body);

    req$.subscribe({
      next: (p) => {
        this.salvando.set(false);
        this.router.navigate(['/produtos', p.id]);
      },
      error: (err) => {
        this.salvando.set(false);
        this.erro.set(err?.error?.message ?? 'Erro ao salvar o produto.');
      },
    });
  }

  cancelar(): void {
    this.router.navigate(['/produtos']);
  }
}

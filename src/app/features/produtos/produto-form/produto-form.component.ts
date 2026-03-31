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
  styles: `
    .form-card {
      background: var(--phonus-surface);
      border: 1px solid var(--phonus-border);
      border-radius: 12px;
      padding: 24px;
      max-width: 720px;
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0 16px;
    }
    .form-full { grid-column: 1 / -1; }
    .section-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--phonus-text-secondary);
      text-transform: uppercase;
      letter-spacing: .5px;
      margin: 16px 0 8px;
    }
    .actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 8px;
    }
    .error-banner {
      color: var(--phonus-error);
      font-size: 13px;
      margin-bottom: 8px;
    }
    .price-prefix { color: var(--phonus-text-secondary); margin-right: 4px; }
  `,
  template: `
    <app-page-header [title]="editando ? 'Editar produto' : 'Novo produto'" />

    @if (carregando()) {
      <div style="display:flex;justify-content:center;padding:48px">
        <mat-spinner diameter="48" />
      </div>
    } @else {
      <div class="form-card">
        <form [formGroup]="form" (ngSubmit)="salvar()">

          <p class="section-label">Dados principais</p>
          <div class="form-row">
            <mat-form-field appearance="outline" class="form-full">
              <mat-label>Nome *</mat-label>
              <input matInput formControlName="nome" autocomplete="off" />
              @if (form.controls.nome.invalid && form.controls.nome.touched) {
                <mat-error>Nome é obrigatório</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-full">
              <mat-label>Descrição</mat-label>
              <textarea matInput formControlName="descricao" rows="2"></textarea>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Categoria</mat-label>
              <mat-select formControlName="categoriaId">
                <mat-option value="">Sem categoria</mat-option>
                @for (cat of categorias(); track cat.id) {
                  <mat-option [value]="cat.id">{{ cat.nome }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Unidade de medida *</mat-label>
              <mat-select formControlName="unidadeMedida">
                @for (u of unidades; track u.value) {
                  <mat-option [value]="u.value">{{ u.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          <p class="section-label">Preços</p>
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Preço de venda *</mat-label>
              <span matTextPrefix class="price-prefix">R$&nbsp;</span>
              <input matInput type="number" min="0" step="0.01" formControlName="precoVenda" />
              @if (form.controls.precoVenda.hasError('required') && form.controls.precoVenda.touched) {
                <mat-error>Preço de venda é obrigatório</mat-error>
              } @else if (form.controls.precoVenda.hasError('min') && form.controls.precoVenda.touched) {
                <mat-error>Deve ser maior que zero</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Preço de custo</mat-label>
              <span matTextPrefix class="price-prefix">R$&nbsp;</span>
              <input matInput type="number" min="0" step="0.01" formControlName="precoCusto" />
            </mat-form-field>
          </div>

          <p class="section-label">Estoque</p>
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Estoque mínimo *</mat-label>
              <input matInput type="number" min="0" formControlName="estoqueMinimo" />
              @if (form.controls.estoqueMinimo.invalid && form.controls.estoqueMinimo.touched) {
                <mat-error>Estoque mínimo é obrigatório</mat-error>
              }
            </mat-form-field>
          </div>

          <p class="section-label">Dados fiscais (opcional)</p>
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Código de barras</mat-label>
              <input matInput formControlName="codigoBarras" autocomplete="off" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>NCM</mat-label>
              <input matInput formControlName="ncm" autocomplete="off" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>CEST</mat-label>
              <input matInput formControlName="cest" autocomplete="off" />
            </mat-form-field>
          </div>

          @if (erro()) {
            <p class="error-banner" role="alert">{{ erro() }}</p>
          }

          <div class="actions">
            <button mat-stroked-button type="button" (click)="cancelar()">Cancelar</button>
            <button mat-flat-button color="primary" type="submit" [disabled]="salvando()">
              @if (salvando()) { <mat-spinner diameter="20" /> } @else { Salvar }
            </button>
          </div>
        </form>
      </div>
    }
  `,
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

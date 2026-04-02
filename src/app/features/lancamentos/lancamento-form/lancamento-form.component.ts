import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  FormArray,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { LancamentoService } from '../../../core/services/lancamento.service';
import { CategoriaLancamentoService } from '../../../core/services/categoria-lancamento.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { FornecedorService } from '../../../core/services/fornecedor.service';
import { ProdutoService } from '../../../core/services/produto.service';
import { CriarLancamentoRequest, FormaPagamento, TipoLancamento } from '../../../core/models/lancamento.model';
import { CategoriaLancamento } from '../../../core/models/categoria-lancamento.model';
import { Cliente } from '../../../core/models/cliente.model';
import { Fornecedor } from '../../../core/models/fornecedor.model';
import { Produto } from '../../../core/models/produto.model';
import { CurrencyBrlPipe } from '../../../shared/pipes/currency-brl.pipe';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

const FORMAS_PAGAMENTO: { value: FormaPagamento; label: string }[] = [
  { value: 'PIX',        label: 'PIX'        },
  { value: 'DINHEIRO',   label: 'Dinheiro'   },
  { value: 'DEBITO',     label: 'Débito'     },
  { value: 'CREDITO',    label: 'Crédito'    },
  { value: 'CHEQUE',     label: 'Cheque'     },
  { value: 'PROMISSORIA', label: 'Promissória' },
];

const FORMAS_PRAZO: FormaPagamento[] = ['CREDITO', 'CHEQUE', 'PROMISSORIA'];

@Component({
  selector: 'app-lancamento-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    PageHeaderComponent,
    CurrencyBrlPipe,
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
      max-width: 800px;
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
      margin: 20px 0 8px;
    }
    .actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 16px;
    }
    .error-banner {
      color: var(--phonus-error);
      font-size: 13px;
      margin-bottom: 8px;
    }
    .price-prefix { color: var(--phonus-text-secondary); margin-right: 4px; }

    .item-row {
      display: grid;
      grid-template-columns: 1fr 120px 140px auto;
      gap: 0 12px;
      align-items: start;
      border: 1px solid var(--phonus-border);
      border-radius: 8px;
      padding: 8px 12px 0;
      margin-bottom: 8px;
    }
    .item-ref {
      grid-column: 1 / -1;
      font-size: 12px;
      color: var(--phonus-text-secondary);
      margin-bottom: 8px;
    }
    .add-item-btn { margin-bottom: 8px; }
  `,
  template: `
    <app-page-header title="Novo lançamento" />

    @if (carregando()) {
      <div style="display:flex;justify-content:center;padding:48px">
        <mat-spinner diameter="48" />
      </div>
    } @else {
      <div class="form-card">
        <form [formGroup]="form" (ngSubmit)="salvar()">

          <p class="section-label">Dados do lançamento</p>
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Tipo *</mat-label>
              <mat-select formControlName="tipo">
                <mat-option value="ENTRADA">Entrada</mat-option>
                <mat-option value="SAIDA">Saída</mat-option>
              </mat-select>
              @if (form.controls.tipo.invalid && form.controls.tipo.touched) {
                <mat-error>Tipo é obrigatório</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Data *</mat-label>
              <input matInput type="date" formControlName="dataLancamento" />
              @if (form.controls.dataLancamento.invalid && form.controls.dataLancamento.touched) {
                <mat-error>Data é obrigatória</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-full">
              <mat-label>Descrição *</mat-label>
              <input matInput formControlName="descricao" autocomplete="off" />
              @if (form.controls.descricao.invalid && form.controls.descricao.touched) {
                <mat-error>Descrição é obrigatória</mat-error>
              }
            </mat-form-field>
          </div>

          <p class="section-label">Pagamento</p>
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Forma de pagamento *</mat-label>
              <mat-select formControlName="formaPagamento">
                @for (f of formasPagamento; track f.value) {
                  <mat-option [value]="f.value">{{ f.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            @if (isPrazo()) {
              <mat-form-field appearance="outline">
                <mat-label>Número de parcelas</mat-label>
                <input matInput type="number" min="1" formControlName="quantidadeParcelas" />
                @if (form.controls.quantidadeParcelas.invalid && form.controls.quantidadeParcelas.touched) {
                  <mat-error>Mínimo 1 parcela</mat-error>
                }
              </mat-form-field>
            }

            <mat-form-field appearance="outline">
              <mat-label>Valor total *</mat-label>
              <span matTextPrefix class="price-prefix">R$&nbsp;</span>
              <input matInput type="number" min="0.01" step="0.01" formControlName="valorTotal" />
              @if (form.controls.valorTotal.hasError('required') && form.controls.valorTotal.touched) {
                <mat-error>Valor é obrigatório</mat-error>
              } @else if (form.controls.valorTotal.hasError('min') && form.controls.valorTotal.touched) {
                <mat-error>Deve ser maior que zero</mat-error>
              }
            </mat-form-field>
          </div>

          <p class="section-label">Vínculos (opcional)</p>
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Categoria</mat-label>
              <mat-select formControlName="categoriaId">
                <mat-option value="">Sem categoria</mat-option>
                @for (c of categoriasFiltradas(); track c.id) {
                  <mat-option [value]="c.id">{{ c.nome }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Cliente</mat-label>
              <mat-select formControlName="clienteId">
                <mat-option value="">Nenhum</mat-option>
                @for (c of clientes(); track c.id) {
                  <mat-option [value]="c.id">{{ c.nome }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Fornecedor</mat-label>
              <mat-select formControlName="fornecedorId">
                <mat-option value="">Nenhum</mat-option>
                @for (f of fornecedores(); track f.id) {
                  <mat-option [value]="f.id">{{ f.nome }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          <p class="section-label">Itens do lançamento (opcional)</p>

          @for (item of itemGroups(); track $index; let i = $index) {
            <div [formGroup]="item" class="item-row">
              <mat-form-field appearance="outline">
                <mat-label>Produto</mat-label>
                <mat-select formControlName="produtoId">
                  @for (p of produtos(); track p.id) {
                    <mat-option [value]="p.id">{{ p.nome }}</mat-option>
                  }
                </mat-select>
                @if (item.get('produtoId')?.invalid && item.get('produtoId')?.touched) {
                  <mat-error>Selecione um produto</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Qtd</mat-label>
                <input matInput type="number" min="0.001" step="0.001" formControlName="quantidade" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Desconto (R$)</mat-label>
                <span matTextPrefix class="price-prefix">R$&nbsp;</span>
                <input matInput type="number" min="0" step="0.01" formControlName="desconto" />
              </mat-form-field>

              <button
                mat-icon-button
                type="button"
                (click)="removerItem(i)"
                [attr.aria-label]="'Remover item ' + (i + 1)"
                style="margin-top:8px"
              >
                <mat-icon>delete</mat-icon>
              </button>

              @if (item.get('produtoId')?.value) {
                <p class="item-ref">
                  Preço de referência: {{ precoReferencia(item.get('produtoId')?.value) | currencyBrl }}
                </p>
              }
            </div>
          }

          <button
            mat-stroked-button
            type="button"
            class="add-item-btn"
            (click)="adicionarItem()"
          >
            <mat-icon>add</mat-icon>
            Adicionar item
          </button>

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
export class LancamentoFormComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly lancamentoService = inject(LancamentoService);
  private readonly categoriaService = inject(CategoriaLancamentoService);
  private readonly clienteService = inject(ClienteService);
  private readonly fornecedorService = inject(FornecedorService);
  private readonly produtoService = inject(ProdutoService);
  private readonly router = inject(Router);

  readonly formasPagamento = FORMAS_PAGAMENTO;

  readonly form = this.fb.group({
    tipo:               ['SAIDA' as TipoLancamento, Validators.required],
    descricao:          ['', Validators.required],
    valorTotal:         [null as number | null, [Validators.required, Validators.min(0.01)]],
    formaPagamento:     ['PIX' as FormaPagamento, Validators.required],
    dataLancamento:     ['', Validators.required],
    quantidadeParcelas: [1, [Validators.min(1)]],
    categoriaId:        [''],
    clienteId:          [''],
    fornecedorId:       [''],
  });

  private readonly itensArray = new FormArray<FormGroup>([]);

  private readonly tipoSignal = toSignal(this.form.controls.tipo.valueChanges, {
    initialValue: 'SAIDA' as TipoLancamento,
  });

  private readonly fpSignal = toSignal(this.form.controls.formaPagamento.valueChanges, {
    initialValue: 'PIX' as FormaPagamento,
  });

  readonly isPrazo = computed(() => FORMAS_PRAZO.includes(this.fpSignal()));

  readonly carregando = signal(false);
  readonly salvando = signal(false);
  readonly erro = signal<string | null>(null);

  readonly todasCategorias = signal<CategoriaLancamento[]>([]);
  readonly clientes = signal<Cliente[]>([]);
  readonly fornecedores = signal<Fornecedor[]>([]);
  readonly produtos = signal<Produto[]>([]);
  readonly itemGroups = signal<FormGroup[]>([]);

  readonly categoriasFiltradas = computed(() => {
    const tipo = this.tipoSignal();
    return this.todasCategorias().filter(
      (c) => c.ativo && (c.tipo === tipo || c.tipo === 'AMBOS'),
    );
  });

  ngOnInit(): void {
    const hoje = new Date();
    const y = hoje.getFullYear();
    const m = String(hoje.getMonth() + 1).padStart(2, '0');
    const d = String(hoje.getDate()).padStart(2, '0');
    this.form.controls.dataLancamento.setValue(`${y}-${m}-${d}`);

    this.carregando.set(true);
    let pendentes = 4;

    const onLoad = () => {
      pendentes--;
      if (pendentes === 0) this.carregando.set(false);
    };

    this.categoriaService.listar().subscribe({ next: (l) => { this.todasCategorias.set(l); onLoad(); }, error: onLoad });
    this.clienteService.listar({ size: 200, ativos: true }).subscribe({ next: (r) => { this.clientes.set(r.content); onLoad(); }, error: onLoad });
    this.fornecedorService.listar({ size: 200, ativos: true }).subscribe({ next: (r) => { this.fornecedores.set(r.content); onLoad(); }, error: onLoad });
    this.produtoService.listar({ size: 200, ativos: true }).subscribe({ next: (r) => { this.produtos.set(r.content); onLoad(); }, error: onLoad });
  }

  adicionarItem(): void {
    this.itensArray.push(this.novoItemGroup());
    this.itemGroups.set([...this.itensArray.controls]);
  }

  removerItem(index: number): void {
    this.itensArray.removeAt(index);
    this.itemGroups.set([...this.itensArray.controls]);
  }

  precoReferencia(produtoId: string): number {
    return this.produtos().find((p) => p.id === produtoId)?.precoVenda ?? 0;
  }

  salvar(): void {
    this.form.markAllAsTouched();
    this.itensArray.controls.forEach((g) => g.markAllAsTouched());

    if (this.form.invalid || this.itensArray.invalid) return;

    this.salvando.set(true);
    this.erro.set(null);

    const raw = this.form.getRawValue();

    const body: CriarLancamentoRequest = {
      tipo:               raw.tipo,
      descricao:          raw.descricao,
      valorTotal:         Math.round((raw.valorTotal ?? 0) * 100),
      formaPagamento:     raw.formaPagamento,
      origem:             'TEXTO',
      dataLancamento:     raw.dataLancamento,
      quantidadeParcelas: this.isPrazo() ? raw.quantidadeParcelas : undefined,
      categoriaId:        raw.categoriaId  || undefined,
      clienteId:          raw.clienteId    || undefined,
      fornecedorId:       raw.fornecedorId || undefined,
      itens: this.itensArray.controls.map((g) => ({
        produtoId:  g.value.produtoId,
        quantidade: g.value.quantidade,
        desconto:   Math.round((g.value.desconto ?? 0) * 100),
      })),
    };

    this.lancamentoService.criar(body).subscribe({
      next: () => {
        this.salvando.set(false);
        this.router.navigate(['/lancamentos']);
      },
      error: (err: { error?: { message?: string } }) => {
        this.salvando.set(false);
        this.erro.set(err?.error?.message ?? 'Erro ao salvar o lançamento.');
      },
    });
  }

  cancelar(): void {
    this.router.navigate(['/lancamentos']);
  }

  private novoItemGroup(): FormGroup {
    return this.fb.group({
      produtoId:  ['', Validators.required],
      quantidade: [1,  [Validators.required, Validators.min(0.001)]],
      desconto:   [0,  [Validators.min(0)]],
    });
  }
}

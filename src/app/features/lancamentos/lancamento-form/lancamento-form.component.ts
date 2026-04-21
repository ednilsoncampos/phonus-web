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
import { MatTooltipModule } from '@angular/material/tooltip';
import { LancamentoService } from '../../../core/services/lancamento.service';
import { CategoriaLancamentoService } from '../../../core/services/categoria-lancamento.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { FornecedorService } from '../../../core/services/fornecedor.service';
import { ProdutoService } from '../../../core/services/produto.service';
import { CriarLancamentoRequest, FORMA_PAGAMENTO_LABELS, FormaPagamento, TIPO_LANCAMENTO_LABELS, TipoLancamento } from '../../../core/models/lancamento.model';
import { CategoriaLancamento } from '../../../core/models/categoria-lancamento.model';
import { Cliente } from '../../../core/models/cliente.model';
import { Fornecedor } from '../../../core/models/fornecedor.model';
import { Produto } from '../../../core/models/produto.model';
import { CurrencyBrlPipe } from '../../../shared/pipes/currency-brl.pipe';
import { DateFieldComponent } from '../../../shared/components/date-field/date-field.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

const FORMAS_PAGAMENTO = Object.entries(FORMA_PAGAMENTO_LABELS).map(
  ([value, label]) => ({ value: value as FormaPagamento, label }),
);

const FORMAS_PRAZO: FormaPagamento[] = ['CREDITO', 'CHEQUE', 'PROMISSORIA'];

@Component({
  selector: 'app-lancamento-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    PageHeaderComponent,
    CurrencyBrlPipe,
    DateFieldComponent,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './lancamento-form.component.html',
  styleUrl: './lancamento-form.component.scss',
})
export class LancamentoFormComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly lancamentoService = inject(LancamentoService);
  private readonly categoriaService = inject(CategoriaLancamentoService);
  private readonly clienteService = inject(ClienteService);
  private readonly fornecedorService = inject(FornecedorService);
  private readonly produtoService = inject(ProdutoService);
  private readonly router = inject(Router);

  tipoLabel(tipo: TipoLancamento): string {
    return TIPO_LANCAMENTO_LABELS[tipo];
  }
  readonly formasPagamento = FORMAS_PAGAMENTO;

  readonly form = this.fb.group({
    tipo:               ['SAIDA_CAIXA' as TipoLancamento, Validators.required],
    descricao:          [''],
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
    initialValue: 'SAIDA_CAIXA' as TipoLancamento,
  });

  private readonly fpSignal = toSignal(this.form.controls.formaPagamento.valueChanges, {
    initialValue: 'PIX' as FormaPagamento,
  });

  readonly isPrazo = computed(() => FORMAS_PRAZO.includes(this.fpSignal()));
  readonly mostrarCliente = computed(() => this.tipoSignal() === 'ENTRADA_CAIXA');
  readonly mostrarFornecedor = computed(() => this.tipoSignal() === 'SAIDA_CAIXA');

  readonly passo = signal(1);

  readonly carregando = signal(false);
  readonly salvando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly erroItens = signal<string | null>(null);

  readonly todasCategorias = signal<CategoriaLancamento[]>([]);
  readonly clientes = signal<Cliente[]>([]);
  readonly fornecedores = signal<Fornecedor[]>([]);
  readonly produtos = signal<Produto[]>([]);
  readonly itemGroups = signal<FormGroup[]>([]);

  readonly categoriasFiltradas = computed(() => {
    const tipo = this.tipoSignal();
    return this.todasCategorias().filter(
      (c) => c.ativo && c.tipo === tipo,
    );
  });

  ngOnInit(): void {
    const hoje = new Date();
    const y = hoje.getFullYear();
    const m = String(hoje.getMonth() + 1).padStart(2, '0');
    const d = String(hoje.getDate()).padStart(2, '0');
    this.form.controls.dataLancamento.setValue(`${y}-${m}-${d}`);

    this.form.controls.tipo.valueChanges.subscribe((tipo) => {
      if (tipo === 'ENTRADA_CAIXA') {
        this.form.controls.fornecedorId.setValue('');
      } else {
        this.form.controls.clienteId.setValue('');
      }
    });

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

    this.itensArray.valueChanges.subscribe(() => this.calcularTotal());

    this.adicionarItem();
  }

  adicionarItem(): void {
    this.itensArray.insert(0, this.novoItemGroup());
    this.itemGroups.set([...this.itensArray.controls]);
    this.calcularTotal();
  }

  removerItem(index: number): void {
    this.itensArray.removeAt(index);
    this.itemGroups.set([...this.itensArray.controls]);
    this.calcularTotal();
  }

  precoReferencia(produtoId: string): number {
    return this.produtos().find((p) => p.id === produtoId)?.precoVenda ?? 0;
  }

  avancar(): void {
    if (this.passo() === 1) {
      this.itensArray.controls.forEach((g) => g.markAllAsTouched());
      if (this.itensArray.length === 0) {
        this.erroItens.set('Adicione pelo menos um produto.');
        return;
      }
      if (this.itensArray.invalid) return;
      this.erroItens.set(null);
    } else if (this.passo() === 2) {
      this.form.controls.tipo.markAsTouched();
      this.form.controls.dataLancamento.markAsTouched();
      if (this.form.controls.tipo.invalid || this.form.controls.dataLancamento.invalid) return;
    }
    this.passo.update((p) => p + 1);
  }

  voltar(): void {
    this.passo.update((p) => p - 1);
  }

  salvar(): void {
    this.form.controls.formaPagamento.markAsTouched();
    this.form.controls.valorTotal.markAsTouched();
    if (this.form.controls.formaPagamento.invalid || this.form.controls.valorTotal.invalid) return;

    const descricao = this.itensArray.controls
      .map((g) => this.produtos().find((p) => p.id === g.get('produtoId')?.value)?.nome ?? '')
      .filter((nome) => nome)
      .join(', ')
      .substring(0, 300);
    this.form.controls.descricao.setValue(descricao);

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
      itens: this.itensArray.controls.map((g) => {
        const produtoId = g.value.produtoId as string;
        const produto = this.produtos().find((p) => p.id === produtoId);
        return {
          produtoId,
          quantidade: g.value.quantidade as number,
          desconto: Math.round((g.value.desconto ?? 0) * 100),
          ...(raw.tipo === 'SAIDA_CAIXA'
            ? { valorUnitario: produto?.precoCusto ?? produto?.precoVenda ?? 0 }
            : {}),
        };
      }),
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

  private calcularTotal(): void {
    const total = this.itensArray.controls.reduce((sum, g) => {
      const produtoId = g.get('produtoId')?.value as string;
      const produto = this.produtos().find((p) => p.id === produtoId);
      const precoReais = (produto?.precoVenda ?? 0) / 100;
      const quantidade = (g.get('quantidade')?.value as number) ?? 0;
      const desconto = (g.get('desconto')?.value as number) ?? 0;
      return sum + Math.max(0, precoReais * quantidade - desconto);
    }, 0);
    this.form.controls.valorTotal.setValue(
      Math.round(total * 100) / 100,
      { emitEvent: false },
    );
  }

  private novoItemGroup(): FormGroup {
    return this.fb.group({
      produtoId:  ['', Validators.required],
      quantidade: [1,  [Validators.required, Validators.min(0.001)]],
      desconto:   [0,  [Validators.min(0)]],
    });
  }
}

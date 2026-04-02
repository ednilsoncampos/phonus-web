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

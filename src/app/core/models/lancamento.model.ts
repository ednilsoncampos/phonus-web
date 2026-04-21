export type TipoLancamento = 'ENTRADA_CAIXA' | 'SAIDA_CAIXA';
export type FormaPagamento = 'PIX' | 'DINHEIRO' | 'DEBITO' | 'CREDITO' | 'CHEQUE' | 'PROMISSORIA';
export type OrigemLancamento = 'VOZ' | 'TEXTO';
export type StatusParcela = 'EM_ABERTO' | 'PAGA';

export const TIPO_LANCAMENTO_LABELS: Record<TipoLancamento, string> = {
  ENTRADA_CAIXA: 'Entrada de Caixa',
  SAIDA_CAIXA:   'Saída de Caixa',
};

export const FORMA_PAGAMENTO_LABELS: Record<FormaPagamento, string> = {
  PIX:         'Pix',
  DINHEIRO:    'Dinheiro',
  DEBITO:      'Cartão de Débito',
  CREDITO:     'Cartão de Crédito',
  CHEQUE:      'Cheque',
  PROMISSORIA: 'Promissória',
};

export interface LancamentoItemRequest {
  produtoId: string;
  quantidade: number;
  desconto: number;
  valorUnitario?: number;
}

export interface LancamentoItemResponse {
  id: string;
  produtoId: string;
  quantidade: number;
  valorUnitarioOriginal: number;
  desconto: number;
  valorUnitario: number;
  custoUnitario?: number;
  createdAt?: string;
}

export interface PagamentoResponse {
  id: string;
  parcelaId: string;
  tipoPagamento: FormaPagamento;
  origem: 'MANUAL' | 'AUTOMATICO';
  valorPago: number;
  dataPagamento: string;
  createdAt?: string;
}

export interface ParcelaResponse {
  id: string;
  numeroParcela: number;
  totalParcelas: number;
  valorParcela: number;
  dataVencimento: string;
  status: StatusParcela;
  pagamento?: PagamentoResponse;
  createdAt?: string;
}

export interface LancamentoResponse {
  id: string;
  usuarioId: string;
  tipo: TipoLancamento;
  descricao: string;
  valorTotal: number;
  formaPagamento: FormaPagamento;
  origem: OrigemLancamento;
  dataLancamento: string;
  parcelas: ParcelaResponse[];
  itens: LancamentoItemResponse[];
  createdAt?: string;
}

export interface CriarLancamentoRequest {
  tipo: TipoLancamento;
  descricao: string;
  valorTotal: number;
  formaPagamento: FormaPagamento;
  origem: OrigemLancamento;
  dataLancamento: string;
  quantidadeParcelas?: number;
  categoriaId?: string;
  clienteId?: string;
  fornecedorId?: string;
  itens: LancamentoItemRequest[];
}

export interface ListarLancamentosParams {
  tipo?: TipoLancamento;
  dataInicio?: string;
  dataFim?: string;
  clienteId?: string;
  fornecedorId?: string;
  page?: number;
  size?: number;
}

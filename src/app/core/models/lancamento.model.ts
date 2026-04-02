export type TipoLancamento = 'ENTRADA' | 'SAIDA';
export type FormaPagamento = 'PIX' | 'DINHEIRO' | 'DEBITO' | 'CREDITO' | 'CHEQUE' | 'PROMISSORIA';
export type OrigemLancamento = 'VOZ' | 'TEXTO';
export type StatusParcela = 'EM_ABERTO' | 'PAGA';

export interface LancamentoItemRequest {
  produtoId: string;
  quantidade: number;
  desconto: number;
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

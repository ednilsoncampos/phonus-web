export type OrigemMovimentacao =
  | 'VENDA'
  | 'COMPRA'
  | 'AJUSTE_POSITIVO'
  | 'AJUSTE_NEGATIVO';

export interface MovimentacaoEstoque {
  id: string;
  produtoId: string;
  tipo: 'ENTRADA' | 'SAIDA';
  quantidade: number;
  origem: OrigemMovimentacao;
  lancamentoItemId?: string;
  observacao?: string;
  criadoPor: string;
  createdAt?: string;
}

export interface AjusteEstoqueRequest {
  tipo: 'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO';
  quantidade: number;
  observacao?: string;
}

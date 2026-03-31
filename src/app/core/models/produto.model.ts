export type UnidadeMedida = 'UN' | 'KG' | 'L' | 'M' | 'M2' | 'CX' | 'PCT';

export interface Produto {
  id: string;
  nome: string;
  descricao?: string;
  categoriaId?: string;
  precoVenda: number;
  precoCusto?: number;
  quantidadeEstoque: number;
  estoqueMinimo: number;
  abaixoDoMinimo: boolean;
  unidadeMedida: UnidadeMedida;
  codigoBarras?: string;
  ncm?: string;
  cest?: string;
  ativo: boolean;
  criadoPor: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CriarProdutoRequest {
  nome: string;
  descricao?: string;
  categoriaId?: string;
  precoVenda: number;
  precoCusto?: number;
  estoqueMinimo: number;
  unidadeMedida: UnidadeMedida;
  codigoBarras?: string;
  ncm?: string;
  cest?: string;
}

export type AtualizarProdutoRequest = CriarProdutoRequest;

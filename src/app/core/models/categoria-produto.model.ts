export interface CategoriaProduto {
  id: string;
  nome: string;
  ativo: boolean;
  createdAt?: string;
}

export interface CriarCategoriaProdutoRequest {
  nome: string;
}

export interface AtualizarCategoriaProdutoRequest {
  nome: string;
  ativo: boolean;
}

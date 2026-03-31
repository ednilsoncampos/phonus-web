export interface Fornecedor {
  id: string;
  nome: string;
  documento?: string;
  email?: string;
  telefone?: string;
  ativo: boolean;
  createdAt?: string;
}

export interface CriarFornecedorRequest {
  nome: string;
  documento?: string;
  email?: string;
  telefone?: string;
}

export interface AtualizarFornecedorRequest extends CriarFornecedorRequest {
  ativo: boolean;
}

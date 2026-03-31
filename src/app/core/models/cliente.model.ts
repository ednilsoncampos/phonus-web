export interface Cliente {
  id: string;
  nome: string;
  documento?: string;
  email?: string;
  telefone?: string;
  ativo: boolean;
  createdAt?: string;
}

export interface CriarClienteRequest {
  nome: string;
  documento?: string;
  email?: string;
  telefone?: string;
}

export interface AtualizarClienteRequest extends CriarClienteRequest {
  ativo: boolean;
}

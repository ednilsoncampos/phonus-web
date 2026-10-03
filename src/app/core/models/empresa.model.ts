export interface Empresa {
  id?: string;
  nome: string;
  tipoDocumento: 'CNPJ' | 'CPF';
  documento: string;
  endereco: string | null;
  telefone: string | null;
}

export interface AtualizarEmpresaRequest {
  nome: string;
  endereco: string | null;
  telefone: string | null;
}

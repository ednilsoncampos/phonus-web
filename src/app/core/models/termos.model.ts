export interface Termos {
  id: string;
  versao: string;
  titulo: string;
  conteudo: string;
  declaracaoAceite: string;
  ativo: boolean;
  createdAt?: string;
}

export interface CriarTermosRequest {
  versao: string;
  titulo: string;
  conteudo: string;
  declaracaoAceite: string;
}

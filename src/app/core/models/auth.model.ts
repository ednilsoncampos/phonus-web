export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface RegistroRequest {
  nomeEmpresa: string;
  tipoDocumento: 'CNPJ' | 'CPF';
  documento: string;
  nome: string;
  email: string;
  senha: string;
  termosId: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface AlterarSenhaRequest {
  senhaAtual: string;
  novaSenha: string;
}

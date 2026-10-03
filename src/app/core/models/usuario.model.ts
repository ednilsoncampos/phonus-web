export type Papel = 'SUPER_ROOT' | 'ROOT' | 'ADMIN' | 'OPERADOR';

export type StatusUsuario = 'ATIVO' | 'INATIVO' | 'CONVIDADO';

export type Permissao =
  | 'LANCAMENTOS_REGISTRAR'
  | 'FINANCEIRO_CONSULTAR'
  | 'CADASTROS_CONSULTAR'
  | 'CADASTROS_GERENCIAR'
  | 'ESTOQUE_GERENCIAR'
  | 'USUARIOS_GERENCIAR'
  | 'USUARIOS_ALTERAR_PAPEL'
  | 'TERMOS_GERENCIAR'
  | 'EMPRESA_GERENCIAR'
  | 'CONTA_PROPRIA';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  status: StatusUsuario;
  permissoes?: Permissao[];
  createdAt?: string;
}

export interface ConvidarUsuarioRequest {
  email: string;
  nome: string;
  papel: 'ADMIN' | 'OPERADOR';
}

export interface AlterarPapelRequest {
  papel: 'ADMIN' | 'OPERADOR';
}

export interface PlanoResumido {
  planoId: string;
  googleProductId: string;
  nome: string;
  periodoCobranca: 'MONTHLY' | 'YEARLY';
  /** Em centavos. */
  preco: number;
  moeda: string;
}

export interface EntitlementResponse {
  usuarioId: string;
  isPremium: boolean;
  tier: 'FREE' | 'PREMIUM';
  planoAtual: PlanoResumido | null;
  expiraEm: string | null;
  diasCortesiaRestantes: number;
}

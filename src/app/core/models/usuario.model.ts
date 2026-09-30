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
  | 'CONTA_PROPRIA'
  | 'ASSINATURA_ENTITLEMENT_QUALQUER';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  status: StatusUsuario;
  permissoes?: Permissao[];
  cidade?: string;
  estado?: string;
  createdAt?: string;
}

export interface ConvidarUsuarioRequest {
  email: string;
  nome: string;
  papel: 'ADMIN' | 'OPERADOR';
}

export interface AlterarPapelRequest {
  papel: Papel;
}

export interface EntitlementResponse {
  usuarioId: string;
  isPremium: boolean;
  tier: 'FREE' | 'PREMIUM';
  planoAtual: { id: string; nome: string } | null;
  expiraEm: string | null;
  diasCortesiaRestantes: number;
}

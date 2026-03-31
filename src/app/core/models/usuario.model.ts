export type Papel = 'SUPER_ROOT' | 'ROOT' | 'ADMIN' | 'OPERADOR';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  ativo: boolean;
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

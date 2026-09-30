import { Permissao } from '../models/usuario.model';

const PRIORIDADE: { permissao: Permissao; rota: string }[] = [
  { permissao: 'FINANCEIRO_CONSULTAR', rota: '/dashboard' },
  { permissao: 'LANCAMENTOS_REGISTRAR', rota: '/lancamentos' },
  { permissao: 'CADASTROS_CONSULTAR', rota: '/produtos' },
  { permissao: 'USUARIOS_GERENCIAR', rota: '/usuarios' },
  { permissao: 'TERMOS_GERENCIAR', rota: '/termos' },
];

/**
 * Primeira rota que o usuário tem permissão de acessar, na ordem de prioridade acima.
 * Usada como destino padrão após login e como fallback quando o `permissionGuard` nega uma rota.
 */
export function landingRoute(permissoes: Permissao[] | undefined | null): string {
  const encontrada = PRIORIDADE.find((p) => permissoes?.includes(p.permissao));
  return encontrada?.rota ?? '/403';
}

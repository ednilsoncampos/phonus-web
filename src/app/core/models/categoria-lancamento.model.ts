export type TipoCategoria = 'ENTRADA' | 'SAIDA' | 'AMBOS';

export interface CategoriaLancamento {
  id: string;
  nome: string;
  tipo: TipoCategoria;
  ativo: boolean;
}

export interface CriarCategoriaLancamentoRequest {
  nome: string;
  tipo: TipoCategoria;
}

export interface AtualizarCategoriaLancamentoRequest {
  nome: string;
  tipo: TipoCategoria;
  ativo: boolean;
}

import { inject, Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../api/api.service';
import {
  AjusteEstoqueRequest,
  MovimentacaoEstoque,
  OrigemMovimentacao,
} from '../models/estoque.model';
import { PageResponse } from '../models/page-response.model';

export interface ListarMovimentacoesParams {
  page?: number;
  size?: number;
  produtoId?: string;
  dataInicio?: string;
  dataFim?: string;
  origem?: OrigemMovimentacao;
}

@Injectable({ providedIn: 'root' })
export class EstoqueService {
  private readonly api = inject(ApiService);

  listarMovimentacoes(params: ListarMovimentacoesParams = {}) {
    return this.api.get<PageResponse<MovimentacaoEstoque>>(
      '/estoque/movimentacoes',
      params as Record<string, unknown>,
    );
  }

  listarPorProduto(produtoId: string, params: { page?: number; size?: number } = {}) {
    return this.api.get<PageResponse<MovimentacaoEstoque>>(
      `/estoque/movimentacoes/produto/${produtoId}`,
      params as Record<string, unknown>,
    );
  }

  ajustar(produtoId: string, body: AjusteEstoqueRequest) {
    const params = new HttpParams().set('produtoId', produtoId);
    // ApiService.post não suporta HttpParams — chamamos diretamente via api.post
    // passando produtoId no path via query string embedding
    return this.api.post<MovimentacaoEstoque>(`/estoque/ajuste?produtoId=${produtoId}`, body);
  }
}

import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { AtualizarProdutoRequest, CriarProdutoRequest, Produto } from '../models/produto.model';
import { PageResponse } from '../models/page-response.model';

export interface ListarProdutosParams {
  page?: number;
  size?: number;
  categoriaId?: string;
  ativos?: boolean;
  abaixoDoMinimo?: boolean;
  busca?: string;
}

@Injectable({ providedIn: 'root' })
export class ProdutoService {
  private readonly api = inject(ApiService);

  listar(params: ListarProdutosParams = {}) {
    return this.api.get<PageResponse<Produto>>('/produtos', params as Record<string, unknown>);
  }

  buscar(id: string) {
    return this.api.get<Produto>(`/produtos/${id}`);
  }

  criar(body: CriarProdutoRequest) {
    return this.api.post<Produto>('/produtos', body);
  }

  atualizar(id: string, body: AtualizarProdutoRequest) {
    return this.api.put<Produto>(`/produtos/${id}`, body);
  }

  desativar(id: string) {
    return this.api.patch<Produto>(`/produtos/${id}/desativar`);
  }
}

import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import {
  AtualizarCategoriaProdutoRequest,
  CategoriaProduto,
  CriarCategoriaProdutoRequest,
} from '../models/categoria-produto.model';

@Injectable({ providedIn: 'root' })
export class CategoriaProdutoService {
  private readonly api = inject(ApiService);

  listar() {
    return this.api.get<CategoriaProduto[]>('/categorias/produto');
  }

  criar(body: CriarCategoriaProdutoRequest) {
    return this.api.post<CategoriaProduto>('/categorias/produto', body);
  }

  editar(id: string, body: AtualizarCategoriaProdutoRequest) {
    return this.api.put<CategoriaProduto>(`/categorias/produto/${id}`, body);
  }
}

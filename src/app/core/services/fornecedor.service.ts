import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import {
  AtualizarFornecedorRequest,
  CriarFornecedorRequest,
  Fornecedor,
} from '../models/fornecedor.model';
import { PageResponse } from '../models/page-response.model';

export interface ListarFornecedoresParams {
  page?: number;
  size?: number;
  ativos?: boolean;
  busca?: string;
}

@Injectable({ providedIn: 'root' })
export class FornecedorService {
  private readonly api = inject(ApiService);

  listar(params: ListarFornecedoresParams = {}) {
    return this.api.get<PageResponse<Fornecedor>>('/fornecedores', params as Record<string, unknown>);
  }

  criar(body: CriarFornecedorRequest) {
    return this.api.post<Fornecedor>('/fornecedores', body);
  }

  atualizar(id: string, body: AtualizarFornecedorRequest) {
    return this.api.put<Fornecedor>(`/fornecedores/${id}`, body);
  }
}

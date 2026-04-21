import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import {
  AtualizarClienteRequest,
  Cliente,
  CriarClienteRequest,
} from '../models/cliente.model';
import { PageResponse } from '../models/page-response.model';

export interface ListarClientesParams {
  page?: number;
  size?: number;
  ativos?: boolean;
  busca?: string;
}

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private readonly api = inject(ApiService);

  listar(params: ListarClientesParams = {}) {
    return this.api.get<PageResponse<Cliente>>('/clientes', params as Record<string, unknown>);
  }

  criar(body: CriarClienteRequest) {
    return this.api.post<Cliente>('/clientes', body);
  }

  atualizar(id: string, body: AtualizarClienteRequest) {
    return this.api.put<Cliente>(`/clientes/${id}`, body);
  }
}

import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import {
  CriarLancamentoRequest,
  LancamentoResponse,
  ListarLancamentosParams,
} from '../models/lancamento.model';
import { PageResponse } from '../models/page-response.model';

@Injectable({ providedIn: 'root' })
export class LancamentoService {
  private readonly api = inject(ApiService);

  listar(params: ListarLancamentosParams = {}) {
    return this.api.get<PageResponse<LancamentoResponse>>('/lancamentos', params as Record<string, unknown>);
  }

  buscar(id: string) {
    return this.api.get<LancamentoResponse>(`/lancamentos/${id}`);
  }

  criar(body: CriarLancamentoRequest) {
    return this.api.post<LancamentoResponse>('/lancamentos', body);
  }
}

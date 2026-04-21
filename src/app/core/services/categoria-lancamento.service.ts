import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import {
  AtualizarCategoriaLancamentoRequest,
  CategoriaLancamento,
  CriarCategoriaLancamentoRequest,
} from '../models/categoria-lancamento.model';

@Injectable({ providedIn: 'root' })
export class CategoriaLancamentoService {
  private readonly api = inject(ApiService);

  listar(ativas?: boolean) {
    return this.api.get<CategoriaLancamento[]>(
      '/categorias-lancamento',
      ativas !== undefined ? { ativas } : undefined,
    );
  }

  criar(body: CriarCategoriaLancamentoRequest) {
    return this.api.post<CategoriaLancamento>('/categorias-lancamento', body);
  }

  editar(id: string, body: AtualizarCategoriaLancamentoRequest) {
    return this.api.put<CategoriaLancamento>(`/categorias-lancamento/${id}`, body);
  }
}

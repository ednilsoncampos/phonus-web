import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { CriarTermosRequest, StatusAceiteTermos, Termos } from '../models/termos.model';

@Injectable({ providedIn: 'root' })
export class TermosService {
  private readonly api = inject(ApiService);

  listarVersoes() {
    return this.api.get<Termos[]>('/termos/admin');
  }

  criarVersao(body: CriarTermosRequest) {
    return this.api.post<Termos>('/termos/admin', body);
  }

  buscarAtual() {
    return this.api.get<Termos>('/termos/atual');
  }

  statusAceite() {
    return this.api.get<StatusAceiteTermos>('/termos/aceite/status');
  }

  aceitar(termosId: string) {
    return this.api.post<void>('/termos/aceite', { termosId });
  }
}

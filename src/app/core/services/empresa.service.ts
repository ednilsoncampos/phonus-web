import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { AtualizarEmpresaRequest, Empresa } from '../models/empresa.model';

@Injectable({ providedIn: 'root' })
export class EmpresaService {
  private readonly api = inject(ApiService);

  buscar() {
    return this.api.get<Empresa>('/empresa');
  }

  atualizar(body: AtualizarEmpresaRequest) {
    return this.api.put<Empresa>('/empresa', body);
  }
}

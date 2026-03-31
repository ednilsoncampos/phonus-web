import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { RelatorioMargemResponse } from '../models/relatorio.model';

@Injectable({ providedIn: 'root' })
export class RelatorioService {
  private readonly api = inject(ApiService);

  buscarMargem() {
    return this.api.get<RelatorioMargemResponse>('/relatorios/margem');
  }
}

import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import {
  AlterarPapelRequest,
  ConvidarUsuarioRequest,
  EntitlementResponse,
  Usuario,
} from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly api = inject(ApiService);

  listar() {
    return this.api.get<Usuario[]>('/usuarios');
  }

  buscar(id: string) {
    return this.api.get<Usuario>(`/usuarios/${id}`);
  }

  convidar(body: ConvidarUsuarioRequest) {
    return this.api.post<Usuario>('/usuarios', body);
  }

  alterarPapel(id: string, body: AlterarPapelRequest) {
    return this.api.patch<Usuario>(`/usuarios/${id}/papel`, body);
  }

  desativar(id: string) {
    return this.api.delete<void>(`/usuarios/${id}`);
  }

  buscarEntitlement(usuarioId: string) {
    return this.api.get<EntitlementResponse>(`/usuarios/${usuarioId}/entitlement`);
  }
}

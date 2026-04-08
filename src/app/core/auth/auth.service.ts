import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { ApiService } from '../api/api.service';
import { TokenService } from './token.service';
import { AuthResponse, LoginRequest } from '../models/auth.model';
import { Papel, Usuario } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly tokenService = inject(TokenService);
  private readonly router = inject(Router);

  private readonly _user = signal<Usuario | null>(null);

  readonly currentUser = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);
  readonly papel = computed(() => this._user()?.papel ?? null);

  hasRole(...roles: Papel[]): boolean {
    const p = this._user()?.papel;
    return p != null && roles.includes(p);
  }

  login(credentials: LoginRequest) {
    return this.api.post<AuthResponse>('/auth/login', credentials).pipe(
      tap((res) => {
        this.tokenService.save(res.accessToken, res.refreshToken);
      }),
    );
  }

  loadMe() {
    return this.api.get<Usuario>('/auth/me').pipe(
      tap((user) => this._user.set(user)),
    );
  }

  reenviarAtivacao(email: string) {
    return this.api.post<void>('/auth/reenviar-ativacao', { email });
  }

  refresh(refreshToken: string) {
    return this.api
      .post<AuthResponse>('/auth/refresh', { refreshToken })
      .pipe(
        tap((res) => {
          this.tokenService.save(res.accessToken, res.refreshToken);
        }),
      );
  }

  logout(): void {
    this.tokenService.clear();
    this._user.set(null);
    this.router.navigate(['/login']);
  }
}

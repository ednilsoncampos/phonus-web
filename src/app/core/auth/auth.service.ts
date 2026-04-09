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
  private refreshTimer?: ReturnType<typeof setTimeout>;

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
        this.scheduleRefresh(res.accessToken);
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
          this.scheduleRefresh(res.accessToken);
        }),
      );
  }

  logout(): void {
    this.clearRefreshTimer();
    this.tokenService.clear();
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  scheduleRefreshFromStorage(): void {
    const token = this.tokenService.getAccessToken();
    if (token) {
      this.scheduleRefresh(token);
    }
  }

  private scheduleRefresh(accessToken: string): void {
    this.clearRefreshTimer();

    let exp: number;
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      exp = payload.exp as number;
    } catch {
      return;
    }

    const msUntilExpiry = exp * 1000 - Date.now();
    // Agenda refresh 30s antes de expirar (ou imediatamente se já expirou/falta menos de 30s)
    const delay = Math.max(0, msUntilExpiry - 30_000);

    this.refreshTimer = setTimeout(() => {
      const refreshToken = this.tokenService.getRefreshToken();
      if (!refreshToken) {
        this.logout();
        return;
      }
      this.refresh(refreshToken).subscribe({
        next: () => { /* scheduleRefresh já é chamado no tap do refresh() */ },
        error: () => this.logout(),
      });
    }, delay);
  }

  private clearRefreshTimer(): void {
    if (this.refreshTimer !== undefined) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }
}

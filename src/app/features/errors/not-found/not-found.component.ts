import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  styles: `
    .container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      gap: 16px;
      padding: 32px;
      text-align: center;
      color: var(--phonus-text);
    }
    .code {
      font-size: 96px;
      font-weight: 700;
      color: var(--phonus-primary);
      line-height: 1;
    }
    h1 {
      font-size: 24px;
      font-weight: 600;
      margin: 0;
    }
    p {
      color: var(--phonus-text-secondary);
      margin: 0;
    }
    .actions { display: flex; gap: 12px; margin-top: 8px; }
  `,
  template: `
    <main class="container" aria-labelledby="titulo-404">
      <mat-icon aria-hidden="true" style="font-size:64px;width:64px;height:64px;color:var(--phonus-text-secondary)">
        search_off
      </mat-icon>
      <p class="code" aria-hidden="true">404</p>
      <h1 id="titulo-404">Página não encontrada</h1>
      <p>O endereço que você acessou não existe ou foi removido.</p>
      <div class="actions">
        <a mat-flat-button color="primary" routerLink="/dashboard">
          <mat-icon>home</mat-icon>
          Ir para o painel
        </a>
      </div>
    </main>
  `,
})
export class NotFoundComponent {}

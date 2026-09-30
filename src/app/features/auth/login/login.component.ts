import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/auth/auth.service';
import { landingRoute } from '../../../core/auth/landing-route';
import { environment } from '../../../../environments/environment';

const RESEND_ACTIVATION_COOLDOWN_SECONDS = 120;

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly hidePassword = signal(true);
  protected readonly showResendActivation = signal(false);
  protected readonly isResending = signal(false);
  protected readonly resendCooldown = signal(0);
  protected readonly loginBlockedSeconds = signal(0);

  protected readonly form = this.fb.group({
    email: [environment.devCredentials?.email ?? '', [Validators.required, Validators.email]],
    senha: [environment.devCredentials?.senha ?? '', Validators.required],
  });

  protected togglePasswordVisibility(event: MouseEvent): void {
    this.hidePassword.update((v) => !v);
    event.stopPropagation();
  }

  protected submit(): void {
    if (this.form.invalid || this.loginBlockedSeconds() > 0) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.showResendActivation.set(false);

    const { email, senha } = this.form.getRawValue();

    this.authService.login({ email: email!, senha: senha! }).subscribe({
      next: () => {
        this.authService.loadMe().subscribe({
          next: () => this.router.navigate([landingRoute(this.authService.permissoes())]),
          error: () => {
            this.isLoading.set(false);
            this.errorMessage.set('Erro ao carregar dados do usuário.');
          },
        });
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);

        if (err.status === 401) {
          this.errorMessage.set('E-mail ou senha incorretos.');
        } else if (err.status === 403) {
          this.errorMessage.set('Sua conta ainda não foi ativada. Verifique seu e-mail ou solicite um novo envio.');
          this.showResendActivation.set(true);
        } else if (err.status === 429) {
          const retryAfter = Number(err.headers.get('Retry-After')) || 60;
          this.errorMessage.set(`Muitas tentativas. Aguarde ${retryAfter}s e tente novamente.`);
          this.startCountdown(this.loginBlockedSeconds, retryAfter);
        } else {
          this.errorMessage.set(err.error?.message ?? 'Erro ao conectar. Tente novamente.');
        }
      },
    });
  }

  protected reenviarAtivacao(): void {
    const { email } = this.form.getRawValue();
    if (!email || this.isResending() || this.resendCooldown() > 0) return;

    this.isResending.set(true);

    this.authService.reenviarAtivacao(email).subscribe({
      next: () => {
        this.isResending.set(false);
        this.errorMessage.set('Se a conta existir e não estiver ativa, um novo e-mail de ativação foi enviado.');
        this.startCountdown(this.resendCooldown, RESEND_ACTIVATION_COOLDOWN_SECONDS);
      },
      error: () => {
        this.isResending.set(false);
        this.startCountdown(this.resendCooldown, RESEND_ACTIVATION_COOLDOWN_SECONDS);
      },
    });
  }

  private startCountdown(target: ReturnType<typeof signal<number>>, seconds: number): void {
    target.set(seconds);
    const intervalId = setInterval(() => {
      const next = target() - 1;
      if (next <= 0) {
        target.set(0);
        clearInterval(intervalId);
      } else {
        target.set(next);
      }
    }, 1000);
    this.destroyRef.onDestroy(() => clearInterval(intervalId));
  }
}

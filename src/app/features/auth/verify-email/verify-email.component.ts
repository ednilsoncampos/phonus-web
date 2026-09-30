import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/auth/auth.service';

const RESEND_COOLDOWN_SECONDS = 120;

@Component({
  selector: 'app-verify-email',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.scss',
})
export class VerifyEmailComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /** E-mail vindo do cadastro (navigation state). Sem ele, o usuário informa manualmente. */
  protected readonly email = signal<string | null>(
    (this.router.currentNavigation()?.extras.state?.['email'] as string | undefined) ?? null,
  );

  protected readonly isResending = signal(false);
  protected readonly cooldown = signal(0);
  protected readonly feedback = signal<string | null>(null);

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected reenviar(): void {
    if (this.isResending() || this.cooldown() > 0) return;

    let destino = this.email();
    if (!destino) {
      if (this.form.invalid) {
        this.form.markAllAsTouched();
        return;
      }
      destino = this.form.controls.email.value!.trim();
    }

    this.isResending.set(true);
    this.feedback.set(null);

    this.authService.reenviarAtivacao(destino).subscribe({
      next: () => this.aposReenvio('Se a conta existir e não estiver ativa, um novo e-mail de ativação foi enviado.'),
      error: () => this.aposReenvio('Não foi possível reenviar o e-mail agora. Tente novamente em instantes.'),
    });
  }

  private aposReenvio(mensagem: string): void {
    this.isResending.set(false);
    this.feedback.set(mensagem);
    this.startCooldown();
  }

  private startCooldown(): void {
    this.cooldown.set(RESEND_COOLDOWN_SECONDS);
    const intervalId = setInterval(() => {
      const next = this.cooldown() - 1;
      if (next <= 0) {
        this.cooldown.set(0);
        clearInterval(intervalId);
      } else {
        this.cooldown.set(next);
      }
    }, 1000);
    this.destroyRef.onDestroy(() => clearInterval(intervalId));
  }
}

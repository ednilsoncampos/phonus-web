import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/auth/auth.service';

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

  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly hidePassword = signal(true);

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', Validators.required],
  });

  protected togglePasswordVisibility(event: MouseEvent): void {
    this.hidePassword.update((v) => !v);
    event.stopPropagation();
  }

  protected submit(): void {
    if (this.form.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, senha } = this.form.getRawValue();

    this.authService.login({ email: email!, senha: senha! }).subscribe({
      next: () => {
        this.authService.loadMe().subscribe({
          next: () => this.router.navigate(['/dashboard']),
          error: () => {
            this.isLoading.set(false);
            this.errorMessage.set('Erro ao carregar dados do usuário.');
          },
        });
      },
      error: (err) => {
        this.isLoading.set(false);
        if (err?.status === 401) {
          this.errorMessage.set('E-mail ou senha incorretos.');
        } else {
          this.errorMessage.set('Erro ao conectar. Tente novamente.');
        }
      },
    });
  }
}

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/api/api.service';

@Component({
  selector: 'app-forgot-password',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);

  protected readonly isLoading = signal(false);
  protected readonly feedbackMessage = signal<string | null>(null);
  protected readonly isSuccess = signal(false);

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected submit(): void {
    if (this.form.invalid) return;

    this.isLoading.set(true);
    this.feedbackMessage.set(null);

    const { email } = this.form.getRawValue();

    this.api.post<{ message: string }>('/auth/esqueceu-senha', { email }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.isSuccess.set(true);
        this.feedbackMessage.set(res?.message ?? 'Se o e-mail existir, você receberá as instruções em breve.');
      },
      error: () => {
        this.isLoading.set(false);
        this.isSuccess.set(false);
        this.feedbackMessage.set('Erro ao processar solicitação. Tente novamente.');
      },
    });
  }
}

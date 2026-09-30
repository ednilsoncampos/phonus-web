import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { AuthService } from '../../../core/auth/auth.service';
import { Termos } from '../../../core/models/termos.model';
import { TermosService } from '../../../core/services/termos.service';
import {
  apenasDigitos,
  documentoValido,
  TipoDocumento,
} from '../../../shared/validators/documento.validator';
import {
  senhaDiferenteDeEmailValidator,
  senhaForteValidator,
  senhasConferemValidator,
} from '../../../shared/validators/senha.validator';

const SENHA_MIN = 8;
const SENHA_MAX = 72;

@Component({
  selector: 'app-register',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatRadioModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly termosService = inject(TermosService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly senhaMin = SENHA_MIN;
  protected readonly senhaMax = SENHA_MAX;

  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly hidePassword = signal(true);

  protected readonly termos = signal<Termos | null>(null);
  protected readonly carregandoTermos = signal(true);
  protected readonly termosErro = signal(false);

  protected readonly form = this.fb.group(
    {
      nomeEmpresa: ['', [Validators.required, Validators.maxLength(200)]],
      tipoDocumento: ['CNPJ' as TipoDocumento, Validators.required],
      documento: ['', [Validators.required, Validators.pattern(/^[\d.\-/\s]+$/)]],
      nome: ['', [Validators.required, Validators.maxLength(150)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
      senha: [
        '',
        [
          Validators.required,
          Validators.minLength(SENHA_MIN),
          Validators.maxLength(SENHA_MAX),
          senhaForteValidator(),
          senhaDiferenteDeEmailValidator((): string | undefined => this.form?.controls.email.value?.trim()),
        ],
      ],
      confirmaSenha: ['', Validators.required],
      aceite: [false, Validators.requiredTrue],
    },
    { validators: [senhasConferemValidator('senha', 'confirmaSenha'), documentoValido()] },
  );

  constructor() {
    this.form.controls.tipoDocumento.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.form.controls.documento.reset(''));

    // A regra "senha diferente do e-mail" depende do e-mail: revalida a senha quando ele muda.
    this.form.controls.email.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.form.controls.senha.updateValueAndValidity({ emitEvent: false }));

    this.carregarTermos();
  }

  protected carregarTermos(): void {
    this.carregandoTermos.set(true);
    this.termosErro.set(false);

    this.termosService.buscarAtual().subscribe({
      next: (termos) => {
        this.termos.set(termos);
        this.carregandoTermos.set(false);
      },
      error: () => {
        this.termosErro.set(true);
        this.carregandoTermos.set(false);
      },
    });
  }

  protected togglePasswordVisibility(event: MouseEvent): void {
    this.hidePassword.update((v) => !v);
    event.stopPropagation();
  }

  protected submit(): void {
    const termos = this.termos();
    if (this.isLoading() || !termos) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const v = this.form.getRawValue();
    const email = v.email!.trim();

    this.authService
      .registrar({
        nomeEmpresa: v.nomeEmpresa!.trim(),
        tipoDocumento: v.tipoDocumento!,
        documento: apenasDigitos(v.documento),
        nome: v.nome!.trim(),
        email,
        senha: v.senha!,
        termosId: termos.id,
      })
      .subscribe({
        next: () => this.router.navigate(['/verifique-email'], { state: { email } }),
        error: (err: HttpErrorResponse) => {
          this.isLoading.set(false);
          this.errorMessage.set(this.mensagemDeErro(err));
        },
      });
  }

  private mensagemDeErro(err: HttpErrorResponse): string {
    const apiMessage: string | undefined = err.error?.message;

    switch (err.status) {
      case 409:
        return apiMessage ?? 'E-mail já cadastrado.';
      case 400:
        return apiMessage ?? 'Dados inválidos. Verifique as informações e tente novamente.';
      case 429:
        return 'Muitas tentativas. Aguarde um instante e tente novamente.';
      default:
        return 'Não foi possível concluir o cadastro. Tente novamente.';
    }
  }
}

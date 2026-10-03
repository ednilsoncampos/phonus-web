import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Empresa } from '../../../core/models/empresa.model';
import { EmpresaService } from '../../../core/services/empresa.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PhoneMaskDirective } from '../../../shared/directives/phone-mask.directive';

@Component({
  selector: 'app-empresa-form',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    PageHeaderComponent,
    PhoneMaskDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './empresa-form.html',
  styleUrl: './empresa-form.scss',
})
export class EmpresaForm implements OnInit {
  private readonly empresaService = inject(EmpresaService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  protected readonly carregando = signal(false);
  protected readonly salvando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly empresa = signal<Empresa | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(150)]],
    endereco: ['', Validators.maxLength(200)],
    telefone: ['', Validators.maxLength(30)],
  });

  ngOnInit(): void {
    this.carregar();
  }

  protected carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);

    this.empresaService.buscar().subscribe({
      next: (e) => {
        this.aplicar(e);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar os dados da empresa.');
        this.carregando.set(false);
      },
    });
  }

  protected salvar(): void {
    if (this.salvando()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    this.salvando.set(true);

    this.empresaService
      .atualizar({
        nome: v.nome.trim(),
        endereco: v.endereco.trim() || null,
        telefone: v.telefone.trim() || null,
      })
      .subscribe({
        next: (e) => {
          this.aplicar(e);
          this.salvando.set(false);
          this.snackBar.open('Dados da empresa atualizados.', 'Fechar', { duration: 4000 });
        },
        error: () => this.salvando.set(false),
      });
  }

  private aplicar(e: Empresa): void {
    this.empresa.set(e);
    this.form.reset({ nome: e.nome, endereco: e.endereco ?? '', telefone: e.telefone ?? '' });
  }
}

import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TermosService } from '../../../core/services/termos.service';
import { Termos } from '../../../core/models/termos.model';
import { DateBrPipe } from '../../../shared/pipes/date-br.pipe';

@Component({
  selector: 'app-reaceite-termos-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule, DateBrPipe],
  templateUrl: './reaceite-termos-dialog.html',
  styleUrl: './reaceite-termos-dialog.scss',
})
export class ReaceiteTermosDialog implements OnInit {
  private readonly service = inject(TermosService);
  private readonly dialogRef = inject(MatDialogRef<ReaceiteTermosDialog>);

  readonly carregando = signal(true);
  readonly aceitando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly termos = signal<Termos | null>(null);

  ngOnInit(): void {
    this.service.buscarAtual().subscribe({
      next: (t) => {
        this.termos.set(t);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar os termos vigentes.');
        this.carregando.set(false);
      },
    });
  }

  aceitar(): void {
    const termos = this.termos();
    if (!termos) return;

    this.aceitando.set(true);
    this.erro.set(null);

    this.service.aceitar(termos.id).subscribe({
      next: () => {
        this.aceitando.set(false);
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.aceitando.set(false);
        this.erro.set(err?.error?.message ?? 'Não foi possível registrar o aceite. Tente novamente.');
      },
    });
  }
}

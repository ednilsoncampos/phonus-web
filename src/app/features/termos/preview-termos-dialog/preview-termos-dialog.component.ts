import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TermosService } from '../../../core/services/termos.service';
import { Termos } from '../../../core/models/termos.model';
import { DateBrPipe } from '../../../shared/pipes/date-br.pipe';

@Component({
  selector: 'app-preview-termos-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule, DateBrPipe],
  templateUrl: './preview-termos-dialog.component.html',
  styleUrl: './preview-termos-dialog.component.scss',
})
export class PreviewTermosDialogComponent implements OnInit {
  private readonly service = inject(TermosService);
  private readonly dialogRef = inject(MatDialogRef<PreviewTermosDialogComponent>);

  readonly carregando = signal(true);
  readonly erro = signal<string | null>(null);
  readonly termos = signal<Termos | null>(null);

  ngOnInit(): void {
    this.service.buscarAtual().subscribe({
      next: (t) => {
        this.termos.set(t);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar os termos em vigor.');
        this.carregando.set(false);
      },
    });
  }

  fechar(): void {
    this.dialogRef.close();
  }
}

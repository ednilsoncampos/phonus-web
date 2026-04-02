import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { TermosService } from '../../../core/services/termos.service';
import { Termos } from '../../../core/models/termos.model';
import { DateBrPipe } from '../../../shared/pipes/date-br.pipe';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { NovaVersaoDialogComponent } from '../nova-versao-dialog/nova-versao-dialog.component';
import { PreviewTermosDialogComponent } from '../preview-termos-dialog/preview-termos-dialog.component';

@Component({
  selector: 'app-termos-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    DateBrPipe,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './termos-list.component.html',
  styleUrl: './termos-list.component.scss',
})
export class TermosListComponent implements OnInit {
  private readonly service = inject(TermosService);
  private readonly dialog = inject(MatDialog);

  readonly colunas = ['versao', 'titulo', 'data', 'status', 'acoes'];
  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly versoes = signal<Termos[]>([]);

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);

    this.service.listarVersoes().subscribe({
      next: (lista) => {
        this.versoes.set(lista);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar as versões dos termos.');
        this.carregando.set(false);
      },
    });
  }

  abrirNovaVersao(): void {
    const ref = this.dialog.open<NovaVersaoDialogComponent, void, Termos | undefined>(
      NovaVersaoDialogComponent,
      { width: '640px', maxHeight: '90vh' },
    );

    ref.afterClosed().subscribe((nova) => {
      if (nova) {
        this.versoes.update((lista) =>
          [nova, ...lista.map((t) => ({ ...t, ativo: false }))],
        );
      }
    });
  }

  abrirPreview(): void {
    this.dialog.open(PreviewTermosDialogComponent, {
      width: '660px',
      maxHeight: '90vh',
    });
  }
}

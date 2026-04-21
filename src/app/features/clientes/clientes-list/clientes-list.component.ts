import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ClienteService } from '../../../core/services/cliente.service';
import { Cliente } from '../../../core/models/cliente.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PhonePipe } from '../../../shared/pipes/phone.pipe';
import {
  ClienteDialogComponent,
  ClienteDialogData,
} from '../cliente-dialog/cliente-dialog.component';

@Component({
  selector: 'app-clientes-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    PhonePipe,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './clientes-list.component.html',
  styleUrl: './clientes-list.component.scss',
})
export class ClientesListComponent implements OnInit, AfterViewInit {
  private readonly service = inject(ClienteService);
  private readonly dialog = inject(MatDialog);

  @ViewChild('buscaInput') buscaInput?: ElementRef<HTMLInputElement>;

  readonly colunas = ['nome', 'documento', 'email', 'telefone', 'status', 'acoes'];
  readonly pageSize = 20;

  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly clientes = signal<Cliente[]>([]);
  readonly totalElements = signal(0);
  readonly page = signal(0);
  readonly apenasAtivos = signal(true);
  readonly busca = signal('');

  ngOnInit(): void {
    this.carregar();
  }

  ngAfterViewInit(): void {
    this.buscaInput?.nativeElement.focus();
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);

    this.service
      .listar({ page: this.page(), size: this.pageSize, ativos: this.apenasAtivos(), busca: this.busca() || undefined })
      .subscribe({
        next: (res) => {
          this.clientes.set(res.content);
          this.totalElements.set(res.totalElements);
          this.carregando.set(false);
        },
        error: () => {
          this.erro.set('Não foi possível carregar os clientes.');
          this.carregando.set(false);
        },
      });
  }

  setApenasAtivos(value: boolean): void {
    this.apenasAtivos.set(value);
    this.page.set(0);
    this.carregar();
  }

  onBusca(event: Event): void {
    this.busca.set((event.target as HTMLInputElement).value);
    this.page.set(0);
    this.carregar();
  }

  onPage(event: PageEvent): void {
    this.page.set(event.pageIndex);
    this.carregar();
  }

  abrirDialog(cliente?: Cliente): void {
    const ref = this.dialog.open<ClienteDialogComponent, ClienteDialogData, Cliente | undefined>(
      ClienteDialogComponent,
      { data: { cliente }, width: '480px' },
    );

    ref.afterClosed().subscribe((resultado) => {
      if (resultado) this.carregar();
    });
  }
}

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
import { FornecedorService } from '../../../core/services/fornecedor.service';
import { Fornecedor } from '../../../core/models/fornecedor.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PhonePipe } from '../../../shared/pipes/phone.pipe';
import {
  FornecedorDialogComponent,
  FornecedorDialogData,
} from '../fornecedor-dialog/fornecedor-dialog.component';

@Component({
  selector: 'app-fornecedores-list',
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
  templateUrl: './fornecedores-list.component.html',
  styleUrl: './fornecedores-list.component.scss',
})
export class FornecedoresListComponent implements OnInit, AfterViewInit {
  private readonly service = inject(FornecedorService);
  private readonly dialog = inject(MatDialog);

  @ViewChild('buscaInput') buscaInput?: ElementRef<HTMLInputElement>;

  readonly colunas = ['nome', 'documento', 'email', 'telefone', 'status', 'acoes'];
  readonly pageSize = 20;

  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly fornecedores = signal<Fornecedor[]>([]);
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
          this.fornecedores.set(res.content);
          this.totalElements.set(res.totalElements);
          this.carregando.set(false);
        },
        error: () => {
          this.erro.set('Não foi possível carregar os fornecedores.');
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

  abrirDialog(fornecedor?: Fornecedor): void {
    const ref = this.dialog.open<
      FornecedorDialogComponent,
      FornecedorDialogData,
      Fornecedor | undefined
    >(FornecedorDialogComponent, { data: { fornecedor }, width: '480px' });

    ref.afterClosed().subscribe((resultado) => {
      if (resultado) this.carregar();
    });
  }
}

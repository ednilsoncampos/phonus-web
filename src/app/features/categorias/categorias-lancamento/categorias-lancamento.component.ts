import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-categorias-lancamento',
  imports: [PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-page-header title="Categorias de Lançamento" />`,
})
export class CategoriasLancamentoComponent {}

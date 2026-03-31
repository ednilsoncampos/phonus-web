import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-clientes-list',
  imports: [PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-page-header title="Clientes" />`,
})
export class ClientesListComponent {}

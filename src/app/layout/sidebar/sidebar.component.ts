import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { AuthService } from '../../core/auth/auth.service';
import { Papel } from '../../core/models/usuario.model';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles: Papel[] | null; // null = todos os papéis
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: 'dashboard', route: '/dashboard', roles: null },
  { label: 'Usuários', icon: 'group', route: '/usuarios', roles: ['SUPER_ROOT', 'ROOT', 'ADMIN'] },
  { label: 'Produtos', icon: 'inventory_2', route: '/produtos', roles: ['SUPER_ROOT', 'ROOT', 'ADMIN'] },
  { label: 'Estoque', icon: 'warehouse', route: '/estoque', roles: ['SUPER_ROOT', 'ROOT', 'ADMIN'] },
  { label: 'Cat. Produto', icon: 'category', route: '/categorias/produto', roles: ['SUPER_ROOT', 'ROOT', 'ADMIN'] },
  { label: 'Cat. Lançamento', icon: 'label', route: '/categorias/lancamento', roles: ['SUPER_ROOT', 'ROOT', 'ADMIN'] },
  { label: 'Lançamentos', icon: 'receipt_long', route: '/lancamentos', roles: ['SUPER_ROOT', 'ROOT', 'ADMIN'] },
  { label: 'Clientes', icon: 'people', route: '/clientes', roles: ['SUPER_ROOT', 'ROOT', 'ADMIN'] },
  { label: 'Fornecedores', icon: 'local_shipping', route: '/fornecedores', roles: ['SUPER_ROOT', 'ROOT', 'ADMIN'] },
  { label: 'Termos', icon: 'gavel', route: '/termos', roles: ['SUPER_ROOT', 'ROOT'] },
  { label: 'Relatórios', icon: 'bar_chart', route: '/relatorios/margem', roles: ['SUPER_ROOT', 'ROOT', 'ADMIN'] },
];

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, MatIconModule, MatListModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  private readonly auth = inject(AuthService);
  readonly collapsed = input(false);

  protected readonly visibleItems = computed(() => {
    const papel = this.auth.papel();
    return NAV_ITEMS.filter(
      (item) => item.roles === null || (papel !== null && item.roles.includes(papel)),
    );
  });
}

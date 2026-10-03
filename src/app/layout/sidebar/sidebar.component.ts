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
import { Permissao } from '../../core/models/usuario.model';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  permissao: Permissao;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: 'dashboard', route: '/dashboard', permissao: 'FINANCEIRO_CONSULTAR' },
  { label: 'Usuários', icon: 'group', route: '/usuarios', permissao: 'USUARIOS_GERENCIAR' },
  { label: 'Cat. Produto', icon: 'category', route: '/categorias/produto', permissao: 'CADASTROS_CONSULTAR' },
  { label: 'Produtos', icon: 'inventory_2', route: '/produtos', permissao: 'CADASTROS_CONSULTAR' },
  { label: 'Estoque', icon: 'warehouse', route: '/estoque', permissao: 'ESTOQUE_GERENCIAR' },
  { label: 'Clientes', icon: 'people', route: '/clientes', permissao: 'CADASTROS_CONSULTAR' },
  { label: 'Fornecedores', icon: 'local_shipping', route: '/fornecedores', permissao: 'CADASTROS_CONSULTAR' },
  { label: 'Cat. Lançamento', icon: 'label', route: '/categorias/lancamento', permissao: 'CADASTROS_CONSULTAR' },
  { label: 'Lançamentos', icon: 'receipt_long', route: '/lancamentos', permissao: 'FINANCEIRO_CONSULTAR' },
  { label: 'Empresa', icon: 'business', route: '/empresa', permissao: 'EMPRESA_GERENCIAR' },
  { label: 'Termos', icon: 'gavel', route: '/termos', permissao: 'TERMOS_GERENCIAR' },
  { label: 'Relatórios', icon: 'bar_chart', route: '/relatorios/margem', permissao: 'ESTOQUE_GERENCIAR' },
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
    const permissoes = this.auth.permissoes();
    return NAV_ITEMS.filter((item) => permissoes.includes(item.permissao));
  });
}

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
  { label: 'Clientes', icon: 'people', route: '/clientes', roles: ['SUPER_ROOT', 'ROOT', 'ADMIN'] },
  { label: 'Fornecedores', icon: 'local_shipping', route: '/fornecedores', roles: ['SUPER_ROOT', 'ROOT', 'ADMIN'] },
  { label: 'Termos', icon: 'gavel', route: '/termos', roles: ['SUPER_ROOT', 'ROOT'] },
  { label: 'Relatórios', icon: 'bar_chart', route: '/relatorios/margem', roles: ['SUPER_ROOT', 'ROOT', 'ADMIN'] },
];

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, MatIconModule, MatListModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="sidebar" [class.sidebar--collapsed]="collapsed()" aria-label="Menu principal">
      <mat-nav-list>
        @for (item of visibleItems(); track item.route) {
          <a
            mat-list-item
            [routerLink]="item.route"
            routerLinkActive="active"
            [attr.aria-label]="item.label"
          >
            <mat-icon matListItemIcon aria-hidden="true">{{ item.icon }}</mat-icon>
            @if (!collapsed()) {
              <span matListItemTitle>{{ item.label }}</span>
            }
          </a>
        }
      </mat-nav-list>
    </nav>
  `,
  styles: `
    .sidebar {
      position: fixed;
      top: 64px;
      left: 0;
      bottom: 0;
      width: 220px;
      background: var(--phonus-surface);
      border-right: 1px solid var(--phonus-border);
      overflow-y: auto;
      overflow-x: hidden;
      transition: width 0.2s ease;
      z-index: 99;
    }
    .sidebar--collapsed {
      width: 64px;
    }
    mat-nav-list {
      padding-top: 8px;
    }
    a[mat-list-item] {
      border-radius: 8px;
      margin: 2px 8px;
      color: var(--phonus-text-secondary);
      transition: background 0.15s, color 0.15s;

      &.active {
        background: var(--phonus-primary-light);
        color: var(--phonus-primary-dark);

        mat-icon {
          color: var(--phonus-primary);
        }
      }

      &:hover:not(.active) {
        background: var(--phonus-background);
        color: var(--phonus-text);
      }
    }
  `,
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

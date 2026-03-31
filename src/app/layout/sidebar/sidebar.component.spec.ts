import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, signal } from '@angular/core';
import { SidebarComponent } from './sidebar.component';
import { AuthService } from '../../core/auth/auth.service';

describe('SidebarComponent — visibleItems', () => {
  let authService: AuthService;

  function setup(papel: string | null) {
    TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    authService = TestBed.inject(AuthService);
    vi.spyOn(authService, 'papel').mockReturnValue(papel as any);
  }

  it('OPERADOR vê apenas Dashboard', () => {
    setup('OPERADOR');

    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    const items: { route: string }[] = component.visibleItems();
    expect(items.every((i) => i.route === '/dashboard')).toBe(true);
    expect(items).toHaveLength(1);
  });

  it('ADMIN vê Dashboard e outros itens restritos a ADMIN', () => {
    setup('ADMIN');

    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    const items: { route: string }[] = component.visibleItems();
    const routes = items.map((i) => i.route);
    expect(routes).toContain('/dashboard');
    expect(routes).toContain('/produtos');
    expect(routes).not.toContain('/termos');
  });

  it('ROOT vê todos os itens incluindo Termos', () => {
    setup('ROOT');

    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    const items: { route: string }[] = component.visibleItems();
    const routes = items.map((i) => i.route);
    expect(routes).toContain('/termos');
    expect(routes).toContain('/dashboard');
  });

  it('null papel vê apenas itens com roles === null', () => {
    setup(null);

    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    const items: { roles: string[] | null }[] = component.visibleItems();
    expect(items.every((i) => i.roles === null)).toBe(true);
  });
});

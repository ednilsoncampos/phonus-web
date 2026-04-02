import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { DashboardService } from '../../core/services/dashboard.service';
import { AuthService } from '../../core/auth/auth.service';
import { DashboardData } from '../../core/models/dashboard.model';

const mockData: DashboardData = {
  saldoCaixa: 10000,
  totalAReceber: 5000,
  totalAPagar: 3000,
  contasVencidas: 2,
  produtosAbaixoDoMinimo: 1,
};

describe('DashboardComponent', () => {
  let dashboardService: DashboardService;
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideRouter([]), provideAnimationsAsync()],
    });
    dashboardService = TestBed.inject(DashboardService);
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);

    vi.spyOn(dashboardService, 'carregar').mockReturnValue(of(mockData));
    vi.spyOn(authService, 'hasRole').mockReturnValue(true);
  });

  it('carregar preenche kpiCards com 5 cards', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    expect(dashboardService.carregar).toHaveBeenCalled();
    expect(comp.kpiCards()).toHaveLength(5);
  });

  it('carregar define erro quando falha', () => {
    vi.spyOn(dashboardService, 'carregar').mockReturnValue(
      throwError(() => new Error('falha')),
    );
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    expect(comp.erro()).toBe('Não foi possível carregar os dados do dashboard.');
  });

  it('saudacao retorna "Olá, João" quando currentUser tem nome', () => {
    vi.spyOn(authService, 'currentUser').mockReturnValue({
      id: 'u1',
      nome: 'João',
      email: 'j@j.com',
      papel: 'ADMIN',
      ativo: true,
    });
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    expect(comp.saudacao()).toBe('Olá, João');
  });

  it('kpiCards retorna array vazio quando dados é null', () => {
    vi.spyOn(dashboardService, 'carregar').mockReturnValue(of(null as any));
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    expect(comp.kpiCards()).toEqual([]);
  });

  it('navegar(card com route) chama router.navigate com os valores corretos', () => {
    vi.spyOn(router, 'navigate');
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    const cards = comp.kpiCards();
    const cardComRoute = cards.find((c) => c.route != null)!;
    comp.navegar(cardComRoute);

    expect(router.navigate).toHaveBeenCalledWith(cardComRoute.route, {
      queryParams: cardComRoute.queryParams,
    });
  });

  it('navegar(card sem route) não chama router.navigate', () => {
    vi.spyOn(router, 'navigate');
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    const cards = comp.kpiCards();
    const cardSemRoute = cards.find((c) => c.route == null)!;
    comp.navegar(cardSemRoute);

    expect(router.navigate).not.toHaveBeenCalled();
  });
});

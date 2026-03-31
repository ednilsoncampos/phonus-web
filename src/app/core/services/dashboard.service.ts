import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { DashboardData } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = inject(ApiService);

  carregar() {
    return this.api.get<DashboardData>('/dashboard');
  }
}

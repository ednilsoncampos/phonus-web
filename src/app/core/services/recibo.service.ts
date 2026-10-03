import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, of, tap } from 'rxjs';
import { ApiService } from '../api/api.service';

export type FormatoRecibo = 'pdf' | 'png';

export interface ArquivoRecibo {
  blob: Blob;
  nome: string;
}

@Injectable({ providedIn: 'root' })
export class ReciboService {
  private readonly api = inject(ApiService);

  /** A API gera o recibo a cada chamada (limite de 30/min): reutiliza o arquivo já baixado. */
  private readonly cache = new Map<string, ArquivoRecibo>();

  baixar(lancamentoId: string, formato: FormatoRecibo = 'pdf'): Observable<ArquivoRecibo> {
    const chave = `${lancamentoId}:${formato}`;
    const emCache = this.cache.get(chave);
    if (emCache) return of(emCache);

    return this.api.getBlob(`/lancamentos/${lancamentoId}/recibo`, { formato }).pipe(
      map((resp) => ({
        blob: resp.body as Blob,
        nome:
          /filename="([^"]+)"/.exec(resp.headers.get('Content-Disposition') ?? '')?.[1] ??
          `recibo-${lancamentoId.slice(0, 8).toUpperCase()}.${formato}`,
      })),
      tap((arquivo) => this.cache.set(chave, arquivo)),
    );
  }

  /** Segundos de espera informados em `Retry-After` num 429; `null` se não for esse erro. */
  segundosParaTentarNovamente(err: unknown): number | null {
    if (!(err instanceof HttpErrorResponse) || err.status !== 429) return null;
    const segundos = Number(err.headers.get('Retry-After'));
    return Number.isFinite(segundos) && segundos > 0 ? Math.ceil(segundos) : 60;
  }
}

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'currencyBrl' })
export class CurrencyBrlPipe implements PipeTransform {
  transform(centavos: number | null | undefined): string {
    if (centavos == null) return '—';
    return (centavos / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }
}

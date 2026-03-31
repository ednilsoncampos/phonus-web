import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'dateBr' })
export class DateBrPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '—';
    const [y, m, d] = value.split('-');
    return `${d}/${m}/${y}`;
  }
}

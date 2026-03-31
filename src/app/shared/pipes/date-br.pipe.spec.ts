import { DateBrPipe } from './date-br.pipe';

describe('DateBrPipe', () => {
  let pipe: DateBrPipe;

  beforeEach(() => {
    pipe = new DateBrPipe();
  });

  it('retorna "—" para null', () => {
    expect(pipe.transform(null)).toBe('—');
  });

  it('retorna "—" para undefined', () => {
    expect(pipe.transform(undefined)).toBe('—');
  });

  it('retorna "—" para string vazia', () => {
    expect(pipe.transform('')).toBe('—');
  });

  it('formata yyyy-MM-dd para dd/MM/yyyy', () => {
    expect(pipe.transform('2024-03-15')).toBe('15/03/2024');
  });

  it('formata data de janeiro corretamente', () => {
    expect(pipe.transform('2024-01-01')).toBe('01/01/2024');
  });

  it('formata data de dezembro corretamente', () => {
    expect(pipe.transform('2023-12-31')).toBe('31/12/2023');
  });
});

import { CurrencyBrlPipe } from './currency-brl.pipe';

describe('CurrencyBrlPipe', () => {
  let pipe: CurrencyBrlPipe;

  beforeEach(() => {
    pipe = new CurrencyBrlPipe();
  });

  it('retorna "—" para null', () => {
    expect(pipe.transform(null)).toBe('—');
  });

  it('retorna "—" para undefined', () => {
    expect(pipe.transform(undefined)).toBe('—');
  });

  it('converte centavos para reais formatados em pt-BR', () => {
    const result = pipe.transform(1250);
    expect(result).toContain('12,50');
    expect(result).toContain('R$');
  });

  it('converte zero corretamente', () => {
    const result = pipe.transform(0);
    expect(result).toContain('0,00');
  });

  it('converte valor grande corretamente', () => {
    const result = pipe.transform(100000);
    expect(result).toContain('1.000,00');
  });
});

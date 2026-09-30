import { FormBuilder } from '@angular/forms';
import { apenasDigitos, cnpjValido, cpfValido, documentoValido } from './documento.validator';

describe('documento.validator', () => {
  it('apenasDigitos remove qualquer caractere não numérico', () => {
    expect(apenasDigitos('11.222.333/0001-81')).toBe('11222333000181');
    expect(apenasDigitos(null)).toBe('');
  });

  it('cpfValido aceita CPF com dígitos verificadores corretos', () => {
    expect(cpfValido('52998224725')).toBe(true);
    expect(cpfValido('529.982.247-25')).toBe(true);
  });

  it('cpfValido rejeita dígito verificador errado, tamanho errado e sequência repetida', () => {
    expect(cpfValido('52998224724')).toBe(false);
    expect(cpfValido('5299822472')).toBe(false);
    expect(cpfValido('11111111111')).toBe(false);
  });

  it('cnpjValido aceita CNPJ com dígitos verificadores corretos', () => {
    expect(cnpjValido('11222333000181')).toBe(true);
    expect(cnpjValido('11.222.333/0001-81')).toBe(true);
  });

  it('cnpjValido rejeita dígito verificador errado, tamanho errado e sequência repetida', () => {
    expect(cnpjValido('11222333000182')).toBe(false);
    expect(cnpjValido('1122233300018')).toBe(false);
    expect(cnpjValido('00000000000000')).toBe(false);
  });

  describe('documentoValido (grupo)', () => {
    const fb = new FormBuilder();
    const criar = (tipo: 'CNPJ' | 'CPF', documento: string) =>
      fb.group({ tipoDocumento: [tipo], documento: [documento] }, { validators: documentoValido() });

    it('marca documentoInvalido no controle quando o documento não bate com o tipo', () => {
      const form = criar('CPF', '11222333000181');
      expect(form.controls['documento'].hasError('documentoInvalido')).toBe(true);
    });

    it('não marca erro para documento válido do tipo escolhido', () => {
      expect(criar('CNPJ', '11222333000181').controls['documento'].errors).toBeNull();
      expect(criar('CPF', '52998224725').controls['documento'].errors).toBeNull();
    });

    it('não marca erro para documento vazio (fica a cargo do required)', () => {
      expect(criar('CNPJ', '').controls['documento'].errors).toBeNull();
    });

    it('remove o erro quando o documento passa a ser válido', () => {
      const form = criar('CNPJ', '123');
      expect(form.controls['documento'].hasError('documentoInvalido')).toBe(true);

      form.controls['documento'].setValue('11222333000181');

      expect(form.controls['documento'].hasError('documentoInvalido')).toBe(false);
    });
  });
});

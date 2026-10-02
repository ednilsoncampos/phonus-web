import { FormControl } from '@angular/forms';
import {
  senhaDiferenteDeEmailValidator,
  senhaForteValidator,
  senhaMaxBytesValidator,
} from './senha.validator';

describe('senha.validator', () => {
  it('senhaForteValidator exige letra e número', () => {
    const v = senhaForteValidator();
    expect(v(new FormControl('abc12345'))).toBeNull();
    expect(v(new FormControl('somenteletras'))).toEqual({ senhaFraca: true });
    expect(v(new FormControl('12345678'))).toEqual({ senhaFraca: true });
  });

  it('senhaDiferenteDeEmailValidator recusa o e-mail inteiro e a parte antes do @', () => {
    const v = senhaDiferenteDeEmailValidator(() => 'Joao1234@padaria.com.br');
    expect(v(new FormControl('joao1234@padaria.com.br'))).toEqual({ senhaIgualEmail: true });
    expect(v(new FormControl('JOAO1234'))).toEqual({ senhaIgualEmail: true });
    expect(v(new FormControl('outra-senha1'))).toBeNull();
  });

  it('senhaMaxBytesValidator conta bytes UTF-8, não caracteres', () => {
    const v = senhaMaxBytesValidator(72);
    expect(v(new FormControl('a1'.repeat(36)))).toBeNull();
    expect(v(new FormControl('a1'.repeat(36) + 'a'))).toEqual({ maxbytes: true });
    expect(v(new FormControl('é1'.repeat(30)))).toEqual({ maxbytes: true });
    expect(v(new FormControl(''))).toBeNull();
  });
});

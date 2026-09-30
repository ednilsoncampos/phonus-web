import { AbstractControl, ValidationErrors } from '@angular/forms';

export type TipoDocumento = 'CNPJ' | 'CPF';

export function apenasDigitos(valor: string | null | undefined): string {
  return (valor ?? '').replace(/\D/g, '');
}

function todosIguais(digitos: string): boolean {
  return /^(\d)\1+$/.test(digitos);
}

function digitoVerificador(digitos: string, pesos: number[]): number {
  const soma = pesos.reduce((acc, peso, i) => acc + Number(digitos[i]) * peso, 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function cpfValido(valor: string): boolean {
  const cpf = apenasDigitos(valor);
  if (cpf.length !== 11 || todosIguais(cpf)) return false;

  const d1 = digitoVerificador(cpf, [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = digitoVerificador(cpf, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d1 === Number(cpf[9]) && d2 === Number(cpf[10]);
}

export function cnpjValido(valor: string): boolean {
  const cnpj = apenasDigitos(valor);
  if (cnpj.length !== 14 || todosIguais(cnpj)) return false;

  const d1 = digitoVerificador(cnpj, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = digitoVerificador(cnpj, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d1 === Number(cnpj[12]) && d2 === Number(cnpj[13]);
}

/**
 * Validador de grupo: valida `documento` conforme o `tipoDocumento` do mesmo grupo.
 * O erro `documentoInvalido` é aplicado ao controle `documento`, sem afetar o grupo.
 */
export function documentoValido(tipoKey = 'tipoDocumento', documentoKey = 'documento') {
  return (group: AbstractControl): ValidationErrors | null => {
    const tipo = group.get(tipoKey)?.value as TipoDocumento | null;
    const controle = group.get(documentoKey);
    if (!controle) return null;

    const valor = controle.value as string | null;
    const valido = !valor || (tipo === 'CPF' ? cpfValido(valor) : cnpjValido(valor));

    const erros = { ...(controle.errors ?? {}) };
    if (valido) {
      delete erros['documentoInvalido'];
    } else {
      erros['documentoInvalido'] = true;
    }
    controle.setErrors(Object.keys(erros).length ? erros : null);
    return null;
  };
}

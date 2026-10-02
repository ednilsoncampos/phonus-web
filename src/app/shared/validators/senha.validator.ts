import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function senhaForteValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;
    if (!value) return null;
    const temLetra = /[a-zA-Z]/.test(value);
    const temNumero = /[0-9]/.test(value);
    return temLetra && temNumero ? null : { senhaFraca: true };
  };
}

export function senhaDiferenteDeEmailValidator(getEmail: () => string | null | undefined): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const senha = control.value as string;
    const email = getEmail();
    if (!senha || !email) return null;
    const senhaMin = senha.toLowerCase();
    const emailMin = email.toLowerCase();
    // O backend também recusa a senha igual à parte do e-mail antes do "@".
    const usuario = emailMin.split('@')[0];
    return senhaMin === emailMin || senhaMin === usuario ? { senhaIgualEmail: true } : null;
  };
}

/** O backend limita a senha em bytes (UTF-8), então caracteres acentuados contam como 2. */
export function senhaMaxBytesValidator(maxBytes: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;
    if (!value) return null;
    return new TextEncoder().encode(value).length > maxBytes ? { maxbytes: true } : null;
  };
}

export function senhasConferemValidator(senhaControlName: string, confirmacaoControlName: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const senha = group.get(senhaControlName)?.value;
    const confirmacao = group.get(confirmacaoControlName)?.value;
    if (!senha || !confirmacao) return null;
    return senha === confirmacao ? null : { senhasDiferentes: true };
  };
}

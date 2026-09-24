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
    return senha.toLowerCase() === email.toLowerCase() ? { senhaIgualEmail: true } : null;
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

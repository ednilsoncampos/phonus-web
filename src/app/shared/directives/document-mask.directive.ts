import { Directive, ElementRef, forwardRef, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Directive({
  selector: 'input[documentMask]',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DocumentMaskDirective),
      multi: true,
    },
  ],
  host: {
    '(input)': 'onInput()',
    '(focus)': 'onFocus()',
    '(blur)': 'onBlur()',
  },
})
export class DocumentMaskDirective implements ControlValueAccessor {
  private readonly el = inject(ElementRef<HTMLInputElement>);

  private onChange: (value: string) => void = () => {};
  protected onTouched: () => void = () => {};

  onInput(): void {
    const digits = this.el.nativeElement.value.replace(/\D/g, '').slice(0, 14);
    this.el.nativeElement.value = digits;
    this.onChange(digits);
  }

  onFocus(): void {
    const digits = this.el.nativeElement.value.replace(/\D/g, '');
    this.el.nativeElement.value = digits;
  }

  onBlur(): void {
    const digits = this.el.nativeElement.value.replace(/\D/g, '').slice(0, 14);
    this.el.nativeElement.value = this.format(digits);
    this.onChange(digits);
    this.onTouched();
  }

  writeValue(value: string): void {
    const digits = (value ?? '').replace(/\D/g, '').slice(0, 14);
    this.el.nativeElement.value = this.format(digits);
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.el.nativeElement.disabled = isDisabled;
  }

  private format(digits: string): string {
    if (!digits) return '';
    if (digits.length <= 11) {
      // CPF: 000.000.000-00
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
      if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
    }
    // CNPJ: 00.000.000/0001-00
    if (digits.length <= 12) {
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    }
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  }
}

import { Directive, ElementRef, forwardRef, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Directive({
  selector: 'input[phoneMask]',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PhoneMaskDirective),
      multi: true,
    },
  ],
  host: {
    '(input)': 'onInput()',
    '(blur)': 'onTouched()',
  },
})
export class PhoneMaskDirective implements ControlValueAccessor {
  private readonly el = inject(ElementRef<HTMLInputElement>);

  private onChange: (value: string) => void = () => {};
  protected onTouched: () => void = () => {};

  onInput(): void {
    const digits = this.el.nativeElement.value.replace(/\D/g, '').slice(0, 11);
    const formatted = this.format(digits);
    this.el.nativeElement.value = formatted;
    this.onChange(formatted);
  }

  writeValue(value: string): void {
    const digits = (value ?? '').replace(/\D/g, '').slice(0, 11);
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
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
}

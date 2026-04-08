import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  inject,
  input,
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-date-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatDatepickerModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateFieldComponent),
      multi: true,
    },
  ],
  styles: [`:host { display: block; width: 100%; }`],
  template: `
    <mat-form-field appearance="outline" style="width:100%">
      <mat-label>{{ label() }}</mat-label>
      <input
        matInput
        [matDatepicker]="picker"
        [(ngModel)]="internalDate"
        (ngModelChange)="handleDateChange($event)"
        (blur)="onTouched()"
        [attr.aria-label]="label()"
      />
      <mat-datepicker-toggle matIconSuffix [for]="picker" aria-label="Abrir calendário" />
      <mat-datepicker #picker />
      @if (required() && touched && !internalDate) {
        <mat-error>{{ label() }} é obrigatória</mat-error>
      }
    </mat-form-field>
  `,
})
export class DateFieldComponent implements ControlValueAccessor {
  private readonly cdr = inject(ChangeDetectorRef);

  readonly label = input.required<string>();
  readonly required = input(false);

  internalDate: Date | null = null;
  touched = false;

  onTouched: () => void = () => {};
  private onChange: (val: string) => void = () => {};

  writeValue(value: string | null): void {
    if (value) {
      const [y, m, d] = value.split('-').map(Number);
      this.internalDate = new Date(y, m - 1, d);
    } else {
      this.internalDate = null;
    }
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (val: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = () => {
      this.touched = true;
      fn();
      this.cdr.markForCheck();
    };
  }

  setDisabledState(_: boolean): void {}

  handleDateChange(date: Date | null): void {
    this.internalDate = date;
    if (date) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      this.onChange(`${y}-${m}-${d}`);
    } else {
      this.onChange('');
    }
  }
}

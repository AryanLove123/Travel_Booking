import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";
import { isValidIsoDate } from "../../core/utils/date.util";

export function notInPast(today: () => string): ValidatorFn {
    return (control) =>{
        const v = String(control.value ?? '');
        return v && isValidIsoDate(v) && v < today() ? {past: true} : null;
    }
}

/** Group Validators **/

export function checkOutAfterCheckIn(inKey = 'checkIn', outKey = 'checkOut'): ValidatorFn {
    return (group) => {
        const inDate = String(group.get(inKey)?.value ?? '');
        const outDate = String(group.get(outKey)?.value ?? '');
        return inDate && outDate && isValidIsoDate(inDate) && isValidIsoDate(outDate) && outDate <= inDate ? {checkOutBeforeCheckIn: true} : null;
    };
}

export const urlValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = String(control.value ?? '').trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? null : { url: true };
  } catch {
    return { url: true };
  }
};
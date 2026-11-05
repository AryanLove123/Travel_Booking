import { DatePipe } from "@angular/common";
import { Pipe, PipeTransform, inject } from "@angular/core";
import { nightsBetween } from "../../core/utils/date.util";
import { IsoDate } from "../../models/domain.model";

@Pipe({ name: 'stayRange' })
export class StayRangePipe implements PipeTransform {
  private readonly datePipe = inject(DatePipe);

  transform(checkIn: IsoDate, checkOut: IsoDate, withNights = true): string {
    const nights = nightsBetween(checkIn, checkOut);
    if (nights === 0) return '';
    const sameMonth = checkIn.slice(0, 7) === checkOut.slice(0, 7);
    const start = this.datePipe.transform(checkIn, 'MMM d') ?? checkIn;
    const end = this.datePipe.transform(checkOut, sameMonth ? "d, y" : 'MMM d, y') ?? checkOut;
    const label = `${start} – ${end}`;
    return withNights ? `${label} · ${nights} night${nights === 1 ? '' : 's'}` : label;
  }
}
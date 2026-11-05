import { PriceBreakdown } from "../../models/domain.model";

export const PRICING_RULES = {
  serviceFeeRate: 0.05,
  firstBookingDiscountRate: 0.1,
} as const;

export interface PriceInput {
  nightlyRate: number;
  nights: number;
  rooms: number;
  isFirstBooking?: boolean;
}

export function roundMoney(value: number): number {
  return Math.round(value);
}

export function calculatePrice(input: PriceInput): PriceBreakdown{
 const nights = Math.max(0, Math.floor(input.nights));
 const rooms = Math.max(0, Math.floor(input.rooms));
 const nightlyRate = Math.max(0,input.nightlyRate);

 const subtotal = roundMoney(nightlyRate * nights * rooms);
 const discount = input.isFirstBooking ? roundMoney(subtotal* PRICING_RULES.firstBookingDiscountRate) : 0;
 const serviceFee = roundMoney((subtotal-discount)*PRICING_RULES.serviceFeeRate);
 const total = roundMoney(subtotal -discount +serviceFee);

 return {currency: 'USD', nightlyRate, nights, rooms, subtotal, discount, serviceFee, total};
}
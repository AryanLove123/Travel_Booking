import { PaymentStatus } from "../../models/domain.model";

export type MockOutcome = 'success' | 'decline' | 'cancel' | 'processing';

export const MOCK_OUTCOMES: { value: MockOutcome; label: string; hint: string }[] = [
  { value: 'success', label: 'Payment succeeds', hint: 'The booking will be confirmed.' },
  { value: 'decline', label: 'Card declined', hint: 'Payment fails; the booking stays unconfirmed and can be retried.' },
  { value: 'cancel', label: 'Customer cancels', hint: 'You leave the payment page; nothing is charged.' },
  { value: 'processing', label: 'Processing (resolves on next status check)', hint: 'Shows the pending state; the next check succeeds.' },
];

export interface PaymentRequest {
  readonly bookingId: string;
  readonly amount: number;
  readonly currency: 'USD';
  readonly description: string;
}

export interface PaymentSession{
    paymentId: string;
    bookingId: string;
    checkoutPath: string;
}

export interface PaymentResult{
    paymentId: string;
    bookingId: string;
    amount: number;
    currency: 'USD';
    status: PaymentStatus;
    failureReason?: string;
    updatedAt: string;
}


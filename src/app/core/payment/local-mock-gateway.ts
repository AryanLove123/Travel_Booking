import { inject, Injectable } from '@angular/core';
import { PaymentStatus } from '../../models/domain.model';
import { PaymentGateway } from './payment-gateway';
import { STORAGE_KEYS, StorageService } from '../storage/storage.service';
import { PaymentRequest, PaymentSession, PaymentResult, MockOutcome } from './payment.models';
import { newId } from '../utils/id.util';
import { isRecordList } from '../storage/guard';

interface StoredSession {
  paymentId: string;
  bookingId: string;
  amount: number;
  currency: 'USD';
  status: PaymentStatus;
  failureReason?: string;
  checksUntilResolved: number; // For processing session, can be assumed as a countdown counter
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class LocalMockGateway extends PaymentGateway {
  storage = inject(StorageService);

  async initiatePayment(request: PaymentRequest): Promise<PaymentSession> {
    if (!(request.amount > 0)) throw new Error('Payment amount must be greater than zero');
    const sessions = this.load();
    const session: StoredSession = {
      paymentId: newId('mockpay'),
      bookingId: request.bookingId,
      amount: request.amount,
      currency: request.currency,
      status: 'created',
      checksUntilResolved: 0,
      updatedAt: new Date().toISOString(),
    };
    this.save([...sessions, session]);
    return { paymentId: session.paymentId, bookingId: session.bookingId, checkoutPath: `/pay/${request.bookingId}` }
  }

  
  async getPaymentResult(paymentId: string): Promise<PaymentResult> {
    const session = this.require(paymentId);
    if(session.status === 'processing'){
      if(session.checksUntilResolved <=0){
        return this.toResult(this.update(paymentId, {status: 'succeeded'}));
      }
      this.update(paymentId, {checksUntilResolved: session.checksUntilResolved -1});
      return this.toResult(this.require(paymentId));
    }
    return this.toResult(session);
  }
  async cancelPayment(paymentId: string): Promise<PaymentResult> {
    const session = this.require(paymentId);
    if(session.status === 'created' || session.status === 'processing'){
      return this.toResult(this.update(paymentId, {status: 'cancelled'}));
    }
    return this.toResult(session);
  }

  async completeSession(paymentId: string, outcome: MockOutcome) : Promise<PaymentResult>{
    const session = this.require(paymentId);
    if(session.status !== 'created') return this.toResult(session);

    switch (outcome) {
      case 'success':
        return this.toResult(this.update(paymentId, { status: 'succeeded' }));
      case 'decline':
        return this.toResult(this.update(paymentId, { status: 'failed', failureReason: 'The card was declined (simulated).' }));
      case 'cancel':
        return this.toResult(this.update(paymentId, { status: 'cancelled' }));
      case 'processing':
        return this.toResult(this.update(paymentId, { status: 'processing', checksUntilResolved: 1 }));
    }
  }

  toResult(s: StoredSession): PaymentResult{
    return{
      paymentId: s.paymentId,
      bookingId: s.bookingId,
      amount: s.amount,
      currency: s.currency,
      status: s.status,
      failureReason: s.failureReason,
      updatedAt: s.updatedAt,
    };
  }

  load(): StoredSession[] {
    return this.storage.read<StoredSession[]>(STORAGE_KEYS.paymentSessions, isRecordList) ?? [];
  }

  require(paymentId: string): StoredSession{
    const session = this.load().find((s) => s.paymentId === paymentId);
    if(!session) throw new Error(`Unkown payment ${paymentId}`);
    return session;
  }

  update(paymentId: string, patch: Partial<StoredSession>): StoredSession{
    let updated: StoredSession | undefined;
    const next = this.load().map((s) => {
        if(s.paymentId !== paymentId) return s;
        updated = {...s, ...patch, updatedAt: new Date().toISOString() };
        return updated;
    });
    if(!updated) throw new Error(`Unknown payment ${paymentId}`);
    this.save(next);
    return updated;
  }

  save(sessions: StoredSession[]): void{
    this.storage.write(STORAGE_KEYS.paymentSessions, sessions)
  }
}

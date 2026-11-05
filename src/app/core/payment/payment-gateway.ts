import { PaymentRequest, PaymentResult, PaymentSession } from "./payment.models";

export abstract class PaymentGateway {
    abstract initiatePayment(request: PaymentRequest): Promise<PaymentSession>;
    abstract getPaymentResult(paymentId: string): Promise<PaymentResult>;
    abstract cancelPayment(paymentId: string): Promise<PaymentResult>;
}
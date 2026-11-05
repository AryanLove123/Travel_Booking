import { Injectable, signal } from '@angular/core';

export interface Toast {
  readonly id: number;
  readonly kind: 'success' | 'error' | 'info';
  readonly message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  nextId = 0;
  toasts = signal<Toast[]>([]);

  success(message: string): void {
    this.push('success', message);
  }
  error(message: string): void {
    this.push('error', message);
  }
  info(message: string): void {
    this.push('info', message);
  }
  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private push(kind: Toast['kind'], message: string): void {
    const id = ++this.nextId;
    this.toasts.update((list) => [...list, { id, kind, message }]);
    setTimeout(() => this.dismiss(id), 5000);
  }
}

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toasts">
      @for (t of toasts.toasts(); track t.id) {
        <div class="toast" [class]="'toast toast--' + t.kind">
          <span>{{ t.message }}</span>
          <button type="button" class="toast__close" (click)="toasts.dismiss(t.id)">×</button>
        </div>
      }
    </div>
  `,
  styles: `
    .toasts {
      position: fixed;
      right: var(--sp-4);
      bottom: var(--sp-4);
      z-index: 200;
      display: grid;
      gap: var(--sp-2);
      max-width: min(380px, calc(100vw - 2rem));
    }
    .toast {
      display: flex;
      justify-content: space-between;
      gap: var(--sp-3);
      padding: var(--sp-3) var(--sp-4);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-md);
      background: var(--c-ink-900);
      color: #fff;
    }
    .toast--success {
      background: var(--c-success-600);
    }
    .toast--error {
      background: var(--c-danger-600);
    }
    .toast__close {
      background: none;
      border: 0;
      color: inherit;
      font-size: 1.25rem;
      cursor: pointer;
      line-height: 1;
    }
  `,
})
export class ToastHost {
  protected readonly toasts = inject(ToastService);
}

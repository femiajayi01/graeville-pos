import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'info' | 'warning' | 'danger';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

/** App-wide notifications rendered by <app-toast-container> with Clarity alerts. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  readonly toasts = signal<Toast[]>([]);

  success(message: string) {
    this.show('success', message);
  }

  info(message: string) {
    this.show('info', message);
  }

  warning(message: string) {
    this.show('warning', message, 6000);
  }

  error(message: string) {
    this.show('danger', message, 8000);
  }

  dismiss(id: number) {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private show(type: ToastType, message: string, duration = 4000) {
    const toast: Toast = { id: this.nextId++, type, message };
    this.toasts.update((list) => [...list.slice(-4), toast]);
    setTimeout(() => this.dismiss(toast.id), duration);
  }
}

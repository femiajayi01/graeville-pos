import { Injectable, signal } from '@angular/core';

const KEY = 'pos.terminalId';

/**
 * Identifies this till/computer. Parked sales are kept per terminal (Laravel used the server hostname).
 * The name is generated once per browser and can be renamed on the Profile page.
 */
@Injectable({ providedIn: 'root' })
export class TerminalService {
  private readonly _id = signal<string>(localStorage.getItem(KEY) ?? this.generate());
  readonly id = this._id.asReadonly();

  rename(name: string): void {
    const value = name.trim().slice(0, 100);
    if (!value) return;
    localStorage.setItem(KEY, value);
    this._id.set(value);
  }

  private generate(): string {
    const id = `till-${Math.random().toString(36).slice(2, 6)}`;
    localStorage.setItem(KEY, id);
    return id;
  }
}

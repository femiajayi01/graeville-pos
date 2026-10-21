import { inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { StoreInfoService } from './store-info.service';

/** Browser tab title: "<page> · <store name> · Graeville POS". */
@Injectable({ providedIn: 'root' })
export class AppTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly store = inject(StoreInfoService);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const info = this.store.info();
    const parts = [this.buildTitle(snapshot), info?.name, info?.appName ?? 'Graeville POS'];
    this.title.setTitle(parts.filter(Boolean).join(' · '));
  }
}

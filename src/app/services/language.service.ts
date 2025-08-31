import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {

  private lang: string;

  constructor() {
    this.lang = this.detectLang();
  }

  private detectLang(): string {
    const browserLang = navigator.language || navigator.languages[0] || 'en-US';

    if (browserLang.startsWith('es')) {
      return 'es';
    } else if (browserLang.startsWith('en')) {
      return 'en-US';
    } else {
      return 'en-US';
    }
  }

  getLang(): string {
    return this.lang;
  }
}

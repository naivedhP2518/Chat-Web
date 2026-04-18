import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private currentTheme: 'light' | 'dark' = 'dark'; // Add standard dark preference by default as it was before

  constructor() {
    this.initTheme();
  }

  private initTheme() {
    const savedTheme = localStorage.getItem('theme-preference');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      this.currentTheme = savedTheme;
    } else {
      // Check system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        this.currentTheme = 'light';
      }
    }
    this.applyTheme(this.currentTheme);
  }

  public getTheme(): 'light' | 'dark' {
    return this.currentTheme;
  }

  public toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(this.currentTheme);
  }

  private applyTheme(theme: 'light' | 'dark') {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme-preference', theme);
  }
}

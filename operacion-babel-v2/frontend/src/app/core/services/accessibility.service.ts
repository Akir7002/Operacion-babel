import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class AccessibilityService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  readonly isDaltonico = signal<boolean>(localStorage.getItem('babelDaltonico') === 'true');
  readonly isReducedAnimations = signal<boolean>(localStorage.getItem('babelReducedAnim') === 'true');

  constructor() {
    this.applyClasses();
  }

  toggleDaltonico(): void {
    const val = !this.isDaltonico();
    this.isDaltonico.set(val);
    localStorage.setItem('babelDaltonico', String(val));
    this.applyClasses();
    this.syncBackend();
  }

  toggleReducedAnimations(): void {
    const val = !this.isReducedAnimations();
    this.isReducedAnimations.set(val);
    localStorage.setItem('babelReducedAnim', String(val));
    this.applyClasses();
    this.syncBackend();
  }

  private applyClasses(): void {
    if (this.isDaltonico()) {
      document.body.classList.add('daltonico-mode');
    } else {
      document.body.classList.remove('daltonico-mode');
    }

    if (this.isReducedAnimations()) {
      document.body.classList.add('reduced-animations');
    } else {
      document.body.classList.remove('reduced-animations');
    }
  }

  private syncBackend(): void {
    const user = this.auth.currentUser();
    if (user?.IdUsuario) {
      this.http.put(`http://localhost:3000/api/v1/configuracion/${user.IdUsuario}`, {
        ModoDaltonico: this.isDaltonico(),
        AnimacionesReducidas: this.isReducedAnimations(),
      }).subscribe({ error: () => {} });
    }
  }
}

import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { User } from '../models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly API_BASE = 'http://localhost:3000/api/v1';

  // Signals para reactividad pura
  readonly currentUser = signal<User | null>(this.loadUserFromStorage());
  readonly token = signal<string | null>(localStorage.getItem('babelToken'));

  readonly isAuthenticated = computed(() => !!this.currentUser());
  readonly isAdmin = computed(() => Number(this.currentUser()?.IdRango || 0) >= 4);
  readonly currentLives = signal<number>(this.currentUser()?.VidasActuales ?? 5);

  private loadUserFromStorage(): User | null {
    try {
      const data = localStorage.getItem('babelUser');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  login(credentials: { Correo: string; Contrasena: string }): Observable<any> {
    return this.http.post<any>(`${this.API_BASE}/login`, credentials).pipe(
      tap((res) => {
        if (res.token && res.usuario) {
          localStorage.setItem('babelToken', res.token);
          localStorage.setItem('babelUser', JSON.stringify(res.usuario));
          this.token.set(res.token);
          this.currentUser.set(res.usuario);
          this.currentLives.set(res.usuario.VidasActuales ?? 5);
        }
      })
    );
  }

  register(data: any): Observable<any> {
    return this.http.post<any>(`${this.API_BASE}/register`, data);
  }

  logout(): void {
    localStorage.removeItem('babelToken');
    localStorage.removeItem('babelUser');
    this.token.set(null);
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  updateLives(lives: number): void {
    this.currentLives.set(lives);
    const user = this.currentUser();
    if (user) {
      user.VidasActuales = lives;
      this.currentUser.set({ ...user });
      localStorage.setItem('babelUser', JSON.stringify(user));
    }
  }
}

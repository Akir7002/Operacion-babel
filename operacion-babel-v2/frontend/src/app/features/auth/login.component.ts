import { Component, signal, inject, ViewEncapsulation } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  styleUrl: '../../../styles/Login.css',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="login-container">
      <div class="login-header">
        <i class="bi bi-shield-lock-fill login-icon"></i>
        <h1>ACCESO RESTRINGIDO</h1>
        <p>SISTEMA DE INTELIGENCIA BABEL</p>
      </div>

      <form id="loginForm" class="login-form" (ngSubmit)="onSubmit()">
        <div id="loginError" class="alert alert-danger" [class.d-none]="!errorMessage()" role="alert">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          <span id="errorText">{{ errorMessage() }}</span>
        </div>

        <div class="mb-4">
          <label for="correo" class="form-label">
            <i class="bi bi-envelope-fill text-secondary me-2"></i> Frecuencia de Contacto o Nombre Clave
          </label>
          <input
            type="text"
            class="form-control babel-input"
            id="correo"
            name="correo"
            [(ngModel)]="correo"
            placeholder="Agente@babel.com o RECLUTA-100"
            required
          />
        </div>

        <div class="mb-4">
          <label for="contrasena" class="form-label">
            <i class="bi bi-key-fill text-secondary me-2"></i> Contraseña de Acceso
          </label>
          <input
            type="password"
            class="form-control babel-input"
            id="contrasena"
            name="contrasena"
            [(ngModel)]="contrasena"
            placeholder="Ingresa tu contraseña"
            required
          />
        </div>

        <button type="submit" class="btn btn-login w-100 mb-3" id="btnSubmit" [disabled]="loading()">
          {{ loading() ? 'VERIFICANDO...' : 'INICIAR CONEXIÓN' }}
          <i class="bi bi-box-arrow-in-right ms-2"></i>
        </button>

        <div class="text-center mt-3">
          <p class="text-muted small">¿No tienes credenciales?</p>
          <a routerLink="/auth/enlistment" class="enlist-link">Proceder a Enlistamiento</a>
        </div>
      </form>
    </div>
  `,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  correo = '';
  contrasena = '';
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  onSubmit(): void {
    if (!this.correo || !this.contrasena) {
      this.errorMessage.set('Credenciales incompletas.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.auth.login({ Correo: this.correo, Contrasena: this.contrasena }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/armory']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.error || 'Credenciales inválidas.');
      },
    });
  }
}

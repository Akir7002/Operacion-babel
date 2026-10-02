import { Component, signal, inject, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-enlistment',
  standalone: true,
  imports: [FormsModule],
  styleUrl: '../../../styles/Enlistamiento.css',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="page-shell">
      <main class="page-wrap page-hero" data-hero>
        <div class="paper-container">
          <h1 id="formTitle">Formulario de Procesamiento de Reclutas</h1>

          @if (!isApproved()) {
            <form id="enlistmentForm" (ngSubmit)="onSubmit()">
              <div class="field field-with-status" [class.invalid]="nameError()" [class.valid]="nombre.trim().length > 0" id="recruitNameField">
                <label>Nombre Completo:</label>
                <div class="input-wrap">
                  <input
                    type="text"
                    id="recruitName"
                    name="nombre"
                    [(ngModel)]="nombre"
                    spellcheck="false"
                    autocomplete="off"
                    placeholder="Nombre completo"
                    required
                  />
                  <span class="field-status" aria-hidden="true" [style.opacity]="nameError() ? '1' : '0'">
                    <i class="bi bi-exclamation-circle-fill"></i>
                  </span>
                </div>
              </div>

              <div class="field field-with-status" [class.invalid]="contactError()" [class.valid]="contacto.trim().length > 0 && !contactError()" id="contactField">
                <label>Frecuencia de contacto:</label>
                <div class="input-wrap">
                  <input
                    type="email"
                    id="contactFrequency"
                    name="contacto"
                    [(ngModel)]="contacto"
                    spellcheck="false"
                    autocomplete="email"
                    placeholder="correo@ejemplo.com"
                    required
                  />
                  <span class="field-status" id="contactStatus" aria-hidden="true" [style.opacity]="contactError() ? '1' : '0'">
                    <i class="bi bi-exclamation-circle-fill"></i>
                  </span>
                </div>
              </div>

              <div class="field field-with-status" [class.invalid]="passwordError()" [class.valid]="contrasena.length >= 4" id="passwordField">
                <label>Contraseña de Acceso:</label>
                <div class="input-wrap">
                  <input
                    type="password"
                    id="recruitPassword"
                    name="contrasena"
                    [(ngModel)]="contrasena"
                    placeholder="Crea tu contraseña segura"
                    required
                  />
                  <span class="field-status" aria-hidden="true" [style.opacity]="passwordError() ? '1' : '0'">
                    <i class="bi bi-exclamation-circle-fill"></i>
                  </span>
                </div>
              </div>

              <div class="field field-with-status date-field" id="enlistmentDateField">
                <label>Fecha de alistamiento:</label>
                <div class="input-wrap">
                  <input
                    type="text"
                    id="enlistmentDate"
                    name="fecha"
                    [(ngModel)]="fecha"
                    spellcheck="false"
                    autocomplete="off"
                    inputmode="numeric"
                    maxlength="10"
                    placeholder="dd/mm/aaaa"
                  />
                  <span class="field-status" aria-hidden="true" style="opacity: 0">
                    <i class="bi bi-check-circle-fill"></i>
                  </span>
                </div>
              </div>

              <div class="field field-with-status" [class.invalid]="frontError()" [class.valid]="frente.length > 0" id="frontAssignedField">
                <label>Frente asignado:</label>
                <div class="input-wrap">
                  <div class="select-wrap">
                    <select id="frontAssigned" name="frente" [(ngModel)]="frente">
                      <option value="">Seleccione un frente</option>
                      <option value="Frente Este (Русский)">Frente Este (Русский)</option>
                      <option value="Frente Oriental (中文)">Frente Oriental (中文)</option>
                    </select>
                  </div>
                  <span class="field-status" aria-hidden="true" [style.opacity]="frontError() ? '1' : '0'">
                    <i class="bi bi-exclamation-circle-fill"></i>
                  </span>
                </div>
              </div>

              @if (apiError()) {
                <div style="color: var(--stamp-color); font-weight: bold; margin-top: 15px; text-align: center;">
                  {{ apiError() }}
                </div>
              }

              <button type="submit" class="btn-enviar" [disabled]="loading()">
                {{ loading() ? 'Transmitiendo...' : 'Confirmar Transmisión' }}
              </button>
            </form>
          }

          <!-- Vista de Resumen cuando el expediente es aprobado -->
          <div id="summaryView" class="summary-view" [class.hidden]="!isApproved()">
            <div class="summary-field">
              <label>Nombre Completo:</label>
              <span id="summaryName">{{ nombre }}</span>
            </div>
            <div class="summary-field">
              <label>Frecuencia de contacto:</label>
              <span id="summaryContact">{{ contacto }}</span>
            </div>
            <div class="summary-field">
              <label>Fecha de alistamiento:</label>
              <span id="summaryDate">{{ fecha }}</span>
            </div>
            <div class="summary-field">
              <label>Frente asignado:</label>
              <span id="summaryFront">{{ frente }}</span>
            </div>
            @if (createdCode()) {
              <div class="summary-field">
                <label>Código Asignado:</label>
                <span style="color: var(--stamp-color);">{{ createdCode() }}</span>
              </div>
            }
            <button class="btn-enviar" id="newEnlistmentBtn" (click)="resetForm()">
              Nuevo Alistamiento
            </button>
          </div>

          <!-- Sello Militar de Aprobación -->
          <div id="stamp" [class.stamp-active]="stampActive() || isApproved()">
            {{ stampText() }}
          </div>
        </div>

        <!-- Pantalla de Blackout por pérdida de conexión -->
        <div id="blackoutScreen" class="blackout" [style.display]="showBlackout() ? 'flex' : 'none'">
          <h2>CONEXIÓN PERDIDA...</h2>
          <p>REINICIANDO TERMINAL, SOLDADO.</p>
        </div>
      </main>

      <footer data-mission>
        <div class="footer-line">DATOS DE INTELIGENCIA:</div>
        <div class="footer-line">Desarrollado por <span class="highlight">Akir (Maria Fernanda P.)</span></div>
        <div class="footer-line">Desarrollado por <span class="highlight">Mauo (David Mauricio P.)</span></div>
        <div class="footer-line">División de Ingeniería de Babel</div>
        <div class="footer-line">Protocolo: Encriptación de datos nivel militar</div>
        <div class="footer-line mt-3">
          &copy; 2026: Todos los derechos reservados bajo la jurisdicción de la Alianza Babel
        </div>
      </footer>
    </div>
  `,
})
export class EnlistmentComponent {
  private auth = inject(AuthService);

  nombre = '';
  contacto = '';
  contrasena = '';
  fecha = this.getCurrentDateFormatted();
  frente = '';

  loading = signal(false);
  isApproved = signal(false);
  stampActive = signal(false);
  stampText = signal('APROBADO');
  showBlackout = signal(false);
  apiError = signal<string | null>(null);
  createdCode = signal<string | null>(null);

  nameError = signal(false);
  contactError = signal(false);
  passwordError = signal(false);
  frontError = signal(false);

  getCurrentDateFormatted(): string {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    return `${d}/${m}/${y}`;
  }

  onSubmit(): void {
    this.nameError.set(!this.nombre.trim());
    this.contactError.set(!this.contacto.trim() || !this.contacto.includes('@'));
    this.passwordError.set(this.contrasena.trim().length < 4);
    this.frontError.set(!this.frente.trim());

    if (this.nameError() || this.contactError() || this.passwordError() || this.frontError()) {
      return;
    }

    this.loading.set(true);
    this.apiError.set(null);
    this.stampText.set('TRANSMITIENDO...');
    this.stampActive.set(true);

    this.auth.register({
      nombre: this.nombre,
      contacto: this.contacto,
      contrasena: this.contrasena,
      frenteAsignado: this.frente,
      fechaAlistamiento: this.fecha,
    }).subscribe({
      next: (res) => {
        this.stampText.set('APROBADO');
        setTimeout(() => {
          this.loading.set(false);
          this.createdCode.set(res.data?.codigoAlistamiento || null);
          this.isApproved.set(true);
        }, 1800);
      },
      error: (err) => {
        this.loading.set(false);
        this.stampActive.set(false);
        this.apiError.set(err.error?.error || 'Fallo de transmisión al Cuartel General.');
        this.showBlackout.set(true);
        setTimeout(() => {
          this.showBlackout.set(false);
        }, 3000);
      },
    });
  }

  resetForm(): void {
    this.nombre = '';
    this.contacto = '';
    this.contrasena = '';
    this.fecha = this.getCurrentDateFormatted();
    this.frente = '';
    this.isApproved.set(false);
    this.stampActive.set(false);
    this.stampText.set('APROBADO');
    this.createdCode.set(null);
    this.apiError.set(null);
  }
}

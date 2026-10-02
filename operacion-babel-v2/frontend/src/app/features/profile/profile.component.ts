import { Component, signal, computed, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { AccessibilityService } from '../../core/services/accessibility.service';
import { UserStats, Achievement } from '../../core/models';

@Component({
  selector: 'app-profile',
  standalone: true,
  styleUrl: '../../../styles/Perfil.css',
  encapsulation: ViewEncapsulation.None,
  template: `
    <main class="profile-main">
      <div class="container-fluid profile-container">
        <!-- HEADER DEL PERFIL (Estilo Hoja de Servicio Militar) -->
        <section class="profile-header">
          <div class="row align-items-center">
            <div class="col-md-3 col-sm-4 text-center">
              <div class="avatar-wrapper">
                <div class="avatar-ring"></div>
                <div class="avatar-inner">
                  <i class="bi bi-person-badge"></i>
                </div>
                <div class="rank-badge" id="rankBadge" title="Rango Militar">
                  <i class="bi bi-star-fill"></i>
                </div>
              </div>
            </div>
            <div class="col-md-9 col-sm-8">
              <div class="profile-top">
                <h2 class="codename" id="codename">{{ auth.currentUser()?.NombreClave || 'RECLUTA' }}</h2>
                <button class="btn-edit" id="btnConfig" (click)="showModal.set(true)">
                  <i class="bi bi-gear-wide-connected"></i> Configuración Táctica
                </button>
              </div>

              <!-- STATS DE COMBATE Y PROGRESO -->
              <div class="profile-stats">
                <div class="stat-item">
                  <span class="stat-number" id="statPuntos">{{ stats()?.PuntosTotales || 0 }}</span>
                  <span class="stat-label">puntos (xp)</span>
                </div>
                <div class="stat-item">
                  <span class="stat-number" id="statRachaDias" style="color: #f39c12;">
                    {{ stats()?.RachaDias || 0 }} 🔥
                  </span>
                  <span class="stat-label">días racha</span>
                </div>
                <div class="stat-item">
                  <span class="stat-number" id="statFlashcards">{{ stats()?.TotalTarjetasEstudiadas || stats()?.TotalFlashcardsVistas || 0 }}</span>
                  <span class="stat-label">flashcards</span>
                </div>
                <div class="stat-item">
                  <span class="stat-number" id="statPrecision" style="color: #2ecc71;">
                    {{ stats()?.PrecisionPromedio || 0 }}%
                  </span>
                  <span class="stat-label">precisión</span>
                </div>
                <div class="stat-item">
                  <span class="stat-number" id="statPalabras">{{ stats()?.PalabrasCompletadasAhorcado || stats()?.PalabrasDominadas || 0 }}</span>
                  <span class="stat-label">infiltraciones</span>
                </div>
              </div>

              <!-- BIO DEL SOLDADO -->
              <div class="profile-bio">
                <h3 class="soldier-rank" id="soldierRank">RANGO: {{ auth.currentUser()?.RangoMilitar || 'Recluta de 1ª' }}</h3>
                <p class="soldier-desc" id="soldierDesc">
                  Operativo activo en la Base Babel. Registro militar encriptado y sincronizado con el Cuartel General.
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- SECCIÓN DE ACCIONES / SUMINISTROS -->
        <div class="row mt-4">
          <div class="col-12 text-center">
            <button class="btn-edit" (click)="regenerateLives()" style="padding: 10px 24px; font-size: 1rem; border-color: var(--military-red); color: #ff8080;">
              <i class="bi bi-heart-pulse"></i> SOLICITAR SUMINISTROS (REGENERAR 5 VIDAS)
            </button>
          </div>
        </div>

        <!-- SECCIÓN DE CONDECORACIONES Y LOGROS TÁCTICOS -->
        <section class="achievements-section mt-5" style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 30px;">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h3 style="color: #f1c40f; font-size: 1.2rem; letter-spacing: 2px; margin: 0;">
              <i class="bi bi-award-fill me-2"></i> CONDECORACIONES E INSIGNIAS MILITARES
            </h3>
            <span class="badge" style="background: rgba(255,255,255,0.1); color: #aaa; padding: 6px 12px; font-size: 0.85rem;">
              {{ unlockedCount() }} / {{ achievements().length }} DESBLOQUEADAS
            </span>
          </div>

          <div class="row g-3">
            @for (logro of achievements(); track logro.IdLogro) {
              <div class="col-md-6 col-lg-3">
                <div
                  class="card h-100 p-3"
                  [style.background]="logro.Desbloqueado ? 'rgba(46, 204, 113, 0.08)' : 'rgba(255, 255, 255, 0.02)'"
                  [style.border]="logro.Desbloqueado ? '1px solid #2ecc71' : '1px solid rgba(255, 255, 255, 0.08)'"
                  [style.opacity]="logro.Desbloqueado ? '1' : '0.6'"
                  style="border-radius: 6px;"
                >
                  <div class="d-flex align-items-center gap-3">
                    <span style="font-size: 2.2rem; filter: drop-shadow(0 0 5px rgba(255,255,255,0.2));">
                      {{ logro.IconoMilitar || '🎖️' }}
                    </span>
                    <div style="flex: 1;">
                      <h5 class="mb-1" [style.color]="logro.Desbloqueado ? '#2ecc71' : '#888'" style="font-size: 0.95rem;">
                        {{ logro.NombreLogro }}
                      </h5>
                      <p class="mb-1 text-muted" style="font-size: 0.8rem; line-height: 1.3;">
                        {{ logro.Descripcion }}
                      </p>
                      <div class="d-flex justify-content-between align-items-center mt-2" style="font-size: 0.75rem;">
                        <span class="badge" [style.background]="logro.Desbloqueado ? '#27ae60' : '#444'">
                          {{ logro.Desbloqueado ? 'CONCEDIDO' : 'CLASIFICADO' }}
                        </span>
                        <span style="color: #f1c40f; font-weight: bold;">+{{ logro.PuntosRecompensa }} XP</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            } @empty {
              <div class="col-12 text-center text-muted p-4">
                Sincronizando registro militar de condecoraciones...
              </div>
            }
          </div>
        </section>

        <!-- Footer de Inteligencia -->
        <footer data-mission class="mt-5">
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
    </main>

    <!-- Modal de Configuración Táctica -->
    @if (showModal()) {
      <div class="config-modal active" style="position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 1000;">
        <div class="modal-dialog" style="background: #111; border: 1px solid var(--tactical-border); padding: 30px; max-width: 500px; width: 90%;">
          <div class="modal-header d-flex justify-content-between align-items-center mb-3">
            <h5 class="modal-title text-warning"><i class="bi bi-sliders"></i> CONFIGURACIÓN TÁCTICA</h5>
            <button type="button" class="btn-close btn-close-white" (click)="showModal.set(false)"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3 d-flex justify-content-between align-items-center">
              <span>MODO DALTÓNICO (ALTO CONTRASTE)</span>
              <button
                class="btn btn-sm"
                [class.btn-warning]="accessibility.isDaltonico()"
                [class.btn-outline-secondary]="!accessibility.isDaltonico()"
                (click)="accessibility.toggleDaltonico()"
              >
                {{ accessibility.isDaltonico() ? 'ACTIVADO' : 'DESACTIVADO' }}
              </button>
            </div>
            <div class="mb-3 d-flex justify-content-between align-items-center">
              <span>REDUCCIÓN DE ANIMACIONES</span>
              <button
                class="btn btn-sm"
                [class.btn-warning]="accessibility.isReducedAnimations()"
                [class.btn-outline-secondary]="!accessibility.isReducedAnimations()"
                (click)="accessibility.toggleReducedAnimations()"
              >
                {{ accessibility.isReducedAnimations() ? 'ACTIVADO' : 'DESACTIVADO' }}
              </button>
            </div>
          </div>
          <div class="modal-footer text-end mt-4">
            <button type="button" class="btn btn-outline-light" (click)="showModal.set(false)">CERRAR</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ProfileComponent implements OnInit {
  auth = inject(AuthService);
  accessibility = inject(AccessibilityService);
  private http = inject(HttpClient);

  private readonly API_BASE = 'http://localhost:3000/api/v1';

  stats = signal<UserStats | null>(null);
  achievements = signal<Achievement[]>([]);
  showModal = signal(false);

  unlockedCount = computed(() => this.achievements().filter((a) => a.Desbloqueado).length);

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (user?.IdUsuario) {
      this.cargarDatos(user.IdUsuario);
    }
  }

  cargarDatos(idUsuario: number): void {
    this.http.get<UserStats>(`${this.API_BASE}/estadisticas/${idUsuario}`).subscribe({
      next: (data) => this.stats.set(data),
      error: () => {},
    });

    this.http.get<Achievement[]>(`${this.API_BASE}/logros/${idUsuario}`).subscribe({
      next: (data) => this.achievements.set(data),
      error: () => {},
    });
  }

  regenerateLives(): void {
    const user = this.auth.currentUser();
    if (user?.IdUsuario) {
      this.http.post<any>(`${this.API_BASE}/usuarios/${user.IdUsuario}/regenerar-vidas`, {}).subscribe({
        next: () => {
          this.auth.updateLives(5);
          alert('¡Suministros recibidos! 5 vidas restauradas.');
          this.cargarDatos(user.IdUsuario);
        },
        error: () => {
          this.auth.updateLives(5);
        },
      });
    }
  }
}

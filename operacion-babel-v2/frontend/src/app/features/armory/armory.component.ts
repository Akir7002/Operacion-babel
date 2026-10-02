import { Component, signal, computed, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Deck } from '../../core/models';

@Component({
  selector: 'app-armory',
  standalone: true,
  imports: [FormsModule],
  styleUrl: '../../../styles/Mazos.css',
  template: `
    <main class="main-content">
      <div class="container-fluid">
        <section class="page-hero" data-hero>
          <!-- Header de sección -->
          <div class="section-header">
            <h1><i class="bi bi-stack"></i> ARMERÍA DE MAZOS</h1>
            <p class="section-subtitle">Seleccione un arsenal de entrenamiento para desplegar</p>
          </div>

          <!-- Filtros y estadísticas -->
          <div class="tactical-bar">
            <div class="filter-group">
              <label><i class="bi bi-funnel"></i> FILTRAR POR:</label>
              <select [(ngModel)]="selectedLang" id="idiomaFilter">
                <option value="">Todos los Idiomas</option>
                <option value="ru">🇷🇺 Ruso (Русский)</option>
                <option value="zh">🇨🇳 Mandarín (中文)</option>
              </select>
              <select [(ngModel)]="selectedNivel" id="nivelFilter">
                <option value="">Todas las Clasificaciones</option>
                <option value="1">Clasificado</option>
                <option value="2">Secreto</option>
                <option value="3">Ultra Secreto</option>
              </select>
            </div>
            <div class="stats-mini">
              <div class="stat-item">
                <i class="bi bi-journal-check"></i>
                <span id="totalMazos">{{ filteredDecks().length }}</span> Mazos
              </div>
              <div class="stat-item">
                <i class="bi bi-lightning"></i>
                <span id="totalFlashcards">{{ totalFichas() }}</span> Fichas
              </div>
            </div>
          </div>
        </section>

        <!-- Grid de Mazos -->
        <section class="page-mission" data-mission>
          <div class="mazos-grid" id="mazosGrid">
            @for (mazo of filteredDecks(); track mazo.id) {
              <div class="mazo-card" (click)="openMissionModal(mazo)">
                <div class="mazo-classification" [class]="getClassificationClass(mazo.nivelNombre)">
                  {{ mazo.nivelNombre }}
                </div>
                <div class="mazo-content">
                  <span class="mazo-icon"><i [class]="mazo.icono"></i></span>
                  <h3 class="mazo-title">{{ mazo.nombre }}</h3>
                  <p class="mazo-description">{{ mazo.descripcion }}</p>

                  <div class="mazo-progress">
                    <div class="progress-label">
                      <span>FICHAS TÁCTICAS</span>
                      <span>{{ mazo.totalFlashcards || 0 }}</span>
                    </div>
                    <div class="progress-bar-bg">
                      <div class="progress-bar-fill" style="width: 100%;"></div>
                    </div>
                  </div>

                  <div class="mazo-meta" style="display: flex; justify-content: space-between; font-size: 0.8rem; color: #888;">
                    <span><i class="bi bi-translate text-warning"></i> {{ mazo.idiomaNombre }}</span>
                    <span><i class="bi bi-tag text-info"></i> {{ mazo.categoria }}</span>
                  </div>
                </div>
              </div>
            } @empty {
              <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--military-red);">
                <i class="bi bi-exclamation-triangle-fill fs-1"></i>
                <h3>SIN ARSENALES DISPONIBLES</h3>
                <p>No se encontraron mazos con los filtros tácticos seleccionados.</p>
              </div>
            }
          </div>
        </section>
      </div>
    </main>

    <!-- Modal de confirmación de misión -->
    @if (selectedMazo()) {
      <div class="mission-modal active" id="missionModal">
        <div class="modal-content">
          <div class="modal-header">
            <i class="bi bi-exclamation-triangle-fill"></i>
            <h3>ORDEN DE DESPLIEGUE</h3>
          </div>
          <div class="modal-body">
            <p>Está a punto de iniciar entrenamiento táctico con el mazo:</p>
            <h4 id="modalMazoName" class="mazo-name-highlight">{{ selectedMazo()?.nombre }}</h4>
            <div class="mission-stats">
              <div class="mission-stat">
                <i class="bi bi-card-text"></i>
                <span id="modalFlashcardCount">{{ selectedMazo()?.totalFlashcards || 0 }}</span> fichas
              </div>
              <div class="mission-stat">
                <i class="bi bi-bar-chart"></i>
                <span id="modalNivelName">{{ selectedMazo()?.nivelNombre }}</span>
              </div>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn-cancel" (click)="selectedMazo.set(null)">ABORTAR</button>
            <button class="btn-confirm" (click)="startMission()">INICIAR MISIÓN</button>
          </div>
        </div>
      </div>
    }

    <!-- Footer de Inteligencia -->
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
  `,
  encapsulation: ViewEncapsulation.None,
})
export class ArmoryComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);

  decks = signal<Deck[]>([]);
  selectedLang = signal<string>('');
  selectedNivel = signal<string>('');
  selectedMazo = signal<Deck | null>(null);

  filteredDecks = computed(() => {
    let list = this.decks();
    const lang = this.selectedLang();
    const nivel = this.selectedNivel();

    if (lang) {
      list = list.filter((d) => d.idioma?.toLowerCase() === lang.toLowerCase());
    }
    if (nivel) {
      list = list.filter((d) => String(d.nivel) === String(nivel));
    }
    return list;
  });

  totalFichas = computed(() => {
    return this.filteredDecks().reduce((acc, d) => acc + (d.totalFlashcards || 0), 0);
  });

  ngOnInit(): void {
    this.http.get<Deck[]>('http://localhost:3000/api/v1/mazos').subscribe({
      next: (data) => {
        this.decks.set(data);
      },
      error: () => {
        // Fallback si no está el backend corriendo
        this.decks.set([
          { id: 1, nombre: 'Vocabulario Básico RU', descripcion: 'Palabras elementales para operaciones en territorio eslavo.', idioma: 'ru', idiomaNombre: 'Ruso', categoria: 'General', nivel: 1, nivelNombre: 'Clasificado', icono: 'bi bi-crosshair2', totalFlashcards: 5, completadas: 0 },
          { id: 2, nombre: 'Arsenal Militar RU', descripcion: 'Términos de armamento, balística y equipamiento de campo.', idioma: 'ru', idiomaNombre: 'Ruso', categoria: 'Militar', nivel: 2, nivelNombre: 'Secreto', icono: 'bi bi-shield', totalFlashcards: 5, completadas: 0 },
          { id: 3, nombre: 'Hanzi Fundamentales', descripcion: 'Caracteres esenciales para descifrar documentos de inteligencia.', idioma: 'zh', idiomaNombre: 'Mandarín', categoria: 'General', nivel: 1, nivelNombre: 'Clasificado', icono: 'bi bi-journal', totalFlashcards: 5, completadas: 0 },
        ]);
      },
    });
  }

  getClassificationClass(nivel: string | undefined): string {
    const n = (nivel || '').toLowerCase();
    if (n.includes('ultra')) return 'ultra-secreto';
    if (n.includes('secreto')) return 'secreto';
    return 'clasificado';
  }

  openMissionModal(mazo: Deck): void {
    this.selectedMazo.set(mazo);
  }

  startMission(): void {
    const mazo = this.selectedMazo();
    if (mazo) {
      this.selectedMazo.set(null);
      this.router.navigate(['/training', mazo.id]);
    }
  }
}

import { Component, signal, computed, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { Flashcard } from '../../core/models';

@Component({
  selector: 'app-training',
  standalone: true,
  imports: [RouterLink],
  styleUrl: '../../../styles/Flashcards.css',
  encapsulation: ViewEncapsulation.None,
  template: `
    <main class="main-content">
      <!-- Notificación táctica de logro desbloqueado -->
      @if (unlockedAchievement()) {
        <div class="achievement-banner" style="position: fixed; top: 80px; right: 20px; z-index: 9999; background: #1a2e1e; border: 2px solid #2ecc71; color: #fff; padding: 15px 22px; border-radius: 6px; box-shadow: 0 4px 20px rgba(0,0,0,0.7); display: flex; align-items: center; gap: 14px; animation: slideIn 0.4s ease-out;">
          <span style="font-size: 2rem;">{{ unlockedAchievement().iconoMilitar || '🎖️' }}</span>
          <div>
            <div style="font-size: 0.8rem; letter-spacing: 2px; color: #2ecc71; font-weight: bold;">¡LOGRO DESBLOQUEADO!</div>
            <div style="font-size: 1.1rem; font-weight: bold;">{{ unlockedAchievement().nombreLogro }}</div>
            <div style="font-size: 0.85rem; color: #aaa;">{{ unlockedAchievement().descripcion }} (+{{ unlockedAchievement().puntosRecompensa }} XP)</div>
          </div>
        </div>
      }

      <section class="page-hero" data-hero>
        <!-- Info del mazo activo -->
        <div class="mission-info-bar">
          <div class="mission-title">
            <i class="bi bi-journal-bookmark-fill"></i>
            <span id="mazoNombre">{{ mazoNombre() }}</span>
          </div>
          <div class="mission-progress">
            <span id="currentCard">{{ currentIndex() + 1 }}</span> / <span id="totalCards">{{ totalCards() }}</span>
          </div>
        </div>

        <!-- Barra de progreso -->
        <div class="progress-track">
          <div class="progress-fill" id="progressFill" [style.width.%]="progressPercent()"></div>
        </div>
      </section>

      <section class="page-mission" data-mission>
        @if (currentCard() && !completed() && !gameOver()) {
          <!-- Área de la flashcard -->
          <div class="flashcard-area">
            <div class="flashcard-container" id="flashcardContainer" (click)="toggleFlip()">
              <div class="flashcard" id="flashcard" [class.flipped]="isFlipped()">
                <!-- Cara frontal -->
                <div class="flashcard-face front" id="cardFront">
                  <div class="card-badge idioma-badge" id="idiomaBadge">{{ cardIdioma() }}</div>
                  <div class="card-content">
                    <div class="card-icon" id="cardIcon"><i class="bi bi-journal"></i></div>
                    <h2 class="card-word" id="cardWord">{{ currentCard()?.palabra }}</h2>
                    <p class="card-hint">Haga clic para revelar inteligencia</p>
                  </div>
                  <div class="card-footer">
                    <span class="difficulty-tag" id="difficultyTag">CLASIFICADO</span>
                  </div>
                </div>

                <!-- Cara trasera -->
                <div class="flashcard-face back" id="cardBack">
                  <div class="card-badge answer-badge">TRADUCCIÓN</div>
                  <div class="card-content">
                    <h2 class="card-translation" id="cardTranslation">{{ currentCard()?.traduccion }}</h2>
                    <div class="pronunciation-box">
                      <i class="bi bi-mic-fill"></i>
                      <span id="cardPronunciation">{{ currentCard()?.pronunciacion }}</span>
                    </div>
                    <div class="context-box" id="contextBox">
                      <i class="bi bi-info-circle"></i>
                      <span id="cardContext">{{ currentCard()?.contexto }}</span>
                    </div>
                  </div>
                  <div class="card-footer back-footer">
                    <span class="category-tag" id="categoryTag">{{ currentCard()?.categoria || 'General' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Controles -->
            <div class="controls-area">
              <button class="control-btn btn-fail" id="btnFail" (click)="onEvaluate(false)" title="No dominado (resta vida)">
                <i class="bi bi-x-lg"></i>
                <span>NO DOMINADO</span>
              </button>

              <button class="control-btn btn-flip" id="btnFlip" (click)="toggleFlip()" title="Voltear tarjeta">
                <i class="bi bi-arrow-repeat"></i>
                <span>VOLTEAR</span>
              </button>

              <button class="control-btn btn-success" id="btnSuccess" (click)="onEvaluate(true)" title="Dominado">
                <i class="bi bi-check-lg"></i>
                <span>DOMINADO</span>
              </button>
            </div>

            <!-- Indicadores de estado -->
            <div class="status-indicators">
              <div class="status-item" id="statusDominadas">
                <i class="bi bi-check-circle-fill"></i>
                <span id="countDominadas">{{ mastered() }}</span>
              </div>
              <div class="status-item" id="statusPendientes">
                <i class="bi bi-circle"></i>
                <span id="countPendientes">{{ totalCards() - currentIndex() }}</span>
              </div>
              <div class="status-item" id="statusFalladas">
                <i class="bi bi-x-circle-fill"></i>
                <span id="countFalladas">{{ failed() }}</span>
              </div>
            </div>
          </div>
        }
      </section>
    </main>

    <!-- Modal de Game Over -->
    @if (gameOver()) {
      <div class="gameover-modal active" id="gameOverModal">
        <div class="gameover-content">
          <div class="gameover-icon"><i class="bi bi-exclamation-triangle-fill"></i></div>
          <h2>MISIÓN FALLIDA</h2>
          <p>Ha perdido todas sus vidas. El entrenamiento táctico ha sido interrumpido.</p>
          <div class="gameover-stats">
            <div class="go-stat">
              <span class="go-stat-value" id="goDominadas">{{ mastered() }}</span>
              <span class="go-stat-label">Dominadas</span>
            </div>
            <div class="go-stat">
              <span class="go-stat-value" id="goFalladas">{{ failed() }}</span>
              <span class="go-stat-label">Falladas</span>
            </div>
          </div>
          <button class="btn-retry" (click)="retryMission()" id="btnRetry">
            <i class="bi bi-arrow-counterclockwise"></i>
            REINTENTAR MISIÓN
          </button>
          <button class="btn-exit" routerLink="/armory" id="btnExit">
            <i class="bi bi-box-arrow-left"></i>
            RETIRADA AL CUARTEL
          </button>
        </div>
      </div>
    }

    <!-- Modal de Misión Completada -->
    @if (completed()) {
      <div class="victory-modal active" id="victoryModal">
        <div class="victory-content">
          <div class="victory-stamp">MISIÓN CUMPLIDA</div>
          <div class="victory-icon"><i class="bi bi-trophy"></i></div>
          <h2>ENTRENAMIENTO COMPLETADO</h2>
          <p>Excelente desempeño táctico, soldado. Arsenal completado exitosamente.</p>
          <div class="victory-stats">
            <div class="vic-stat">
              <span class="vic-stat-value" id="vicPrecision">{{ precisionRate() }}%</span>
              <span class="vic-stat-label">Precisión</span>
            </div>
            <div class="vic-stat">
              <span class="vic-stat-value" id="vicVidas">{{ lives() }}</span>
              <span class="vic-stat-label">Vidas Restantes</span>
            </div>
          </div>
          <button class="btn-victory" routerLink="/armory" id="btnVictoryExit">
            <i class="bi bi-trophy"></i>
            REGRESAR AL CUARTEL
          </button>
        </div>
      </div>
    }

    <!-- Efecto de daño visual -->
    <div class="damage-effect" [class.active]="showDamage()" id="damageEffect"></div>

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
})
export class TrainingComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  private readonly API_BASE = 'http://localhost:3000/api/v1';

  flashcards = signal<Flashcard[]>([]);
  currentIndex = signal(0);
  isFlipped = signal(false);
  lives = signal(this.auth.currentLives());
  mastered = signal(0);
  failed = signal(0);
  completed = signal(false);
  gameOver = signal(false);
  showDamage = signal(false);
  mazoNombre = signal('Arsenal de Vocabulario Táctico');

  idSesion = signal<number | null>(null);
  sessionStartTime: number = Date.now();
  unlockedAchievement = signal<any | null>(null);

  totalCards = computed(() => this.flashcards().length);
  currentCard = computed(() => this.flashcards()[this.currentIndex()] || null);

  progressPercent = computed(() => {
    if (this.totalCards() === 0) return 0;
    return Math.round(((this.currentIndex() + 1) / this.totalCards()) * 100);
  });

  cardIdioma = computed(() => {
    const card = this.currentCard();
    if (!card) return 'RU';
    return /[а-яА-ЯёЁ]/.test(card.palabra) ? 'RU' : 'ZH';
  });

  precisionRate = computed(() => {
    const total = this.mastered() + this.failed();
    if (total === 0) return 100;
    return Math.round((this.mastered() / total) * 100);
  });

  ngOnInit(): void {
    const deckId = this.route.snapshot.paramMap.get('deckId') || '1';
    this.sessionStartTime = Date.now();

    this.http.get<Flashcard[]>(`${this.API_BASE}/mazos/${deckId}/flashcards`).subscribe({
      next: (cards) => {
        if (cards && cards.length > 0) {
          this.flashcards.set(cards);
        } else {
          this.loadFallbackCards();
        }
      },
      error: () => {
        this.loadFallbackCards();
      },
    });

    this.iniciarSesionEnBackend();
  }

  private iniciarSesionEnBackend(): void {
    const user = this.auth.currentUser();
    if (user?.IdUsuario) {
      this.http.post<{ IdSesion: number }>(`${this.API_BASE}/sesiones`, {
        IdUsuario: user.IdUsuario,
        ModoJuego: 'FLASHCARDS',
      }).subscribe({
        next: (res) => {
          this.idSesion.set(res.IdSesion);
        },
        error: (err) => console.warn('[Training] Error iniciando sesión táctica:', err),
      });
    }
  }

  toggleFlip(): void {
    this.isFlipped.update((f) => !f);
  }

  onEvaluate(success: boolean): void {
    const card = this.currentCard();
    if (!card) return;

    const user = this.auth.currentUser();
    const userId = user?.IdUsuario;

    if (success) {
      this.mastered.update((m) => m + 1);
    } else {
      this.failed.update((f) => f + 1);
      this.showDamage.set(true);
      setTimeout(() => this.showDamage.set(false), 500);

      this.lives.update((l) => {
        const remaining = Math.max(0, l - 1);
        this.auth.updateLives(remaining);
        if (remaining === 0) {
          this.handleGameOver();
        }
        return remaining;
      });
    }

    // Persistir progreso de tarjeta y otorgar puntos en backend
    if (userId) {
      this.http.post(`${this.API_BASE}/flashcards/progreso`, {
        IdUsuario: userId,
        IdFlashcard: card.id,
        Acierto: success,
      }).subscribe({ error: () => {} });

      const pointsEarned = success ? 10 : 2;
      this.http.post<any>(`${this.API_BASE}/puntos`, {
        IdUsuario: userId,
        Puntos: pointsEarned,
        Fuente: 'FLASHCARDS',
      }).subscribe({
        next: (res) => {
          if (res.nuevosLogros && res.nuevosLogros.length > 0) {
            this.notifyAchievement(res.nuevosLogros[0]);
          }
        },
        error: () => {},
      });
    }

    if (this.lives() === 0) return;

    if (this.currentIndex() + 1 < this.totalCards()) {
      this.isFlipped.set(false);
      this.currentIndex.update((i) => i + 1);
    } else {
      this.handleCompleted();
    }
  }

  private handleCompleted(): void {
    this.completed.set(true);
    const sesId = this.idSesion();
    const elapsedSec = Math.floor((Date.now() - this.sessionStartTime) / 1000);
    const totalScore = this.mastered() * 10;

    if (sesId) {
      this.http.put(`${this.API_BASE}/sesiones/${sesId}/finalizar`, {
        EstadoSesion: 'COMPLETADA',
        VidasFinal: this.lives(),
        PuntajeTotal: totalScore,
        TiempoTotalSeg: elapsedSec,
      }).subscribe({ error: () => {} });
    }

    const user = this.auth.currentUser();
    if (user?.IdUsuario) {
      this.http.post<any>(`${this.API_BASE}/logros/evaluar`, {
        IdUsuario: user.IdUsuario,
      }).subscribe({
        next: (res) => {
          if (res.nuevosLogros && res.nuevosLogros.length > 0) {
            this.notifyAchievement(res.nuevosLogros[0]);
          }
        },
        error: () => {},
      });
    }
  }

  private handleGameOver(): void {
    this.gameOver.set(true);
    const sesId = this.idSesion();
    const user = this.auth.currentUser();
    const elapsedSec = Math.floor((Date.now() - this.sessionStartTime) / 1000);

    if (user?.IdUsuario) {
      this.http.post(`${this.API_BASE}/game-over`, {
        IdUsuario: user.IdUsuario,
        IdSesion: sesId,
        CausaMuerte: 'Vidas agotadas en entrenamiento de flashcards',
        ProgresoPerdido: this.currentIndex() + 1,
        MensajeFinal: 'Baja táctica en combate con el vocabulario',
      }).subscribe({ error: () => {} });
    }

    if (sesId) {
      this.http.put(`${this.API_BASE}/sesiones/${sesId}/finalizar`, {
        EstadoSesion: 'GAME_OVER',
        VidasFinal: 0,
        PuntajeTotal: this.mastered() * 10,
        TiempoTotalSeg: elapsedSec,
      }).subscribe({ error: () => {} });
    }
  }

  private notifyAchievement(logro: any): void {
    this.unlockedAchievement.set(logro);
    setTimeout(() => {
      this.unlockedAchievement.set(null);
    }, 4500);
  }

  retryMission(): void {
    this.currentIndex.set(0);
    this.isFlipped.set(false);
    this.mastered.set(0);
    this.failed.set(0);
    this.completed.set(false);
    this.gameOver.set(false);
    this.lives.set(5);
    this.auth.updateLives(5);
    this.sessionStartTime = Date.now();
    this.iniciarSesionEnBackend();
  }

  private loadFallbackCards(): void {
    this.flashcards.set([
      {
        id: 1,
        orden: 1,
        tipo: 'vocabulario',
        pregunta: 'Здравствуйте',
        respuesta: 'Hola',
        palabra: 'Здравствуйте',
        traduccion: 'Hola / Saludos formales',
        pronunciacion: 'Zdrávstvuyte',
        contexto: 'Saludo estándar militar/diplomático de respeto.',
        categoria: 'Protocolo',
      },
      {
        id: 2,
        orden: 2,
        tipo: 'vocabulario',
        pregunta: 'Спасибо',
        respuesta: 'Gracias',
        palabra: 'Спасибо',
        traduccion: 'Gracias',
        pronunciacion: 'Spasíba',
        contexto: 'Cortesía de base aliada.',
        categoria: 'Interacción',
      },
      {
        id: 3,
        orden: 3,
        tipo: 'vocabulario',
        pregunta: 'Внимание',
        respuesta: 'Atención',
        palabra: 'Внимание',
        traduccion: 'Atención / Peligro',
        pronunciacion: 'Vnimániye',
        contexto: 'Alerta táctica en radiofrecuencia.',
        categoria: 'Defensa',
      },
      {
        id: 4,
        orden: 4,
        tipo: 'vocabulario',
        pregunta: 'Союзник',
        respuesta: 'Aliado',
        palabra: 'Союзник',
        traduccion: 'Aliado',
        pronunciacion: 'Sayúznik',
        contexto: 'Designación de fuerzas cooperativas.',
        categoria: 'Inteligencia',
      },
    ]);
  }
}

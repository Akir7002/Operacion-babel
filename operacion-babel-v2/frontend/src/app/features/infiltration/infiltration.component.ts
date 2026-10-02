import {
  Component,
  signal,
  computed,
  inject,
  HostListener,
  OnInit,
  OnDestroy,
  ViewEncapsulation,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';

interface WordChallenge {
  palabra: string;
  pista: string;
  idioma: 'ru' | 'zh';
  idFrase?: number;
}

@Component({
  selector: 'app-infiltration',
  standalone: true,
  imports: [RouterLink],
  styleUrl: '../../../styles/Ahorcado.css',
  encapsulation: ViewEncapsulation.None,
  template: `
    <!-- Efecto de scanline CRT -->
    <div class="crt-overlay"></div>

    <!-- Notificación táctica de logro desbloqueado -->
    @if (unlockedAchievement()) {
      <div
        class="achievement-banner"
        style="position: fixed; top: 80px; right: 20px; z-index: 9999; background: #1a2e1e; border: 2px solid #2ecc71; color: #fff; padding: 15px 22px; border-radius: 6px; box-shadow: 0 4px 20px rgba(0,0,0,0.7); display: flex; align-items: center; gap: 14px; animation: slideIn 0.4s ease-out;"
      >
        <span style="font-size: 2rem;">{{ unlockedAchievement().iconoMilitar || '🎖️' }}</span>
        <div>
          <div style="font-size: 0.8rem; letter-spacing: 2px; color: #2ecc71; font-weight: bold;">
            ¡LOGRO DESBLOQUEADO!
          </div>
          <div style="font-size: 1.1rem; font-weight: bold;">{{ unlockedAchievement().nombreLogro }}</div>
          <div style="font-size: 0.85rem; color: #aaa;">
            {{ unlockedAchievement().descripcion }} (+{{ unlockedAchievement().puntosRecompensa }} XP)
          </div>
        </div>
      </div>
    }

    <main class="main-content">
      <section class="page-hero" data-hero>
        <!-- Header de misión -->
        <div class="mission-briefing">
          <div class="briefing-header">
            <i class="bi bi-exclamation-triangle-fill"></i>
            <h2>PROTOCOLO DE INFILTRACIÓN</h2>
          </div>
          <p class="briefing-text">
            Ha sido interceptado en zona enemiga. Descifre la clave de acceso letra por letra
            antes de que expire el temporizador táctico o agote sus intentos.
          </p>
          <div class="language-selector" style="text-align: center; margin-bottom: 20px;">
            <span style="color: var(--terminal-amber); font-size: 0.9rem; margin-right: 10px; letter-spacing: 2px;">
              SELECCIONA EL IDIOMA:
            </span>
            <button
              class="lang-btn"
              [class.active]="selectedLang() === 'ru'"
              (click)="setLang('ru')"
              style="background: transparent; border: 1px solid var(--terminal-amber); color: var(--terminal-amber); padding: 5px 15px; margin: 0 5px; cursor: pointer;"
            >
              Ruso
            </button>
            <button
              class="lang-btn"
              [class.active]="selectedLang() === 'zh'"
              (click)="setLang('zh')"
              style="background: transparent; border: 1px solid #555; color: #555; padding: 5px 15px; margin: 0 5px; cursor: pointer;"
            >
              Chino
            </button>
          </div>
          <div class="mission-stats-bar">
            <div class="mstat">
              <span class="mstat-label">NIVEL</span>
              <span class="mstat-value" id="nivelActual">{{ nivel() }}</span>
            </div>
            <div class="mstat">
              <span class="mstat-label">PALABRAS</span>
              <span class="mstat-value" id="palabrasCompletadas">{{ palabrasCompletadas() }}</span>
            </div>
            <div class="mstat">
              <span class="mstat-label">RACHA</span>
              <span class="mstat-value" id="rachaActual">{{ streak() }}</span>
            </div>
            <div class="mstat">
              <span class="mstat-label">TIEMPO</span>
              <span class="mstat-value" [style.color]="timeLeft() <= 10 ? '#e74c3c' : 'inherit'">
                {{ timeLeft() }}s
              </span>
            </div>
          </div>
        </div>
      </section>

      <section class="page-mission" data-mission>
        <!-- Área principal del juego -->
        <div class="game-arena">
          <!-- Panel izquierdo: Dibujo del ahorcado -->
          <div class="hangman-panel">
            <div class="hangman-frame">
              <svg viewBox="0 0 200 250" class="hangman-svg">
                <!-- Base -->
                <line x1="20" y1="230" x2="180" y2="230" class="hangman-part base" />
                <!-- Poste vertical -->
                <line x1="40" y1="230" x2="40" y2="20" class="hangman-part pole" />
                <!-- Poste horizontal -->
                <line x1="40" y1="20" x2="140" y2="20" class="hangman-part beam" />
                <!-- Cuerda -->
                <line x1="140" y1="20" x2="140" y2="50" class="hangman-part rope" />

                <!-- Cabeza -->
                <circle cx="140" cy="65" r="15" class="hangman-part head" [class.visible]="errors() >= 1" id="part-head" />
                <!-- Cuerpo -->
                <line x1="140" y1="80" x2="140" y2="150" class="hangman-part body" [class.visible]="errors() >= 2" id="part-body" />
                <!-- Brazo izquierdo -->
                <line x1="140" y1="95" x2="110" y2="120" class="hangman-part arm-left" [class.visible]="errors() >= 3" id="part-arm-left" />
                <!-- Brazo derecho -->
                <line x1="140" y1="95" x2="170" y2="120" class="hangman-part arm-right" [class.visible]="errors() >= 4" id="part-arm-right" />
                <!-- Pierna izquierda -->
                <line x1="140" y1="150" x2="110" y2="190" class="hangman-part leg-left" [class.visible]="errors() >= 5" id="part-leg-left" />
                <!-- Pierna derecha -->
                <line x1="140" y1="150" x2="170" y2="190" class="hangman-part leg-right" [class.visible]="errors() >= 6" id="part-leg-right" />
              </svg>
            </div>
            <div class="hangman-status">
              <span class="status-label">ESTADO DEL PRISIONERO</span>
              <span
                class="status-value"
                [class.danger]="errors() >= 3 && errors() < 5"
                [class.critical]="errors() >= 5"
                id="prisonerStatus"
              >
                {{ prisonerStatusText() }}
              </span>
            </div>
          </div>

          <!-- Panel derecho: Juego -->
          <div class="game-panel">
            <!-- Pista -->
            <div class="hint-box">
              <i class="bi bi-lightbulb"></i>
              <span id="hintText">{{ currentWord()?.pista }}</span>
            </div>

            <!-- Palabra a adivinar -->
            <div class="word-display" id="wordDisplay">
              @for (char of wordLetters(); track $index) {
                <div
                  class="letter-slot"
                  [class.revealed]="guessedLetters().includes(char)"
                  [class.hidden-letter]="!guessedLetters().includes(char)"
                >
                  {{ guessedLetters().includes(char) ? char : '' }}
                </div>
              }
            </div>

            <!-- Teclado virtual -->
            <div class="keyboard" id="keyboard">
              @for (key of activeKeyboard(); track key) {
                <button
                  class="key"
                  [disabled]="guessedLetters().includes(key) || isWon() || isLost()"
                  [class.used]="guessedLetters().includes(key)"
                  [class.correct]="guessedLetters().includes(key) && wordLetters().includes(key)"
                  (click)="guess(key)"
                >
                  {{ key }}
                </button>
              }
            </div>

            <!-- Letras usadas -->
            <div class="used-letters">
              <span class="used-label">INTENTOS FALLIDOS:</span>
              <div class="used-chars" id="usedChars">
                @for (f of failedLetters(); track f) {
                  <span class="used-char">{{ f }}</span>
                }
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Modal de Nivel Completado -->
    @if (isWon()) {
      <div class="level-modal active" id="levelModal">
        <div class="level-content">
          <div class="level-stamp">ACCESO CONCEDIDO</div>
          <div class="level-icon"><i class="bi bi-unlock"></i></div>
          <h3>CÓDIGO DESCIFRADO</h3>
          <p id="levelMessage">Ha logrado infiltrarse un nivel más. Clave: {{ currentWord()?.palabra }}</p>
          <div class="level-stats">
            <div class="lvl-stat">
              <span class="lvl-stat-value">{{ remainingLives() }}</span>
              <span class="lvl-stat-label">Vidas</span>
            </div>
            <div class="lvl-stat">
              <span class="lvl-stat-value">{{ streak() }}</span>
              <span class="lvl-stat-label">Racha</span>
            </div>
          </div>
          <button class="btn-next-level" (click)="nextRound()" id="btnNextLevel">
            <i class="bi bi-arrow-right-circle me-2"></i>
            SIGUIENTE INFILTRACIÓN
          </button>
        </div>
      </div>
    }

    <!-- Modal de Misión Fallida / Ejecutado -->
    @if (isLost()) {
      <div class="gameover-modal active" id="gameOverModal">
        <div class="gameover-content">
          <div class="gameover-skull"><i class="bi bi-exclamation-triangle-fill"></i></div>
          <h2>EJECUTADO</h2>
          <p>El enemigo ha descubierto su identidad. La clave era: <strong>{{ currentWord()?.palabra }}</strong></p>
          <div class="final-stats">
            <div class="fstat">
              <span class="fstat-value" id="finalNivel">{{ nivel() }}</span>
              <span class="fstat-label">Nivel Alcanzado</span>
            </div>
            <div class="fstat">
              <span class="fstat-value" id="finalPalabras">{{ palabrasCompletadas() }}</span>
              <span class="fstat-label">Palabras Descifradas</span>
            </div>
            <div class="fstat">
              <span class="fstat-value" id="finalRacha">{{ streak() }}</span>
              <span class="fstat-label">Mejor Racha</span>
            </div>
          </div>
          <button class="btn-retry" (click)="resetRound()" id="btnRetry">
            <i class="bi bi-arrow-counterclockwise me-2"></i>
            REINTENTAR INFILTRACIÓN
          </button>
          <a class="btn-exit" routerLink="/armory" id="btnExit" style="display: block; text-align: center; text-decoration: none; margin-top: 10px;">
            <i class="bi bi-box-arrow-left me-2"></i>
            ABANDONAR MISIÓN
          </a>
        </div>
      </div>
    }

    <!-- Efectos de daño y éxito -->
    <div class="damage-overlay" [class.active]="showDamage()" id="damageOverlay"></div>
    <div class="success-overlay" [class.active]="showSuccess()" id="successOverlay"></div>

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
export class InfiltrationComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  private readonly API_BASE = 'http://localhost:3000/api/v1';

  readonly defaultRussianWords: WordChallenge[] = [
    { palabra: 'КНИГА', pista: 'Objeto de lectura esencial en campo', idioma: 'ru' },
    { palabra: 'ВОДА', pista: 'Recurso vital para supervivencia', idioma: 'ru' },
    { palabra: 'ДОМ', pista: 'Estructura de refugio táctico', idioma: 'ru' },
    { palabra: 'ОРУЖИЕ', pista: 'Equipamiento táctico de combate', idioma: 'ru' },
    { palabra: 'ЩИТ', pista: 'Protección balística frontal', idioma: 'ru' },
    { palabra: 'ВРАЧ', pista: 'Especialista médico de campo', idioma: 'ru' },
    { palabra: 'ОПАСНОСТЬ', pista: 'Señal de alerta inmediata', idioma: 'ru' },
    { palabra: 'УКРЫТИE', pista: 'Posición defensiva temporal', idioma: 'ru' },
  ];

  readonly defaultChineseWords: WordChallenge[] = [
    { palabra: 'SHU', pista: 'Libro (Pinyin: Shū)', idioma: 'zh' },
    { palabra: 'SHUI', pista: 'Agua (Pinyin: Shuǐ)', idioma: 'zh' },
    { palabra: 'HUO', pista: 'Fuego (Pinyin: Huǒ)', idioma: 'zh' },
    { palabra: 'REN', pista: 'Persona (Pinyin: Rén)', idioma: 'zh' },
    { palabra: 'WUQI', pista: 'Arma (Pinyin: Wǔqì)', idioma: 'zh' },
    { palabra: 'MIMA', pista: 'Contraseña (Pinyin: Mìmǎ)', idioma: 'zh' },
  ];

  readonly russianAlphabet = 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'.split('');
  readonly latinAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  selectedLang = signal<'ru' | 'zh'>('ru');
  currentWord = signal<WordChallenge | null>(null);
  guessedLetters = signal<string[]>([]);
  errors = signal(0);
  nivel = signal(1);
  palabrasCompletadas = signal(0);
  streak = signal(0);
  showDamage = signal(false);
  showSuccess = signal(false);

  timeLeft = signal(60);
  private timerInterval: any = null;

  idSesion = signal<number | null>(null);
  sessionStartTime: number = Date.now();
  unlockedAchievement = signal<any | null>(null);

  maxErrors = 6;

  wordLetters = computed(() => {
    const word = this.currentWord();
    return word ? word.palabra.toUpperCase().split('') : [];
  });

  activeKeyboard = computed(() => {
    return this.selectedLang() === 'ru' ? this.russianAlphabet : this.latinAlphabet;
  });

  failedLetters = computed(() => {
    const letters = this.wordLetters();
    return this.guessedLetters().filter((char) => !letters.includes(char));
  });

  remainingLives = computed(() => Math.max(0, this.maxErrors - this.errors()));

  isWon = computed(() => {
    const letters = this.wordLetters();
    if (letters.length === 0) return false;
    return letters.every((char) => this.guessedLetters().includes(char));
  });

  isLost = computed(() => this.errors() >= this.maxErrors);

  prisonerStatusText = computed(() => {
    const err = this.errors();
    if (err === 0) return 'SANO';
    if (err <= 2) return 'HERIDO LEVE';
    if (err <= 4) return 'HERIDO GRAVE';
    if (err === 5) return 'CRÍTICO';
    return 'EJECUTADO';
  });

  ngOnInit(): void {
    this.sessionStartTime = Date.now();
    this.iniciarSesionEnBackend();
    this.cargarFrasesYComenzar();
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  private iniciarSesionEnBackend(): void {
    const user = this.auth.currentUser();
    if (user?.IdUsuario) {
      this.http.post<{ IdSesion: number }>(`${this.API_BASE}/sesiones`, {
        IdUsuario: user.IdUsuario,
        ModoJuego: 'INFILTRACION',
      }).subscribe({
        next: (res) => this.idSesion.set(res.IdSesion),
        error: (err) => console.warn('[Infiltration] Error iniciando sesión táctica:', err),
      });
    }
  }

  private cargarFrasesYComenzar(): void {
    const idiomaId = this.selectedLang() === 'ru' ? 1 : 2;
    this.http.get<any[]>(`${this.API_BASE}/frases/${idiomaId}`).subscribe({
      next: (frases) => {
        if (frases && frases.length > 0) {
          const list: WordChallenge[] = frases.map((f) => ({
            palabra: (f.FraseOriginal || f.fraseoriginal || f.palabra || '').trim().toUpperCase(),
            pista: f.Pista || f.pista || 'Descifra la clave militar',
            idioma: this.selectedLang(),
            idFrase: f.IdFrase || f.idfrase,
          })).filter((f) => f.palabra.length > 0 && !f.palabra.includes(' '));

          if (list.length > 0) {
            this.selectWordFromList(list);
            return;
          }
        }
        this.selectFallbackWord();
      },
      error: () => {
        this.selectFallbackWord();
      },
    });
  }

  private selectWordFromList(list: WordChallenge[]): void {
    const randomIndex = Math.floor(Math.random() * list.length);
    this.currentWord.set(list[randomIndex]);
    this.guessedLetters.set([]);
    this.errors.set(0);
    this.startTimer(60);
  }

  private selectFallbackWord(): void {
    const list = this.selectedLang() === 'ru' ? this.defaultRussianWords : this.defaultChineseWords;
    const randomIndex = Math.floor(Math.random() * list.length);
    this.currentWord.set(list[randomIndex]);
    this.guessedLetters.set([]);
    this.errors.set(0);
    this.startTimer(60);
  }

  private startTimer(duration: number = 60): void {
    this.stopTimer();
    this.timeLeft.set(duration);
    this.timerInterval = setInterval(() => {
      if (this.isWon() || this.isLost()) {
        this.stopTimer();
        return;
      }
      if (this.timeLeft() <= 1) {
        this.timeLeft.set(0);
        this.handleTimeout();
      } else {
        this.timeLeft.update((t) => t - 1);
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private handleTimeout(): void {
    this.errors.update((e) => e + 1);
    this.showDamage.set(true);
    setTimeout(() => this.showDamage.set(false), 400);

    if (this.errors() >= this.maxErrors) {
      this.handleDefeat();
    } else {
      this.startTimer(30); // 30 segundos adicionales de gracia
    }
  }

  setLang(lang: 'ru' | 'zh'): void {
    if (this.selectedLang() === lang) return;
    this.selectedLang.set(lang);
    this.resetRound();
  }

  guess(char: string): void {
    const upperChar = char.toUpperCase();
    if (this.guessedLetters().includes(upperChar) || this.isWon() || this.isLost()) {
      return;
    }

    this.guessedLetters.update((list) => [...list, upperChar]);

    if (!this.wordLetters().includes(upperChar)) {
      this.errors.update((e) => e + 1);
      this.showDamage.set(true);
      setTimeout(() => this.showDamage.set(false), 400);

      if (this.errors() >= this.maxErrors) {
        this.handleDefeat();
      }
    } else {
      if (this.isWon()) {
        this.stopTimer();
        this.showSuccess.set(true);
        setTimeout(() => this.showSuccess.set(false), 600);
        this.palabrasCompletadas.update((p) => p + 1);
        this.streak.update((s) => s + 1);

        // Otorgar puntos tácticos modulados por tiempo restante y vidas
        const remainingTime = this.timeLeft();
        const points = 50 + this.remainingLives() * 10 + remainingTime * 2;
        const user = this.auth.currentUser();

        if (user?.IdUsuario) {
          this.http.post<any>(`${this.API_BASE}/puntos`, {
            IdUsuario: user.IdUsuario,
            Puntos: points,
            Fuente: 'INFILTRACION',
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
    }
  }

  private handleDefeat(): void {
    this.stopTimer();
    this.streak.set(0);
    const newLives = Math.max(0, this.auth.currentLives() - 1);
    this.auth.updateLives(newLives);

    const user = this.auth.currentUser();
    const sesId = this.idSesion();
    const elapsedSec = Math.floor((Date.now() - this.sessionStartTime) / 1000);

    if (user?.IdUsuario) {
      this.http.post(`${this.API_BASE}/game-over`, {
        IdUsuario: user.IdUsuario,
        IdSesion: sesId,
        CausaMuerte: 'Descubierto en interrogatorio enemigo (Ahorcado)',
        ProgresoPerdido: this.palabrasCompletadas(),
        MensajeFinal: 'Baja en territorio hostil',
      }).subscribe({ error: () => {} });
    }

    if (sesId) {
      this.http.put(`${this.API_BASE}/sesiones/${sesId}/finalizar`, {
        EstadoSesion: 'GAME_OVER',
        VidasFinal: newLives,
        PuntajeTotal: this.palabrasCompletadas() * 50,
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

  nextRound(): void {
    this.nivel.update((n) => n + 1);
    this.cargarFrasesYComenzar();
  }

  resetRound(): void {
    this.errors.set(0);
    this.guessedLetters.set([]);
    this.cargarFrasesYComenzar();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (this.isWon() || this.isLost()) return;
    const key = event.key.toUpperCase();
    if (this.activeKeyboard().includes(key)) {
      this.guess(key);
    }
  }
}

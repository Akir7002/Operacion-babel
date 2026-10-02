import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  styleUrl: '../../../styles/Babelhome.css',
  encapsulation: ViewEncapsulation.None,
  template: `
    <!-- Encabezado principal de la base -->
    <section class="hero-section" id="home">
      <div class="alert-text">¡A L T O!</div>
      <div class="hero-body">
        Identifíquese o prepárese para ser neutralizado.<br />
        Está entrando en zona de guerra.<br />
        Su única <span class="military-accent">Arma</span> es el idioma.
      </div>
      <button class="scroll-btn" (click)="scrollToMission()" id="heroScrollButton" aria-label="Ir a frentes activos">
        <i class="bi bi-chevron-double-down"></i>
      </button>
    </section>

    <!-- Panel de misiones y accesos rápidos -->
    <section class="mission-section" id="mission">
      <div class="container-fluid">
        <div class="row">
          <div class="col-md-8">
            <h3 class="mb-4">FRENTES ACTIVOS</h3>
            <div class="map-container">
              <!-- Imagen de mapa base -->
              <img src="/tl.png" class="world-map" alt="Mapa Táctico" />

              <!-- Nodo Rusia -->
              <div
                class="target-node"
                id="front-russia"
                routerLink="/armory"
                title="Desplegar Frente Ruso (Русский)"
              >
                <span class="target-label">Frente Este (Русский)</span>
              </div>

              <!-- Nodo China -->
              <div
                class="target-node"
                id="front-china"
                routerLink="/armory"
                title="Desplegar Frente Mandarín (中文)"
              >
                <span class="target-label">Frente Oriental (中文)</span>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="info-panel mt-5">
              <i class="bi bi-eye fs-1 mb-3"></i>
              <h4>Objetivo de la Misión</h4>
              <p>
                Usted ha sido seleccionado para la Base Babel. Su misión es interceptar,
                entender y aliarse con las fuerzas del bando contrario.
              </p>
              <p class="text-danger">Si no domina su lengua, será tratado como hostil.</p>
              <a routerLink="/auth/enlistment" class="btn btn-outline-light mt-3 w-100" id="enlistButton">
                ENLISTAR
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <footer>
      <div class="footer-line">DATOS DE INTELIGENCIA:</div>
      <div class="footer-line">Desarrollado por <span class="highlight">Akir (Maria Fernanda P.)</span></div>
      <div class="footer-line">Desarrollado por <span class="highlight">Mauo (David Mauricio P.)</span></div>
      <div class="footer-line">División de Ingeniería de Babel</div>
      <div class="footer-line">Protocolo: Encriptación de datos nivel militar</div>
      <div class="footer-line mt-3">
        &copy; 2026: Todos los derechos reservados bajo la jurisdicción de la Alianza Babel
      </div>
    </footer>

    <button class="scroll-top-btn" (click)="scrollToTop()" id="scrollTopButton" aria-label="Volver arriba">
      <i class="bi bi-chevron-double-up"></i>
    </button>
  `,
  styles: [`
    .target-node:hover {
      filter: brightness(1.5) drop-shadow(0 0 15px red);
    }
  `],
})
export class HomeComponent implements OnInit, OnDestroy {
  private observers: IntersectionObserver[] = [];

  ngOnInit(): void {
    if (typeof window === 'undefined') return;

    const heroSection = document.getElementById('home');
    const missionSection = document.getElementById('mission');
    const footerElement = document.querySelector('footer');

    const sectionVisibility = { mission: false, footer: false };

    const updateTopButtonVisibility = () => {
      document.body.classList.toggle(
        'show-top-btn',
        sectionVisibility.mission || sectionVisibility.footer
      );
    };

    if (heroSection) {
      const heroObserver = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          document.body.classList.toggle('header-hidden', !entry.isIntersecting);
        },
        { threshold: 0.55 }
      );
      heroObserver.observe(heroSection);
      this.observers.push(heroObserver);
    }

    if (missionSection) {
      const missionObserver = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          sectionVisibility.mission = entry.isIntersecting;
          updateTopButtonVisibility();
        },
        { threshold: 0.25 }
      );
      missionObserver.observe(missionSection);
      this.observers.push(missionObserver);
    }

    if (footerElement) {
      const footerObserver = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          document.body.classList.toggle('footer-mode', entry.isIntersecting);
          sectionVisibility.footer = entry.isIntersecting;
          updateTopButtonVisibility();
        },
        { threshold: 0.18 }
      );
      footerObserver.observe(footerElement);
      this.observers.push(footerObserver);
    }
  }

  ngOnDestroy(): void {
    this.observers.forEach((o) => o.disconnect());
    document.body.classList.remove('header-hidden', 'show-top-btn', 'footer-mode');
  }

  scrollToMission(): void {
    const el = document.getElementById('mission');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

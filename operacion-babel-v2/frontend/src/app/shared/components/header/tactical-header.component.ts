import { Component, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-tactical-header',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header>
      <div class="menu-icon" id="menuBtn" (click)="toggleSidebar.emit()">
        <i class="bi bi-list fs-2"></i>
      </div>
      <a class="brand-container" routerLink="/" aria-label="Volver al inicio">
        <i class="bi bi-shield-lock fs-3"></i><br>
        <span>Base de Operaciones Babel</span>
      </a>
      <a class="user-icon" routerLink="/profile" aria-label="Perfil">
        <i class="bi bi-person-badge fs-3"></i>
      </a>
    </header>
  `,
})
export class TacticalHeaderComponent {
  toggleSidebar = output<void>();
}

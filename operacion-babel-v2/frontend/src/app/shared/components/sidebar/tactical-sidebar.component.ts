import { Component, input, output, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-tactical-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="sidebar" [class.active]="isOpen()" id="sidebar">
      <div class="sidebar-header">
        <i class="bi bi-shield-lock fs-2"></i>
        <span>MENÚ TÁCTICO</span>
      </div>
      <ul class="sidebar-menu">
        <li>
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" (click)="closeSidebar.emit()">
            <i class="bi bi-house-door"></i> Cuartel General
          </a>
        </li>
        <li>
          <a routerLink="/armory" routerLinkActive="active" (click)="closeSidebar.emit()">
            <i class="bi bi-stack"></i> Armería de Mazos
          </a>
        </li>
        <li>
          <a routerLink="/infiltration" routerLinkActive="active" (click)="closeSidebar.emit()">
            <i class="bi bi-crosshair2"></i> Modo Infiltración
          </a>
        </li>
        <li>
          <a routerLink="/auth/enlistment" routerLinkActive="active" (click)="closeSidebar.emit()">
            <i class="bi bi-file-earmark-text"></i> Registro de Reclutas
          </a>
        </li>
        <li>
          <a routerLink="/admin" routerLinkActive="active" (click)="closeSidebar.emit()">
            <i class="bi bi-shield-lock"></i> Oficina de Operaciones
          </a>
        </li>
        @if (auth.isAuthenticated()) {
          <li>
            <a (click)="onLogout()" style="cursor: pointer; color: var(--military-red);">
              <i class="bi bi-box-arrow-right"></i> Cerrar Sesión
            </a>
          </li>
        }
      </ul>
      <div class="sidebar-footer">
        <div class="soldier-status">
          <div class="status-top">
            <i class="bi bi-heart-pulse"></i>
            <span class="status-label">Integridad</span>
          </div>
          <div class="lives-bar">
            @for (life of [1, 2, 3, 4, 5]; track life) {
              <div class="life" [class.active]="life <= auth.currentLives()" [attr.data-life]="life"></div>
            }
          </div>
        </div>
        <div class="rank-display">
          <i class="bi bi-award rank-icon"></i>
          <span class="rank-name">{{ auth.currentUser()?.RangoMilitar || 'Recluta' }}</span>
        </div>
      </div>
    </nav>
    <div
      class="sidebar-overlay"
      [class.active]="isOpen()"
      (click)="closeSidebar.emit()"
      id="sidebarOverlay"
    ></div>
  `,
})
export class TacticalSidebarComponent {
  auth = inject(AuthService);
  isOpen = input<boolean>(false);
  closeSidebar = output<void>();

  onLogout(): void {
    this.closeSidebar.emit();
    this.auth.logout();
  }
}

import { Component, signal, computed, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [FormsModule],
  styleUrl: '../../../styles/Administradores.css',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="page-shell">
      <main class="page-wrap page-hero" data-hero>
        <div class="registry-panel registry-panel--full">
          <div class="registry-toolbar">
            <div>
              <p class="eyebrow">INTENDENTES Y OFICIALES ACTIVOS</p>
              <h2>Expediente de control</h2>
            </div>
            <div class="registry-actions">
              <input
                type="search"
                [(ngModel)]="searchQuery"
                class="search-input"
                placeholder="Filtrar por nombre, rango o contacto"
              />
              <button type="button" (click)="loadUsers()" class="refresh-btn">
                <i class="bi bi-arrow-clockwise"></i> Actualizar
              </button>
            </div>
          </div>

          <div class="registry-meta">
            <span id="activeUsersCount">{{ filteredUsers().length }} combatientes activos</span>
            <span id="registryStatus">Base central sincronizada</span>
          </div>

          @if (loading()) {
            <div style="text-align: center; padding: 40px; color: #888;">
              <div class="spinner-border text-danger" role="status"></div>
              <p class="mt-2">CONSULTANDO EXPEDIENTES MILITARES...</p>
            </div>
          } @else {
            <div id="adminUsersList" class="users-grid">
              @for (u of filteredUsers(); track u.IdUsuario) {
                <div class="user-card" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); padding: 20px; border-radius: 4px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <h4 style="margin: 0 0 6px 0; color: #fff; font-size: 1.1rem;">
                      {{ u.NombreClave }}
                      <span class="badge" [style.background]="u.IdRango >= 4 ? '#b9821e' : '#2f8f4d'" style="font-size: 0.75rem; margin-left: 10px;">
                        {{ u.RangoMilitar }}
                      </span>
                    </h4>
                    <div style="font-size: 0.85rem; color: #888;">
                      <span>Nombre: {{ u.NombreCompleto || 'Sin registrar' }}</span> |
                      <span>Contacto: {{ u.FrecuenciaContacto }}</span> |
                      <span>Frente: {{ u.FrenteAsignado || 'General' }}</span> |
                      <span style="color: var(--military-red);">Vidas: {{ u.VidasActuales }} / 5</span>
                    </div>
                  </div>
                  <div>
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-danger"
                      (click)="dischargeUser(u.IdUsuario)"
                    >
                      <i class="bi bi-person-x"></i> DAR DE BAJA
                    </button>
                  </div>
                </div>
              } @empty {
                <div style="text-align: center; padding: 40px; color: #666;">
                  No se encontraron expedientes con este criterio de búsqueda.
                </div>
              }
            </div>
          }
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
export class AdminComponent implements OnInit {
  private http = inject(HttpClient);

  users = signal<any[]>([]);
  loading = signal(true);
  searchQuery = signal('');

  filteredUsers = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.users();
    return this.users().filter(
      (u) =>
        u.NombreClave?.toLowerCase().includes(q) ||
        u.NombreCompleto?.toLowerCase().includes(q) ||
        u.FrecuenciaContacto?.toLowerCase().includes(q) ||
        u.RangoMilitar?.toLowerCase().includes(q)
    );
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.http.get<any[]>('http://localhost:3000/api/v1/usuarios/activos').subscribe({
      next: (data) => {
        this.users.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  dischargeUser(id: number): void {
    if (confirm(`¿Confirma dar de baja al combatiente #${id}? Esta acción es irreversible.`)) {
      this.http.delete(`http://localhost:3000/api/v1/usuarios/${id}`).subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (err) => {
          alert(err.error?.error || 'No se pudo procesar la baja militar.');
        },
      });
    }
  }
}

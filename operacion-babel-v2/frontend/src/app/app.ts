import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TacticalHeaderComponent } from './shared/components/header/tactical-header.component';
import { TacticalSidebarComponent } from './shared/components/sidebar/tactical-sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TacticalHeaderComponent, TacticalSidebarComponent],
  template: `
    <div class="spotlight"></div>
    <div class="fog-container"></div>

    <app-tactical-header (toggleSidebar)="toggleSidebar()" />
    <app-tactical-sidebar [isOpen]="sidebarOpen()" (closeSidebar)="sidebarOpen.set(false)" />

    <router-outlet />
  `,
})
export class App {
  sidebarOpen = signal<boolean>(false);

  toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }
}

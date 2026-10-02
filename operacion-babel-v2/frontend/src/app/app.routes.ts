import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'auth/enlistment',
    loadComponent: () => import('./features/auth/enlistment.component').then((m) => m.EnlistmentComponent),
  },
  {
    path: 'armory',
    loadComponent: () => import('./features/armory/armory.component').then((m) => m.ArmoryComponent),
  },
  {
    path: 'training/:deckId',
    loadComponent: () => import('./features/training/training.component').then((m) => m.TrainingComponent),
    canActivate: [authGuard],
  },
  {
    path: 'infiltration',
    loadComponent: () => import('./features/infiltration/infiltration.component').then((m) => m.InfiltrationComponent),
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile.component').then((m) => m.ProfileComponent),
    canActivate: [authGuard],
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin.component').then((m) => m.AdminComponent),
    canActivate: [adminGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];

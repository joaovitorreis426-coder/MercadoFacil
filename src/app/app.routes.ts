
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./pages/auth/register/register.component').then(m => m.RegisterComponent) },
  
  // Cliente
  {
    path: 'consumer',
    loadComponent: () => import('./pages/consumer/layout/consumer-layout.component').then(m => m.ConsumerLayoutComponent),
    children: [
      { path: '', redirectTo: 'map', pathMatch: 'full' },
      { path: 'list', loadComponent: () => import('./pages/consumer/list/list.component').then(m => m.ConsumerListComponent) },
      { path: 'map', loadComponent: () => import('./pages/consumer/map/map.component').then(m => m.ConsumerMapComponent) }
    ]
  },

  // Vendedor (Painel Tudo-em-Um)
  {
    path: 'seller',
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/seller/dashboard/dashboard.component').then(m => m.SellerDashboardComponent) },
      // Redireciona 'products' para 'dashboard' para evitar erro 404
      { path: 'products', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'profile', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  
  { path: '**', redirectTo: 'login' }
];
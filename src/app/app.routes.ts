import { Routes } from '@angular/router';
// Importação dos seus cadeados de segurança!
import { sellerGuard, consumerGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Rotas Públicas
  { path: 'login', loadComponent: () => import('./pages/auth/auth.component').then(m => m.AuthPageComponent) },
  { path: 'register', loadComponent: () => import('./pages/auth/register/register.component').then(m => m.RegisterComponent) },
  
  // 🔒 Rotas do Consumidor (Protegidas)
  { 
    path: 'consumer',
    canActivate: [consumerGuard],
    children: [
      { path: 'list', loadComponent: () => import('./pages/consumer/list/list.component').then(m => m.ConsumerListComponent) },
      // ATENÇÃO: Se der erro no mapa abaixo, mude m.ConsumerMapComponent para m.MapComponent
      { path: 'map', loadComponent: () => import('./pages/consumer/map/map.component').then(m => m.ConsumerMapComponent) } 
    ]
  },

  // 🔒 Rotas do Vendedor (Protegidas)
  { 
    path: 'seller',
    canActivate: [sellerGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./pages/seller/dashboard/dashboard.component').then(m => m.SellerDashboardComponent) },
      { path: 'products/new', loadComponent: () => import('./pages/seller/product-create/product-create.component').then(m => m.SellerProductCreateComponent) },
      { path: 'setup', loadComponent: () => import('./pages/seller/store-setup/store-setup.component').then(m => m.StoreSetupComponent) }
    ]
  },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
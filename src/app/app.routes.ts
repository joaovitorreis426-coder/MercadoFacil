import { Routes } from '@angular/router';

// 1. Importação da nova Landing Page
import { LandingPageComponent } from './pages/landing/landing.component';

// Importação das outras páginas existentes
import { AuthPageComponent } from './pages/auth/auth.component';
import { SellerDashboardComponent } from './pages/seller/dashboard/dashboard.component';
import { StoreSetupComponent } from './pages/seller/store-setup/store-setup.component';
import { ConsumerListComponent } from './pages/consumer/list/list.component';

export const routes: Routes = [
  // --- ROTA INICIAL (A MELHORIA) ---
  // Quando acessar http://localhost:4200/, abre a capa do site (Landing Page)
  { path: '', component: LandingPageComponent }, 
  
  // --- AUTENTICAÇÃO ---
  { path: 'auth', component: AuthPageComponent },
  
  // --- VENDEDOR ---
  { path: 'seller/dashboard', component: SellerDashboardComponent },
  { path: 'seller/setup', component: StoreSetupComponent },

  // --- CONSUMIDOR ---
  { 
    path: 'consumer/map', 
    // Carregamento dinâmico (Lazy Load) para o Mapa não pesar na inicialização
    loadComponent: () => import('./pages/consumer/map/map.component')
      .then(m => m.MapComponent)
      .catch(err => {
        console.error('Erro ao carregar mapa:', err);
        return AuthPageComponent; // Fallback de segurança
      }) 
  },
  { path: 'consumer/list', component: ConsumerListComponent }
];
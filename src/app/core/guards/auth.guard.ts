import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

// 🛡️ Segurança da Área do Vendedor
export const sellerGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const user = authService.currentUser(); // Pega quem está logado

  // Se o usuário existir e o tipo dele for 'seller' (Vendedor), a porta abre!
  if (user && user.type === 'seller') {
    return true;
  }
  
  // Se não for Vendedor, é expulso para o Login com um aviso
  alert('⛔ Acesso Negado: Apenas Vendedores podem acessar esta área.');
  router.navigate(['/login']); 
  return false;
};

// 🛡️ Segurança da Área do Consumidor
export const consumerGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const user = authService.currentUser();

  // Se o usuário existir e o tipo dele for 'consumer' (Consumidor), a porta abre!
  if (user && user.type === 'consumer') {
    return true;
  }
  
  alert('⛔ Acesso Negado: Faça login como Consumidor para acessar.');
  router.navigate(['/login']);
  return false;
};
import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  currentUser = signal<any>(null);

  private baseUrl = 'https://mercadofacil-hrvh.onrender.com/api/auth';
login(credentials: any) {
    this.http.post(`${this.baseUrl}/login`, credentials).subscribe({
      next: (user: any) => {
        this.currentUser.set(user);
        
        // A MÁGICA AQUI: Em vez de confiar no banco (user.type), 
        // vamos confiar no botão que você clicou na tela (credentials.type)
        if (credentials.type === 'seller') {
          this.router.navigate(['/seller/dashboard']);
        } else {
          this.router.navigate(['/consumer/map']); 
        }
      },
      error: () => alert('Email ou senha incorretos.')
    });
  }

  register(userData: any) {
    this.http.post(`${this.baseUrl}/register`, userData).subscribe({
      next: (user: any) => {
        alert('✅ Conta criada com sucesso! Faça o login.');
        
        // CORREÇÃO 2: Como a tela de login e cadastro agora é a mesma (/auth),
        // a forma mais segura de voltar pro Login limpando o formulário é recarregando.
        window.location.reload(); 
      },
      error: () => alert('❌ Erro ao criar conta. Este email já pode estar em uso.')
    });
  }

  logout() {
    this.currentUser.set(null);
    this.router.navigate(['/auth']);
  }
}
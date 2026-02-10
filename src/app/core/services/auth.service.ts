import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // Guarda o usuário logado
  currentUser = signal<any>(null);

  // URL base do seu servidor (com o /api/auth)
  private baseUrl = 'https://mercadofacil-hrvh.onrender.com/api/auth';

  login(credentials: any) {
    // Chamando a rota correta: /api/auth/login
    this.http.post(`${this.baseUrl}/login`, credentials).subscribe({
      next: (user: any) => {
        this.currentUser.set(user);
        
        // Redireciona para o lugar certo dependendo do tipo de conta
        if (user.type === 'seller') {
          this.router.navigate(['/seller/dashboard']);
        } else {
          this.router.navigate(['/consumer']);
        }
      },
      error: () => {
        alert('Email ou senha incorretos. Tente novamente!');
      }
    });
  }

  register(userData: any) {
    // Chamando a rota correta: /api/auth/register (AQUI ESTAVA O ERRO 404)
    this.http.post(`${this.baseUrl}/register`, userData).subscribe({
      next: (user: any) => {
        alert('✅ Conta criada com sucesso! Agora você já pode fazer Login.');
        window.location.reload(); // Recarrega a página para limpar o formulário e ir pro Login
      },
      error: () => {
        alert('❌ Erro ao criar conta. Este email já pode estar em uso.');
      }
    });
  }

  logout() {
    this.currentUser.set(null);
    this.router.navigate(['/auth']);
  }
}
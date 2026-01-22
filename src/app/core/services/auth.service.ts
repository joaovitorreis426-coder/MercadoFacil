import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = 'http://localhost:3000/api'; 

  currentUser = signal<{ name: string; email: string; type: string } | null>(null);

  // Função de Login (Entrar)
  login(credentials: { email: string; password: string; type: string }) {
    this.http.post<any>(`${this.apiUrl}/login`, credentials).subscribe({
      next: (response) => {
        this.handleAuthSuccess(response.user);
      },
      error: (err) => {
        alert('Login falhou: ' + (err.error.message || 'Erro no servidor'));
      }
    });
  }

  // NOVA: Função de Registro (Criar Conta)
  register(userData: { name: string; email: string; password: string; type: string }) {
    this.http.post<any>(`${this.apiUrl}/register`, userData).subscribe({
      next: (response) => {
        alert('Conta criada com sucesso! Entrando...');
        this.handleAuthSuccess(response.user);
      },
      error: (err) => {
        alert('Erro ao criar conta: ' + (err.error.message || 'Tente novamente'));
      }
    });
  }

  // Lógica comum de sucesso (salvar estado e redirecionar)
  private handleAuthSuccess(user: any) {
    this.currentUser.set(user);
    if (user.type === 'seller') {
      this.router.navigate(['/seller/dashboard']);
    } else {
      this.router.navigate(['/consumer/map']);
    }
  }

  logout() {
    this.currentUser.set(null);
    this.router.navigate(['/auth']);
  }
}
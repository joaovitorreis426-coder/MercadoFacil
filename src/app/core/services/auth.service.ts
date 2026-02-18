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

  // AQUI ESTÁ O SEGREDO: A URL base agora tem o /auth no final
  private baseUrl = 'https://mercadofacil-hrvh.onrender.com/api/auth';

  login(credentials: any) {
    this.http.post(`${this.baseUrl}/login`, credentials).subscribe({
      next: (user: any) => {
        this.currentUser.set(user);
        if (user.type === 'seller') this.router.navigate(['/seller/dashboard']);
        else this.router.navigate(['/consumer']);
      },
      error: () => alert('Email ou senha incorretos.')
    });
  }

  register(userData: any) {
    // Agora ele vai juntar o baseUrl com /register, formando o link certinho!
    this.http.post(`${this.baseUrl}/register`, userData).subscribe({
      next: (user: any) => {
        alert('✅ Conta criada com sucesso! Faça o login.');
        this.router.navigate(['/login']);
      },
      error: () => alert('❌ Erro ao criar conta. Este email já pode estar em uso.')
    });
  }

  logout() {
    this.currentUser.set(null);
    this.router.navigate(['/auth']);
  }
}
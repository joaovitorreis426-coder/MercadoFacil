import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule, User, Mail, Lock, Store, ShoppingBag, ArrowRight } from 'lucide-angular';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div class="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 class="mt-6 text-3xl font-extrabold text-slate-900">Criar uma nova conta</h2>
        <p class="mt-2 text-sm text-slate-600">
          Ou <a routerLink="/login" class="font-medium text-blue-600 hover:text-blue-500">entre na sua conta existente</a>
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-in slide-in-from-bottom-4">
        <div class="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">
          <form class="space-y-6" (ngSubmit)="onSubmit()">
            
            <div class="grid grid-cols-2 gap-4 mb-6">
              <button type="button" (click)="user.type = 'consumer'" 
                [class.bg-blue-50]="user.type === 'consumer'" [class.border-blue-500]="user.type === 'consumer'"
                class="flex flex-col items-center p-4 border-2 rounded-xl transition-all hover:border-blue-300">
                <lucide-icon [img]="ShoppingBagIcon" [class.text-blue-600]="user.type === 'consumer'" class="w-6 h-6 mb-2 text-slate-400"></lucide-icon>
                <span class="text-sm font-bold" [class.text-blue-700]="user.type === 'consumer'">Consumidor</span>
              </button>
              
              <button type="button" (click)="user.type = 'seller'"
                [class.bg-blue-50]="user.type === 'seller'" [class.border-blue-500]="user.type === 'seller'"
                class="flex flex-col items-center p-4 border-2 rounded-xl transition-all hover:border-blue-300">
                <lucide-icon [img]="StoreIcon" [class.text-blue-600]="user.type === 'seller'" class="w-6 h-6 mb-2 text-slate-400"></lucide-icon>
                <span class="text-sm font-bold" [class.text-blue-700]="user.type === 'seller'">Vendedor</span>
              </button>
            </div>

            <div>
              <label class="block text-sm font-bold text-slate-700 mb-1">Nome Completo</label>
              <div class="relative">
                <input type="text" [(ngModel)]="user.name" name="name" required placeholder="Digite o seu nome" class="w-full border-2 border-slate-200 rounded-xl px-4 py-3 pl-11 outline-none focus:border-blue-500 transition-colors">
                <lucide-icon [img]="UserIcon" class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5"></lucide-icon>
              </div>
            </div>

            <div>
              <label class="block text-sm font-bold text-slate-700 mb-1">E-mail</label>
              <div class="relative">
                <input type="email" [(ngModel)]="user.email" name="email" required placeholder="seu@email.com" class="w-full border-2 border-slate-200 rounded-xl px-4 py-3 pl-11 outline-none focus:border-blue-500 transition-colors">
                <lucide-icon [img]="MailIcon" class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5"></lucide-icon>
              </div>
            </div>

            <div>
              <label class="block text-sm font-bold text-slate-700 mb-1">Senha</label>
              <div class="relative">
                <input type="password" [(ngModel)]="user.password" name="password" required placeholder="Crie uma senha forte" class="w-full border-2 border-slate-200 rounded-xl px-4 py-3 pl-11 outline-none focus:border-blue-500 transition-colors">
                <lucide-icon [img]="LockIcon" class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5"></lucide-icon>
              </div>
            </div>

            <button type="submit" [disabled]="isLoading" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-transform active:scale-95 flex justify-center items-center gap-2">
              @if(isLoading) {
                <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              } @else {
                Criar Minha Conta <lucide-icon [img]="ArrowRightIcon" class="w-5 h-5"></lucide-icon>
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  `
})
// IMPORTANTE: O nome da classe é exatamente o que a Vercel está à procura!
export class RegisterComponent {
  private http = inject(HttpClient);
  private router = inject(Router);

  readonly UserIcon = User;
  readonly MailIcon = Mail;
  readonly LockIcon = Lock;
  readonly StoreIcon = Store;
  readonly ShoppingBagIcon = ShoppingBag;
  readonly ArrowRightIcon = ArrowRight;

  isLoading = false;
  
  user = {
    name: '',
    email: '',
    password: '',
    type: 'consumer' // Consumidor vem marcado por padrão
  };

  onSubmit() {
    if (!this.user.name || !this.user.email || !this.user.password) {
      return alert('⚠️ Preencha todos os campos!');
    }

    this.isLoading = true;
    
    // Chama a API do Render para criar o utilizador
    this.http.post('https://mercadofacil-hrvh.onrender.com/api/auth/register', this.user).subscribe({
      next: () => {
        alert('✅ Conta criada com sucesso! Pode fazer o login.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        alert('❌ Erro ao criar conta. O e-mail já existe?');
        this.isLoading = false;
      }
    });
  }
}
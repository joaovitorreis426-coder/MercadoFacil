import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ButtonComponent } from '../../shared/ui/button/button.component';
// Importamos os ícones do olho
import { LucideAngularModule, Eye, EyeOff } from 'lucide-angular';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {{ isLogin ? 'Entrar na sua conta' : 'Criar nova conta' }}
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Ou
          <button (click)="toggleMode()" class="font-medium text-indigo-600 hover:text-indigo-500 bg-transparent border-none cursor-pointer">
            {{ isLogin ? 'cadastre-se gratuitamente' : 'faça login na sua conta' }}
          </button>
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          
          <form class="space-y-6" (ngSubmit)="onSubmit()">
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                {{ isLogin ? 'Entrar como:' : 'Quero ser:' }}
              </label>
              <div class="flex gap-4">
                <label class="flex items-center space-x-2 cursor-pointer p-2 border rounded hover:bg-gray-50 transition flex-1">
                  <input type="radio" name="type" value="consumer" [(ngModel)]="formData.type" class="text-indigo-600 focus:ring-indigo-500">
                  <span class="text-sm text-gray-700 font-medium">Consumidor</span>
                </label>
                <label class="flex items-center space-x-2 cursor-pointer p-2 border rounded hover:bg-gray-50 transition flex-1">
                  <input type="radio" name="type" value="seller" [(ngModel)]="formData.type" class="text-indigo-600 focus:ring-indigo-500">
                  <span class="text-sm text-gray-700 font-medium">Vendedor</span>
                </label>
              </div>
            </div>

            @if (!isLogin) {
              <div class="animate-in slide-in-from-top-2">
                <label class="block text-sm font-medium text-gray-700">Nome Completo</label>
                <div class="mt-1">
                  <input name="name" type="text" required [(ngModel)]="formData.name"
                    class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
                  />
                </div>
              </div>
            }

            <div>
              <label class="block text-sm font-medium text-gray-700">Email</label>
              <div class="mt-1">
                <input name="email" type="email" required [(ngModel)]="formData.email"
                  class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Senha</label>
              <div class="mt-1 relative">
                <input name="password" 
                  [type]="showPassword ? 'text' : 'password'" 
                  required 
                  [(ngModel)]="formData.password"
                  placeholder="Mínimo 8 caracteres"
                  class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pr-10 transition-all"
                />
                
                <button type="button" (click)="togglePassword()" 
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-indigo-600 cursor-pointer bg-transparent border-none">
                  <lucide-icon [img]="showPassword ? EyeOffIcon : EyeIcon" class="w-5 h-5"></lucide-icon>
                </button>
              </div>
              @if (!isLogin && formData.password && formData.password.length <= 7) {
                <p class="text-xs text-red-500 mt-1">A senha precisa ter pelo menos 8 caracteres.</p>
              }
            </div>

            <div>
              <app-button type="submit" className="w-full flex justify-center bg-indigo-600 hover:bg-indigo-700 text-white py-3" [disabled]="isLoading">
                {{ isLogin ? 'Acessar Sistema' : 'Criar Conta Grátis' }}
              </app-button>
            </div>

          </form>

        </div>
      </div>
    </div>
  `
})
export class AuthPageComponent {
  private authService = inject(AuthService);
  
  // Ícones
  readonly EyeIcon = Eye;
  readonly EyeOffIcon = EyeOff;

  isLoading = false;
  isLogin = true;
  showPassword = false; // Controle se mostra a senha ou não

  formData = {
    name: '',
    email: '',
    password: '',
    type: 'consumer'
  };

  toggleMode() {
    this.isLogin = !this.isLogin;
    this.formData = { name: '', email: '', password: '', type: 'consumer' };
    this.showPassword = false; // Reseta o olho ao trocar de aba
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    // VALIDAÇÃO NO FRONTEND
    if (!this.isLogin && this.formData.password.length <= 7) {
      alert('Sua senha é muito curta! Use pelo menos 8 caracteres.');
      return;
    }

    this.isLoading = true;
    
    setTimeout(() => {
      if (this.isLogin) {
        this.authService.login({ 
          email: this.formData.email, 
          password: this.formData.password,
          type: this.formData.type 
        });
      } else {
        this.authService.register({
          name: this.formData.name,
          email: this.formData.email,
          password: this.formData.password,
          type: this.formData.type
        });
      }
      this.isLoading = false;
    }, 500);
  }
}
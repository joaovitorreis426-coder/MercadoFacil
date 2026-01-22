import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ButtonComponent } from '../../shared/ui/button/button.component';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      
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
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input type="radio" name="type" value="consumer" [(ngModel)]="formData.type" class="text-indigo-600 focus:ring-indigo-500">
                  <span class="text-sm text-gray-700">Consumidor</span>
                </label>
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input type="radio" name="type" value="seller" [(ngModel)]="formData.type" class="text-indigo-600 focus:ring-indigo-500">
                  <span class="text-sm text-gray-700">Vendedor</span>
                </label>
              </div>
            </div>

            @if (!isLogin) {
              <div>
                <label class="block text-sm font-medium text-gray-700">Nome Completo</label>
                <div class="mt-1">
                  <input name="name" type="text" required [(ngModel)]="formData.name"
                    class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            }

            <div>
              <label class="block text-sm font-medium text-gray-700">Email</label>
              <div class="mt-1">
                <input name="email" type="email" required [(ngModel)]="formData.email"
                  class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Senha</label>
              <div class="mt-1">
                <input name="password" type="password" required [(ngModel)]="formData.password"
                  class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <app-button type="submit" className="w-full flex justify-center bg-indigo-600 hover:bg-indigo-700 text-white" [disabled]="isLoading">
                {{ isLogin ? 'Entrar' : 'Criar Conta' }}
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
  
  isLoading = false;
  isLogin = true;

  formData = {
    name: '',
    email: '',
    password: '',
    type: 'consumer'
    // Não tem mais storeName nem storeType aqui
  };

  toggleMode() {
    this.isLogin = !this.isLogin;
  }

  onSubmit() {
    this.isLoading = true;
    
    setTimeout(() => {
      if (this.isLogin) {
        // LOGIN
        this.authService.login({ 
          email: this.formData.email, 
          password: this.formData.password,
          type: this.formData.type 
        });
      } else {
        // REGISTRO (Simplificado)
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
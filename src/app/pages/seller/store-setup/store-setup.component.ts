import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ButtonComponent } from '../../../shared/ui/button/button.component';

@Component({
  selector: 'app-store-setup',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 class="text-center text-3xl font-extrabold text-gray-900">Configurar sua Loja</h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Bem-vindo, {{ authService.currentUser()?.name }}! <br>
          Antes de começar a vender, precisamos de alguns detalhes.
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          
          <div class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700">Nome do Estabelecimento</label>
              <input type="text" [(ngModel)]="storeName" placeholder="Ex: Padaria Pão Quente"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Categoria</label>
              <select [(ngModel)]="storeType"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm outline-none bg-white focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <option value="" disabled selected>Selecione...</option>
                <option value="Padaria">Padaria</option>
                <option value="Mercado">Mercado/Mercearia</option>
                <option value="Hortifruti">Hortifruti</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            <app-button (click)="saveStore()" className="w-full justify-center bg-indigo-600 text-white">
              Concluir Configuração
            </app-button>
          </div>

        </div>
      </div>
    </div>
  `
})
export class StoreSetupComponent {
  authService = inject(AuthService); // Para pegar o email do usuário logado
  private http = inject(HttpClient);
  private router = inject(Router);

  storeName = '';
  storeType = '';

  saveStore() {
    if (!this.storeName || !this.storeType) {
      alert('Preencha todos os campos!');
      return;
    }

    const email = this.authService.currentUser()?.email;

    this.http.put('https://mercadofacil-hrvh.onrender.com/api/user/setup-store', {
      email: email,
      storeName: this.storeName,
      storeType: this.storeType
    }).subscribe({
      next: (res: any) => {
        // Atualiza o usuário localmente com os novos dados
        this.authService.currentUser.set(res.user);
        
        // Agora sim, manda para o Dashboard
        this.router.navigate(['/seller/dashboard']);
      },
      error: (err) => alert('Erro ao salvar.')
    });
  }
}
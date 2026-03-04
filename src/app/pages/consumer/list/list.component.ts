import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule, Search, ShoppingBasket, Trash2, Save, BarChart2, Plus } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-consumer-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-50 pb-24">
      <header class="bg-blue-600 text-white p-6 rounded-b-3xl shadow-lg">
        <h1 class="text-2xl font-black mb-4">Minha Lista</h1>
        <div class="relative">
          <input type="text" [(ngModel)]="searchQuery" (keyup.enter)="searchProduct()" 
            placeholder="Buscar produto (ex: Arroz)..." 
            class="w-full p-4 rounded-2xl text-slate-800 outline-none shadow-inner">
          <button (click)="searchProduct()" class="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-500 p-2 rounded-xl">
            <lucide-icon [img]="SearchIcon" class="w-5 h-5"></lucide-icon>
          </button>
        </div>
      </header>

      <main class="p-4 max-w-2xl mx-auto">
        @if (searchResults.length > 0) {
          <div class="mb-8 animate-in fade-in">
            <h2 class="text-sm font-bold text-slate-400 uppercase mb-3">Encontrados</h2>
            <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              @for (item of searchResults; track item.gtin) {
                <div class="p-4 flex justify-between items-center border-b border-slate-50">
                  <div>
                    <p class="font-bold text-slate-800">{{ item.description }}</p>
                    <p class="text-xs text-slate-400">{{ item.brand?.name || 'Genérico' }}</p>
                  </div>
                  <button (click)="addToCart(item)" class="bg-blue-50 text-blue-600 p-2 rounded-lg hover:bg-blue-100">
                    <lucide-icon [img]="PlusIcon" class="w-5 h-5"></lucide-icon>
                  </button>
                </div>
              }
            </div>
          </div>
        }

        <h2 class="text-sm font-bold text-slate-400 uppercase mb-3">Minha Sacola ({{ cart.length }})</h2>
        <div class="space-y-3">
          @for (product of cart; track $index) {
            <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
              <div class="flex items-center gap-3">
                <div class="bg-slate-100 p-2 rounded-lg text-slate-400">
                  <lucide-icon [img]="ShoppingBasketIcon" class="w-5 h-5"></lucide-icon>
                </div>
                <p class="font-bold text-slate-700">{{ product.name }}</p>
              </div>
              <button (click)="removeFromCart($index)" class="text-red-400 hover:text-red-600">
                <lucide-icon [img]="Trash2Icon" class="w-5 h-5"></lucide-icon>
              </button>
            </div>
          } @empty {
            <div class="text-center py-10 opacity-40">
              <lucide-icon [img]="ShoppingBasketIcon" class="w-12 h-12 mx-auto mb-2"></lucide-icon>
              <p>Sua lista está vazia</p>
            </div>
          }
        </div>
      </main>

      @if (cart.length > 0) {
        <div class="fixed bottom-0 left-0 w-full p-4 bg-white/80 backdrop-blur-md border-t border-slate-100 flex gap-3">
          <button (click)="saveList()" class="flex-1 bg-slate-100 text-slate-700 font-bold py-4 rounded-2xl flex items-center justify-center gap-2">
            <lucide-icon [img]="SaveIcon" class="w-5 h-5"></lucide-icon> Salvar
          </button>
          
          <button (click)="goToRanking()" class="flex-[2] bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2">
            <lucide-icon [img]="BarChart2Icon" class="w-5 h-5"></lucide-icon> Comparar Preços
          </button>
        </div>
      }
    </div>
  `
})
export class ConsumerListComponent {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private router = inject(Router);

  // Ícones
  readonly SearchIcon = Search; readonly ShoppingBasketIcon = ShoppingBasket; 
  readonly Trash2Icon = Trash2; readonly PlusIcon = Plus;
  readonly SaveIcon = Save; readonly BarChart2Icon = BarChart2;

  searchQuery = '';
  searchResults: any[] = [];
  cart: any[] = [];

  // 1. Busca produtos na Bluesoft (API Real)
  searchProduct() {
    if (this.searchQuery.length < 3) return;
    this.http.get<any[]>(`https://mercadofacil-hrvh.onrender.com/api/products/search?q=${this.searchQuery}`)
      .subscribe(data => this.searchResults = data);
  }

  addToCart(item: any) {
    this.cart.push({ gtin: item.gtin, name: item.description });
    this.searchResults = [];
    this.searchQuery = '';
    // Salva temporariamente no navegador para não perder ao dar refresh
    localStorage.setItem('my_shopping_list', JSON.stringify(this.cart));
  }

  removeFromCart(index: number) {
    this.cart.splice(index, 1);
    localStorage.setItem('my_shopping_list', JSON.stringify(this.cart));
  }

  // 2. Lógica para SALVAR no BANCO DE DADOS (SQLite)
  saveList() {
    const listName = prompt("Dê um nome para sua lista (ex: Compras da Semana):");
    if (!listName) return;

    const user = this.auth.currentUser();
    const payload = {
      userId: user.id,
      listName: listName,
      products: this.cart // Envia a lista completa de produtos
    };

    this.http.post('https://mercadofacil-hrvh.onrender.com/api/consumer/lists', payload)
      .subscribe({
        next: () => alert('⭐ Lista salva com sucesso nas "Minhas Listas"!'),
        error: () => alert('Erro ao salvar lista.')
      });
  }

  // 3. Vai para a tela de Ranking que criamos antes
  goToRanking() {
    this.router.navigate(['/consumer/ranking']);
  }
}
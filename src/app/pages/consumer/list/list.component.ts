import { Component, inject, OnInit } from '@angular/core';
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
        <div class="flex justify-between items-center mb-4">
          <h1 class="text-2xl font-black">Minha Lista</h1>
          <span class="text-xs bg-blue-500 px-3 py-1 rounded-full">Consumidor</span>
        </div>
        <div class="relative">
          <input type="text" [(ngModel)]="searchQuery" (keyup.enter)="searchProduct()" 
            placeholder="Buscar produto (ex: Arroz)..." 
            class="w-full p-4 rounded-2xl text-slate-800 outline-none shadow-inner border-none">
          <button (click)="searchProduct()" class="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-500 p-2 rounded-xl text-white">
            <lucide-icon [img]="SearchIcon" class="w-5 h-5"></lucide-icon>
          </button>
        </div>
      </header>

      <main class="p-4 max-w-2xl mx-auto">
        @if (searchResults.length > 0) {
          <div class="mb-8 animate-in slide-in-from-top-2">
            <h2 class="text-sm font-bold text-slate-400 uppercase mb-3">Encontrados no Catálogo</h2>
            <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              @for (item of searchResults; track item.gtin) {
                <div class="p-4 flex justify-between items-center border-b border-slate-50 last:border-none">
                  <div>
                    <p class="font-bold text-slate-800">{{ item.description }}</p>
                    <p class="text-[10px] text-slate-400 font-mono">GTIN: {{ item.gtin }}</p>
                  </div>
                  <button (click)="addToCart(item)" class="bg-blue-50 text-blue-600 p-2 rounded-xl hover:bg-blue-600 hover:text-white transition-all">
                    <lucide-icon [img]="PlusIcon" class="w-5 h-5"></lucide-icon>
                  </button>
                </div>
              }
            </div>
          </div>
        }

        <h2 class="text-sm font-bold text-slate-400 uppercase mb-3 tracking-widest">Itens na Sacola ({{ cart.length }})</h2>
        <div class="space-y-3">
          @for (product of cart; track $index) {
            <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
              <div class="flex items-center gap-3">
                <div class="bg-blue-50 p-2 rounded-xl text-blue-600">
                  <lucide-icon [img]="ShoppingBasketIcon" class="w-5 h-5"></lucide-icon>
                </div>
                <p class="font-bold text-slate-700">{{ product.name }}</p>
              </div>
              <button (click)="removeFromCart($index)" class="text-slate-300 hover:text-red-500 transition-colors">
                <lucide-icon [img]="Trash2Icon" class="w-5 h-5"></lucide-icon>
              </button>
            </div>
          } @empty {
            <div class="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-slate-200 opacity-60">
              <lucide-icon [img]="ShoppingBasketIcon" class="w-12 h-12 mx-auto mb-2 text-slate-300"></lucide-icon>
              <p class="font-medium text-slate-400">Sua lista está vazia</p>
            </div>
          }
        </div>
      </main>

      @if (cart.length > 0) {
        <div class="fixed bottom-0 left-0 w-full p-4 bg-white/90 backdrop-blur-md border-t border-slate-100 flex gap-3 z-20">
          <button (click)="saveList()" class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all">
            <lucide-icon [img]="SaveIcon" class="w-5 h-5"></lucide-icon> Salvar
          </button>
          
          <button (click)="goToRanking()" class="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition-all">
            <lucide-icon [img]="BarChart2Icon" class="w-5 h-5"></lucide-icon> Comparar Preços
          </button>
        </div>
      }
    </div>
  `
})
export class ConsumerListComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly SearchIcon = Search; readonly ShoppingBasketIcon = ShoppingBasket; 
  readonly Trash2Icon = Trash2; readonly PlusIcon = Plus;
  readonly SaveIcon = Save; readonly BarChart2Icon = BarChart2;

  searchQuery = '';
  searchResults: any[] = [];
  cart: any[] = [];

  ngOnInit() {
    // Carrega a lista salva no navegador para não perder ao atualizar a página
    const saved = localStorage.getItem('my_shopping_list');
    if (saved) this.cart = JSON.parse(saved);
  }

  searchProduct() {
    if (this.searchQuery.length < 3) return;
    this.http.get<any[]>(`https://mercadofacil-hrvh.onrender.com/api/products/search?q=${this.searchQuery}`)
      .subscribe(data => this.searchResults = data);
  }

  addToCart(item: any) {
    this.cart.push({ gtin: item.gtin, name: item.description });
    this.searchResults = [];
    this.searchQuery = '';
    localStorage.setItem('my_shopping_list', JSON.stringify(this.cart));
  }

  removeFromCart(index: number) {
    this.cart.splice(index, 1);
    localStorage.setItem('my_shopping_list', JSON.stringify(this.cart));
  }

  saveList() {
    const user = this.auth.currentUser();
    
    if (!user || !user.id) {
      alert("Sessão expirada. Por favor, faça login novamente.");
      this.router.navigate(['/login']);
      return;
    }

    const listName = prompt("Como deseja nomear esta lista?");
    if (!listName) return;

    const payload = {
      userId: user.id,
      listName: listName,
      products: this.cart 
    };

    this.http.post('https://mercadofacil-hrvh.onrender.com/api/consumer/lists', payload)
      .subscribe({
        next: () => alert('✅ Lista salva com sucesso!'),
        error: (err) => {
          console.error("Erro ao salvar:", err);
          alert('Houve um erro no servidor ao tentar salvar a lista.');
        }
      });
  }

  goToRanking() {
    // Antes de ir, garante que a lista está no localStorage para o componente de ranking ler
    localStorage.setItem('my_shopping_list', JSON.stringify(this.cart));
    this.router.navigate(['/consumer/ranking']);
  }
}
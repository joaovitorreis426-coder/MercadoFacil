import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
// Importação correta dos ícones (sem nomes quebrados)
import { LucideAngularModule, Map, ShoppingCart, Search, Trash2, TrendingDown, Plus } from 'lucide-angular';
import { ButtonComponent } from '../../../shared/ui/button/button.component';

@Component({
  selector: 'app-consumer-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule, ButtonComponent],
  template: `
    <div class="min-h-screen bg-gray-50 pb-20">
      
      <header class="bg-white shadow-sm sticky top-0 z-10">
        <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 class="text-xl font-bold text-gray-800 flex items-center gap-2">
            <lucide-icon [img]="CartIcon" class="text-indigo-600"></lucide-icon>
            Comparador de Preços
          </h1>
          <a routerLink="/consumer/map" class="text-sm font-medium text-indigo-600 flex items-center gap-1">
            <lucide-icon [img]="MapIcon" class="w-4 h-4"></lucide-icon>
            Voltar
          </a>
        </div>
      </header>

      <main class="max-w-3xl mx-auto px-4 py-6 space-y-8">
        
        <div class="bg-white p-6 rounded-lg shadow-sm border">
          <h2 class="text-lg font-semibold mb-4">Monte sua Cesta Básica</h2>
          
          <div class="flex gap-2 mb-4">
            <input type="text" [(ngModel)]="newItem" (keyup.enter)="addItem()" 
              placeholder="Digite um produto (ex: Arroz, Leite)"
              class="flex-1 border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500">
            <app-button (click)="addItem()" className="bg-indigo-600 text-white">
              <lucide-icon [img]="PlusIcon" class="w-4 h-4"></lucide-icon>
            </app-button>
          </div>

          @if (shoppingList.length > 0) {
            <div class="flex flex-wrap gap-2 mb-6">
              @for (item of shoppingList; track $index) {
                <span class="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  {{ item }}
                  <button (click)="removeItem($index)" class="text-indigo-400 hover:text-red-500">
                    <lucide-icon [img]="TrashIcon" class="w-3 h-3"></lucide-icon>
                  </button>
                </span>
              }
            </div>

            <app-button (click)="comparePrices()" className="w-full justify-center bg-green-600 hover:bg-green-700 text-white gap-2">
              <lucide-icon [img]="SearchIcon" class="w-4 h-4"></lucide-icon>
              Comparar Preços nos Mercados
            </app-button>
          } @else {
            <p class="text-gray-400 text-sm text-center italic">Adicione itens para ver onde é mais barato.</p>
          }
        </div>

        @if (ranking.length > 0) {
          <div class="space-y-4 animate-in slide-in-from-bottom-4">
            <h3 class="font-bold text-gray-700 flex items-center gap-2">
              <lucide-icon [img]="TrendingIcon" class="text-green-600"></lucide-icon>
              Ranking: Onde comprar mais barato?
            </h3>

            @for (result of ranking; track $index) {
              <div class="bg-white p-4 rounded-lg shadow-sm border border-l-4"
                   [class.border-l-green-500]="$index === 0"
                   [class.border-l-gray-300]="$index > 0">
                
                <div class="flex justify-between items-start">
                  <div>
                    <h4 class="font-bold text-lg text-gray-800">{{ result.storeName }}</h4>
                    <p class="text-sm text-gray-500">{{ result.foundItems.length }} produtos encontrados</p>
                    
                    <div class="mt-2 text-xs text-gray-600 space-y-1">
                      @for (found of result.foundItems; track $index) {
                        <div>✓ {{ found }}</div>
                      }
                    </div>
                  </div>

                  <div class="text-right">
                    <span class="block text-xs text-gray-400">Total da Cesta</span>
                    <span class="text-2xl font-bold" 
                          [class.text-green-600]="$index === 0"
                          [class.text-gray-700]="$index > 0">
                      R$ {{ result.totalPrice.toFixed(2).replace('.', ',') }}
                    </span>
                    @if ($index === 0) {
                      <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full mt-1 inline-block">
                        Melhor Preço!
                      </span>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        }

      </main>
    </div>
  `
})
export class ConsumerListComponent {
  private http = inject(HttpClient);

  // Variáveis corrigidas (Sem espaços, sem acentos, nomes em inglês para o código)
  readonly MapIcon = Map;
  readonly CartIcon = ShoppingCart;
  readonly PlusIcon = Plus;
  readonly SearchIcon = Search; // Isso estava quebrado (SearMercado Fáciln)
  readonly TrashIcon = Trash2;
  readonly TrendingIcon = TrendingDown;

  newItem = '';
  shoppingList: string[] = [];
  ranking: any[] = [];

  addItem() {
    if (this.newItem.trim()) {
      this.shoppingList.push(this.newItem.trim());
      this.newItem = '';
    }
  }

  removeItem(index: number) {
    this.shoppingList.splice(index, 1);
  }

  comparePrices() {
    if (this.shoppingList.length === 0) return;

    this.http.post<any[]>('http://localhost:3000/api/compare', { shoppingList: this.shoppingList })
      .subscribe({
        next: (data) => {
          this.ranking = data;
          if (data.length === 0) {
            alert('Nenhum produto encontrado com esses nomes.');
          }
        },
        error: (err) => alert('Erro ao comparar preços.')
      });
  }
}
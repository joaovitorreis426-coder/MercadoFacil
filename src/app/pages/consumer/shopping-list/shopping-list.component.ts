import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Necessário para inputs
import { RouterLink } from '@angular/router';
import { LucideAngularModule, ArrowLeft, Plus, Trash2, ShoppingCart, TrendingDown, Store } from 'lucide-angular';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { CardComponent } from '../../../shared/ui/card/card.component';

interface CartItem {
  id: number;
  name: string;
  quantity: number;
}

@Component({
  selector: 'app-shopping-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule, ButtonComponent, CardComponent],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col">
      
      <header class="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div class="max-w-3xl mx-auto flex items-center gap-4">
          <app-button variant="ghost" size="icon" routerLink="/consumer/map">
            <lucide-icon [img]="ArrowLeftIcon"></lucide-icon>
          </app-button>
          <h1 class="text-xl font-bold flex items-center gap-2">
            <lucide-icon [img]="ShoppingCartIcon" class="h-6 w-6 text-indigo-600"></lucide-icon>
            Minha Lista
          </h1>
        </div>
      </header>

      <main class="flex-1 p-4 max-w-3xl mx-auto w-full space-y-6">
        
        <div class="flex gap-2">
          <input 
            type="text" 
            [(ngModel)]="newItemName" 
            (keyup.enter)="addItem()"
            placeholder="Ex: Arroz, Leite, Café..." 
            class="flex-1 h-10 px-4 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
          <app-button (click)="addItem()">
            <lucide-icon [img]="PlusIcon" class="h-4 w-4 mr-2"></lucide-icon>
            Adicionar
          </app-button>
        </div>

        @if (items.length > 0) {
          <div class="bg-white rounded-lg shadow-sm divide-y">
            @for (item of items; track item.id) {
              <div class="p-4 flex items-center justify-between group">
                <div class="flex items-center gap-4">
                  <div class="flex items-center border rounded-md">
                    <button (click)="updateQuantity(item.id, -1)" class="px-2 py-1 hover:bg-gray-100 text-gray-600">-</button>
                    <span class="w-8 text-center text-sm font-medium">{{ item.quantity }}</span>
                    <button (click)="updateQuantity(item.id, 1)" class="px-2 py-1 hover:bg-gray-100 text-gray-600">+</button>
                  </div>
                  <span class="font-medium text-gray-800">{{ item.name }}</span>
                </div>
                
                <button (click)="removeItem(item.id)" class="text-gray-400 hover:text-red-500 transition-colors">
                  <lucide-icon [img]="Trash2Icon" class="h-5 w-5"></lucide-icon>
                </button>
              </div>
            }
          </div>

          <app-button 
            className="w-full h-12 text-lg bg-green-600 hover:bg-green-700"
            (click)="comparePrices()">
            <lucide-icon [img]="TrendingDownIcon" class="mr-2"></lucide-icon>
            Comparar Preços
          </app-button>
        } @else {
          <div class="text-center py-12 text-gray-500">
            Sua lista está vazia. Adicione produtos para comparar preços.
          </div>
        }

        @if (showComparison) {
          <div class="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 class="text-lg font-bold mb-4">Melhores Ofertas Encontradas</h2>
            
            <div class="space-y-4">
              <app-card className="border-green-500 bg-green-50">
                <div class="flex justify-between items-start">
                  <div class="flex gap-3">
                    <div class="p-2 bg-white rounded-full shadow-sm h-fit">
                       <lucide-icon [img]="StoreIcon" class="h-6 w-6 text-green-600"></lucide-icon>
                    </div>
                    <div>
                      <h3 class="font-bold text-lg">Mercadinho do João</h3>
                      <p class="text-sm text-green-700 font-medium">Melhor Preço Total</p>
                      <p class="text-xs text-gray-500 mt-1">1.2 km de distância</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-2xl font-bold text-green-700">R$ 45,90</div>
                    <p class="text-xs text-gray-500">Economia de R$ 12,00</p>
                  </div>
                </div>
              </app-card>

              <app-card>
                <div class="flex justify-between items-start">
                  <div class="flex gap-3">
                    <div class="p-2 bg-gray-100 rounded-full h-fit">
                       <lucide-icon [img]="StoreIcon" class="h-6 w-6 text-gray-600"></lucide-icon>
                    </div>
                    <div>
                      <h3 class="font-bold text-lg">Supermercado Central</h3>
                      <p class="text-xs text-gray-500 mt-1">0.5 km de distância</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-2xl font-bold text-gray-800">R$ 57,90</div>
                  </div>
                </div>
              </app-card>
            </div>
          </div>
        }

      </main>
    </div>
  `
})
export class ShoppingListComponent {
  // Ícones
  readonly ArrowLeftIcon = ArrowLeft;
  readonly PlusIcon = Plus;
  readonly Trash2Icon = Trash2;
  readonly ShoppingCartIcon = ShoppingCart;
  readonly TrendingDownIcon = TrendingDown;
  readonly StoreIcon = Store;

  // Estado
  newItemName = '';
  items: CartItem[] = [
    { id: 1, name: 'Arroz 5kg', quantity: 1 },
    { id: 2, name: 'Feijão Carioca', quantity: 2 }
  ];
  showComparison = false;

  addItem() {
    if (!this.newItemName.trim()) return;
    
    this.items.push({
      id: Date.now(),
      name: this.newItemName,
      quantity: 1
    });
    this.newItemName = '';
    this.showComparison = false; // Esconde a comparação antiga se a lista mudou
  }

  removeItem(id: number) {
    this.items = this.items.filter(item => item.id !== id);
    this.showComparison = false;
  }

  updateQuantity(id: number, change: number) {
    const item = this.items.find(i => i.id === id);
    if (item) {
      const newQuantity = item.quantity + change;
      if (newQuantity > 0) {
        item.quantity = newQuantity;
      }
    }
  }

  comparePrices() {
    // Simula um loading ou chamada de API
    this.showComparison = true;
    
    // Num cenário real, aqui chamaríamos o backend Python enviando a lista de IDs:
    // this.http.post('api/compare', { items: this.items })...
  }
}
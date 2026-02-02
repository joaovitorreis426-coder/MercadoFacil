import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, MapPin, ShoppingCart, Search, Trash2, TrendingDown, Plus, Lightbulb, Store } from 'lucide-angular';
import { ButtonComponent } from '../../../shared/ui/button/button.component';

@Component({
  selector: 'app-consumer-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule, ButtonComponent],
  template: `
    <div class="min-h-screen bg-slate-50 pb-20 font-sans">
      
      <header class="bg-white shadow-md sticky top-0 z-10 border-b border-blue-100">
        <div class="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 class="text-xl font-bold text-slate-800 flex items-center gap-2">
            <div class="bg-blue-100 p-2 rounded-lg text-blue-600">
              <lucide-icon [img]="CartIcon" class="w-6 h-6"></lucide-icon>
            </div>
            Mercado Fácil
          </h1>
          <a routerLink="/consumer/map" class="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-3 py-2 rounded-full transition-colors">
            <lucide-icon [img]="MapIcon" class="w-4 h-4"></lucide-icon>
            Ver Mapa Completo
          </a>
        </div>
      </header>

      <main class="max-w-4xl mx-auto px-4 py-6 space-y-8">

        <section>
          <h2 class="text-lg font-bold text-slate-700 mb-3 flex items-center gap-2">
            <lucide-icon [img]="MapPinIcon" class="text-blue-500"></lucide-icon>
            Mercados Perto de Você
          </h2>
          
          @if (loadingLocation) {
            <div class="p-4 bg-blue-50 text-blue-600 rounded-xl border border-blue-200 animate-pulse flex items-center gap-2">
              <lucide-icon [img]="MapPinIcon" class="w-4 h-4"></lucide-icon>
              Buscando sua localização...
            </div>
          } @else if (nearbySellers.length > 0) {
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              @for (seller of nearbySellers; track $index) {
                <div class="bg-white p-4 rounded-xl border-l-4 border-l-blue-500 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div class="flex justify-between items-start">
                    <div>
                      <h3 class="font-bold text-slate-800">{{ seller.storeName }}</h3>
                      <span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full mt-1 inline-block">
                        {{ seller.storeType || 'Mercado' }}
                      </span>
                    </div>
                    <div class="text-right">
                      <span class="block text-lg font-bold text-blue-600">{{ seller.distanceFormatted }}</span>
                      <span class="text-xs text-gray-400">de distância</span>
                    </div>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="p-4 bg-yellow-50 text-yellow-700 rounded-xl border border-yellow-200 text-sm">
              Não conseguimos te localizar ou não há mercados cadastrados com endereço.
            </div>
          }
        </section>

        <hr class="border-gray-200">

        <section class="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
          <h2 class="text-lg font-bold text-slate-700 mb-2 flex items-center gap-2">
            <lucide-icon [img]="SearchIcon" class="text-blue-500"></lucide-icon>
            Comparar Preços
          </h2>
          <p class="text-xs text-slate-500 mb-4 flex items-center gap-1">
            <lucide-icon [img]="LightIcon" class="w-3 h-3 text-yellow-500"></lucide-icon>
            Dica: Digite itens separados por vírgula (Ex: Arroz, Feijão, Óleo)
          </p>
          
          <div class="flex gap-2 mb-4">
            <input type="text" 
              [(ngModel)]="newItem" 
              (input)="onType($event)"
              (keyup.enter)="addItem()" 
              list="product-suggestions"
              placeholder="Digite o nome do produto..."
              class="flex-1 border-2 border-blue-200 bg-slate-50 rounded-lg px-4 py-3 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-gray-400 text-gray-700 font-medium">
            
            <datalist id="product-suggestions">
              @for (suggestion of suggestions; track suggestion) {
                <option [value]="suggestion"></option>
              }
            </datalist>

            <app-button (click)="addItem()" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200">
              <lucide-icon [img]="PlusIcon" class="w-5 h-5"></lucide-icon>
            </app-button>
          </div>

          @if (shoppingList.length > 0) {
            <div class="flex flex-wrap gap-2 mb-6 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              @for (item of shoppingList; track $index) {
                <span class="bg-white border border-blue-200 text-blue-700 px-3 py-1.5 rounded-full text-sm flex items-center gap-2 shadow-sm animate-in fade-in zoom-in font-medium">
                  {{ item }}
                  <button (click)="removeItem($index)" class="text-blue-300 hover:text-red-500 transition-colors">
                    <lucide-icon [img]="TrashIcon" class="w-4 h-4"></lucide-icon>
                  </button>
                </span>
              }
            </div>

            <app-button (click)="comparePrices()" className="w-full justify-center bg-green-600 hover:bg-green-700 text-white gap-2 py-4 text-lg shadow-lg shadow-green-100">
              <lucide-icon [img]="SearchIcon" class="w-5 h-5"></lucide-icon>
              Buscar Melhor Preço
            </app-button>
          }
        </section>

        @if (ranking.length > 0) {
          <div class="space-y-4 animate-in slide-in-from-bottom-4">
            <h3 class="font-bold text-slate-700 flex items-center gap-2 text-lg">
              <lucide-icon [img]="TrendingIcon" class="text-green-600"></lucide-icon>
              Resultado da Economia
            </h3>

            @for (result of ranking; track $index) {
              <div class="bg-white p-5 rounded-xl shadow-sm border border-l-4 transition-transform hover:scale-[1.01]"
                   [class.border-l-green-500]="$index === 0"
                   [class.border-l-gray-300]="$index > 0"
                   [class.border-green-100]="$index === 0">
                
                <div class="flex justify-between items-start">
                  <div class="flex-1">
                    <h4 class="font-bold text-xl text-slate-800 flex items-center gap-2">
                      {{ result.storeName }}
                      @if ($index === 0) { 
                        <span class="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Campeão</span> 
                      }
                    </h4>
                    <p class="text-sm text-slate-500 mb-3">{{ result.foundItems.length }} produtos encontrados nesta loja</p>
                    
                    <div class="space-y-2 mt-4">
                      @for (found of result.foundItems; track $index) {
                        <div class="text-sm border-b border-gray-100 last:border-0 pb-2">
                          <div class="flex justify-between items-center">
                            <span class="font-medium text-slate-600">✓ {{ found.name }}</span>
                            <span class="font-bold text-slate-900">R$ {{ found.price }}</span>
                          </div>
                          @if (found.description) {
                            <p class="text-xs text-slate-400 italic mt-0.5">{{ found.description }}</p>
                          }
                        </div>
                      }
                    </div>
                  </div>
                  
                  <div class="text-right pl-6 border-l border-gray-100 ml-4">
                    <span class="block text-xs text-gray-400 uppercase tracking-wide">Total</span>
                    <span class="text-3xl font-extrabold" [class.text-green-600]="$index === 0" [class.text-slate-700]="$index > 0">
                      R$ {{ result.totalPrice.toFixed(2).replace('.', ',') }}
                    </span>
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
export class ConsumerListComponent implements OnInit {
  private http = inject(HttpClient);

  readonly MapIcon = MapPin;
  readonly MapPinIcon = MapPin;
  readonly CartIcon = ShoppingCart;
  readonly PlusIcon = Plus;
  readonly SearchIcon = Search;
  readonly TrashIcon = Trash2;
  readonly TrendingIcon = TrendingDown;
  readonly LightIcon = Lightbulb;
  readonly StoreIcon = Store;

  newItem = '';
  shoppingList: string[] = [];
  suggestions: string[] = [];
  ranking: any[] = [];
  
  // Variáveis para Geolocalização
  nearbySellers: any[] = [];
  loadingLocation = true;
  myLat: number | null = null;
  myLng: number | null = null;

  ngOnInit() {
    this.getUserLocation();
  }

  // 1. Pega GPS do Usuário
  getUserLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.myLat = position.coords.latitude;
          this.myLng = position.coords.longitude;
          this.fetchSellers();
        },
        (error) => {
          console.error("Erro GPS:", error);
          this.loadingLocation = false;
          // Se der erro, busca os vendedores mesmo assim, mas sem distância
          this.fetchSellers();
        }
      );
    } else {
      this.loadingLocation = false;
      this.fetchSellers();
    }
  }

  // 2. Busca Vendedores e Calcula Distância
  fetchSellers() {
    this.http.get<any[]>('http://localhost:3000/api/sellers').subscribe({
      next: (sellers) => {
        // Se temos a localização do usuário, calculamos a distância
        if (this.myLat && this.myLng) {
          this.nearbySellers = sellers.map(seller => {
            const dist = this.calculateDistance(this.myLat!, this.myLng!, seller.lat, seller.lng);
            return {
              ...seller,
              distance: dist,
              distanceFormatted: dist < 1 ? `${(dist * 1000).toFixed(0)}m` : `${dist.toFixed(1)}km`
            };
          });
          
          // Ordena do mais perto para o mais longe e pega os top 4
          this.nearbySellers.sort((a, b) => a.distance - b.distance);
          this.nearbySellers = this.nearbySellers.slice(0, 4);

        } else {
          // Sem GPS, só mostra a lista
          this.nearbySellers = sellers.slice(0, 4);
        }
        this.loadingLocation = false;
      },
      error: () => this.loadingLocation = false
    });
  }

  // Fórmula Matemática de Haversine (Calcula distância em KM entre dois pontos)
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    if (!lat2 || !lon2) return 9999; // Se o mercado não tem local, joga pro final
    const R = 6371; // Raio da Terra em km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // --- LÓGICA ANTIGA DO COMPARADOR ---

  onType(event: any) {
    const value = event.target.value;
    if (value.includes(',')) return;
    if (value.length > 2) {
      this.http.get<string[]>(`http://localhost:3000/api/products/search?q=${value}`)
        .subscribe(data => this.suggestions = data);
    }
  }

  addItem() {
    if (!this.newItem.trim()) return;
    if (this.newItem.includes(',')) {
      const items = this.newItem.split(',').map(item => item.trim()).filter(item => item !== '');
      this.shoppingList.push(...items);
    } else {
      this.shoppingList.push(this.newItem.trim());
    }
    this.newItem = '';
    this.suggestions = [];
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
          if (data.length === 0) alert('Nenhum produto encontrado nas lojas próximas.');
        },
        error: () => alert('Erro ao comparar.')
      });
  }
}
import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core'; // <-- 1. Adicionamos o ChangeDetectorRef aqui
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, MapPin, ShoppingCart, Search, Trash2, TrendingDown, Plus, Lightbulb, Store, Save } from 'lucide-angular';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { AuthService } from '../../../core/services/auth.service';

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

        @if (savedLists.length > 0) {
          <section class="animate-in fade-in slide-in-from-top-4">
            <div class="bg-gradient-to-r from-blue-50 to-slate-100 p-4 rounded-xl border border-blue-100 shadow-sm">
              <h3 class="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
                <lucide-icon [img]="SaveIcon" class="w-4 h-4"></lucide-icon>
                Minhas Listas Prontas
              </h3>
              
              <div class="flex gap-3 overflow-x-auto pb-2">
                @for (list of savedLists; track list.id) {
                  <div class="bg-white border border-blue-100 rounded-lg p-3 min-w-[160px] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      <span class="font-bold text-slate-800 text-sm block truncate">{{ list.name }}</span>
                      <span class="text-xs text-slate-500 mb-3 block">{{ list.items.length }} produtos</span>
                    </div>
                    <div class="flex gap-2 mt-2">
                      <button (click)="useSavedList(list)" class="flex-1 bg-blue-600 text-white font-bold text-xs py-1.5 rounded hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">
                        Usar Lista
                      </button>
                      <button (click)="deleteList(list.id)" class="bg-red-50 text-red-500 hover:text-white hover:bg-red-500 p-1.5 rounded border border-red-100 transition-colors">
                        <lucide-icon [img]="TrashIcon" class="w-3 h-3"></lucide-icon>
                      </button>
                    </div>
                  </div>
                }
              </div>
            </div>
          </section>
        }

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
            Nova Pesquisa de Preços
          </h2>
          
          <div class="flex gap-2 mb-4">
            <input type="text" 
              [(ngModel)]="newItem" 
              (input)="onType($event)"
              (keyup.enter)="addItem()" 
              list="product-suggestions"
              placeholder="Digite o nome do produto (ex: arroz)..."
              class="flex-1 border-2 border-blue-200 bg-slate-50 rounded-lg px-4 py-3 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all text-gray-700 font-medium">
            
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
            <div class="flex flex-wrap gap-2 mb-4 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              @for (item of shoppingList; track $index) {
                <span class="bg-white border border-blue-200 text-blue-700 px-3 py-1.5 rounded-full text-sm flex items-center gap-2 shadow-sm font-medium">
                  {{ item }}
                  <button (click)="removeItem($index)" class="text-blue-300 hover:text-red-500 transition-colors">
                    <lucide-icon [img]="TrashIcon" class="w-4 h-4"></lucide-icon>
                  </button>
                </span>
              }
            </div>

            <app-button (click)="comparePrices()" [disabled]="isSearching" className="w-full justify-center bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white gap-2 py-4 text-lg shadow-lg">
              <lucide-icon [img]="SearchIcon" class="w-5 h-5"></lucide-icon>
              {{ isSearching ? 'Buscando...' : 'Buscar Melhor Preço' }}
            </app-button>
          }
        </section>

        @if (isSearching) {
          <div class="mt-8 flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-sm border border-blue-100">
            <div class="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-4"></div>
            <p class="text-blue-800 font-bold text-lg">Procurando nas lojas...</p>
            <p class="text-sm text-slate-500">Acordando o servidor, aguarde uns segundos.</p>
          </div>
        }

        @if (!isSearching && searchDone && ranking.length === 0) {
          <div class="mt-8 p-8 bg-yellow-50 rounded-xl border border-yellow-200 text-center shadow-sm animate-in zoom-in">
            <h3 class="text-xl font-bold text-yellow-800 mb-2">Poxa, nenhum mercado encontrado! 😕</h3>
            <p class="text-yellow-700">
              Nenhum vendedor cadastrou os produtos da sua lista ainda ou eles estão com o nome diferente.<br>
              <b>Dica:</b> Entre na conta do Vendedor, crie um produto chamado exatamente igual ao que você buscou e certifique-se de que o Status dele é "Ativo".
            </p>
          </div>
        }

        @if (!isSearching && ranking.length > 0) {
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
                    
                    @if (result.distance !== null && result.distance !== undefined) {
                      <p class="text-sm font-medium text-blue-600 mt-1 flex items-center gap-1">
                        <lucide-icon [img]="MapPinIcon" class="w-4 h-4"></lucide-icon>
                        A {{ result.distance }} km de você
                      </p>
                    }
                    
                    <p class="text-sm text-slate-500 mb-3 mt-1">{{ result.foundItems.length }} produtos encontrados nesta loja</p>
                    
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
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef); // <-- 2. Injetamos a ferramenta para acordar a tela

  readonly MapIcon = MapPin;
  readonly MapPinIcon = MapPin;
  readonly CartIcon = ShoppingCart;
  readonly PlusIcon = Plus;
  readonly SearchIcon = Search;
  readonly TrashIcon = Trash2;
  readonly TrendingIcon = TrendingDown;
  readonly LightIcon = Lightbulb;
  readonly StoreIcon = Store;
  readonly SaveIcon = Save;

  newItem = '';
  shoppingList: string[] = [];
  suggestions: string[] = [];
  ranking: any[] = [];
  savedLists: any[] = [];
  
  isSearching = false;
  searchDone = false;
  
  nearbySellers: any[] = [];
  loadingLocation = true;
  myLat: number | null = null;
  myLng: number | null = null;

  ngOnInit() {
    this.getUserLocation();
    this.loadSavedLists();
  }

  getUserLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.myLat = position.coords.latitude;
          this.myLng = position.coords.longitude;
          this.fetchSellers();
        },
        () => {
          this.loadingLocation = false;
          this.fetchSellers();
          this.cdr.detectChanges(); // Acorda a tela
        }
      );
    } else {
      this.loadingLocation = false;
      this.fetchSellers();
    }
  }

  fetchSellers() {
    this.http.get<any[]>('https://mercadofacil-hrvh.onrender.com/api/sellers').subscribe({
      next: (sellers) => {
        if (this.myLat && this.myLng) {
          this.nearbySellers = sellers.map(seller => {
            const dist = this.calculateDistance(this.myLat!, this.myLng!, seller.lat, seller.lng);
            return {
              ...seller,
              distance: dist,
              distanceFormatted: dist < 1 ? `${(dist * 1000).toFixed(0)}m` : `${dist.toFixed(1)}km`
            };
          });
          this.nearbySellers.sort((a, b) => a.distance - b.distance);
          this.nearbySellers = this.nearbySellers.slice(0, 4);
        } else {
          this.nearbySellers = sellers.slice(0, 4);
        }
        this.loadingLocation = false;
        this.cdr.detectChanges(); // Acorda a tela
      },
      error: () => {
        this.loadingLocation = false;
        this.cdr.detectChanges();
      }
    });
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    if (!lat2 || !lon2) return 9999; 
    const R = 6371; 
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

  loadSavedLists() {
    const user = this.authService.currentUser();
    if (!user) return;
    this.http.get<any[]>(`https://mercadofacil-hrvh.onrender.com/api/lists?ownerId=${user.id}`).subscribe({
      next: (lists) => {
        this.savedLists = lists;
        this.cdr.detectChanges();
      }
    });
  }

  useSavedList(list: any) {
    this.shoppingList = list.items;
    this.searchDone = false; 
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      this.comparePrices(); 
    }, 100);
  }

  deleteList(id: number) {
    if (!confirm('Tem certeza que deseja apagar?')) return;
    this.http.delete(`https://mercadofacil-hrvh.onrender.com/api/lists/${id}`).subscribe({
      next: () => this.loadSavedLists()
    });
  }

  onType(event: any) {
    const value = event.target.value;
    if (value.includes(',')) return;
    if (value.length > 2) {
      this.http.get<string[]>(`https://mercadofacil-hrvh.onrender.com/api/products/search?q=${value}`)
        .subscribe(data => {
          this.suggestions = data;
          this.cdr.detectChanges();
        });
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
    this.searchDone = false;
  }

  removeItem(index: number) {
    this.shoppingList.splice(index, 1);
    this.searchDone = false;
  }

  comparePrices() {
    const itemNames = this.shoppingList;
    if (itemNames.length === 0) return;

    this.isSearching = true; 
    this.searchDone = false; 
    this.ranking = [];       

    this.sendCompareRequest(itemNames, this.myLat, this.myLng);

    setTimeout(() => {
      if (this.isSearching) {
        this.isSearching = false;
        alert("⚠️ O servidor demorou muito a acordar (mais de 1 minuto). Clique em Buscar novamente!");
        this.cdr.detectChanges(); // Acorda a tela
      }
    }, 60000);
  }

  sendCompareRequest(itemNames: string[], userLat: number | null, userLng: number | null) {
    this.http.post('https://mercadofacil-hrvh.onrender.com/api/compare', {
      shoppingList: itemNames,
      userLat: userLat,
      userLng: userLng
    }).subscribe({
      next: (results: any) => {
        this.ranking = results; 
        this.isSearching = false; 
        this.searchDone = true;   
        
        // 3. O GRANDE SEGREDO: Beliscamos a tela para ela desenhar o ranking instantaneamente!
        this.cdr.detectChanges(); 
      },
      error: () => {
        this.isSearching = false;
        this.cdr.detectChanges(); // Acorda a tela no erro também
        alert('❌ O Servidor falhou ou demorou muito para responder. Tente novamente.');
      }
    });
  }
}
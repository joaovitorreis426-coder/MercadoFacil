import { Component, inject, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, MapPin, ShoppingCart, Search, Trash2, TrendingDown, Plus, Save, List, Pencil, XCircle, Trophy, Navigation, ArrowLeft, Info } from 'lucide-angular';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-consumer-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule, ButtonComponent],
  template: `
    <div class="min-h-screen bg-slate-50 pb-20 font-sans">
      
      <header class="bg-white shadow-md sticky top-0 z-10 border-b border-blue-100">
        <div class="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div class="flex items-center gap-3">
            <a routerLink="/consumer/map" class="text-slate-400 hover:text-blue-600 transition-colors p-1 rounded-full hover:bg-blue-50" title="Voltar para o Mapa">
              <lucide-icon [img]="ArrowLeftIcon" class="w-6 h-6"></lucide-icon>
            </a>
            <h1 class="text-xl font-bold text-slate-800 flex items-center gap-2">Mercado Fácil</h1>
          </div>
          <div class="flex gap-2">
            <button (click)="resetForm()" [class.bg-blue-100]="viewMode === 'create'" class="p-2 rounded-full text-blue-600 hover:bg-blue-50 transition-colors"><lucide-icon [img]="PlusIcon" class="w-5 h-5"></lucide-icon></button>
            <button (click)="viewMode = 'saved'" [class.bg-blue-100]="viewMode === 'saved'" class="p-2 rounded-full text-blue-600 hover:bg-blue-50 transition-colors relative">
              <lucide-icon [img]="ListIcon" class="w-5 h-5"></lucide-icon>
              @if(savedLists.length > 0) { <span class="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full"></span> }
            </button>
          </div>
        </div>
      </header>

      <main class="max-w-6xl mx-auto px-4 py-6 space-y-6">

        @if (viewMode === 'saved') {
          <section class="animate-in fade-in">
             <h2 class="text-xl font-bold text-slate-700 mb-4 flex items-center gap-2">
               <lucide-icon [img]="ListIcon" class="text-blue-500"></lucide-icon> Minhas Listas Salvas
             </h2>
             
             @if (savedLists.length === 0) {
                <div class="text-center p-10 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">
                  Nenhuma lista salva.<br><button (click)="resetForm()" class="text-blue-600 font-bold underline mt-2">Criar agora</button>
                </div>
             }

             <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
               @for (list of savedLists; track list._id) {
                 <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 transition-all group relative">
                    <div class="absolute top-3 right-3 flex gap-2">
                      <button (click)="startEditing(list)" class="text-gray-400 hover:text-blue-600"><lucide-icon [img]="PencilIcon" class="w-4 h-4"></lucide-icon></button>
                      <button (click)="deleteList(list._id)" class="text-gray-400 hover:text-red-500"><lucide-icon [img]="TrashIcon" class="w-4 h-4"></lucide-icon></button>
                    </div>
                    <div class="flex items-center gap-2 mb-2">
                      <span class="text-[10px] font-bold uppercase px-2 py-1 rounded bg-blue-50 text-blue-600 border border-blue-100">{{ list.category }}</span>
                      <span class="text-[10px] font-bold uppercase px-2 py-1 rounded bg-gray-50 text-gray-600 border">{{ list.frequency }}</span>
                    </div>
                    <h3 class="font-bold text-lg text-slate-800">{{ list.name }}</h3>
                    <p class="text-sm text-slate-500 mb-4 truncate">{{ list.items.length }} itens: {{ list.items.join(', ') }}</p>
                    <app-button (click)="loadListToCompare(list)" className="w-full justify-center bg-blue-600 text-white text-sm">Usar no Comparador</app-button>
                 </div>
               }
             </div>
          </section>
        }

        @if (viewMode === 'create') {
          <section class="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-lg font-bold text-slate-700 flex items-center gap-2">
                @if (editingId) { <lucide-icon [img]="PencilIcon" class="text-orange-500"></lucide-icon> Editando } 
                @else { <lucide-icon [img]="SearchIcon" class="text-blue-500"></lucide-icon> Nova Lista }
              </h2>
              <div class="flex gap-2">
                @if (editingId) { <button (click)="resetForm()" class="text-sm bg-gray-100 px-3 py-1.5 rounded-lg font-bold hover:bg-gray-200">Cancelar</button> }
                @if (shoppingList.length > 0) {
                  <button (click)="saveListToDb()" class="text-sm px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 shadow-sm transition-transform active:scale-95" [class.bg-green-100]="!editingId" [class.text-green-700]="!editingId" [class.bg-orange-100]="editingId" [class.text-orange-800]="editingId">
                    <lucide-icon [img]="SaveIcon" class="w-4 h-4"></lucide-icon> {{ editingId ? 'Salvar' : 'Salvar Lista' }}
                  </button>
                }
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                    <label class="block text-xs font-bold text-slate-500 mb-1">Nome</label>
                    <input [(ngModel)]="currentListName" placeholder="Ex: Churrasco" class="w-full text-sm p-2 rounded border border-gray-300 outline-none focus:border-blue-500">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-500 mb-1">Categoria</label>
                    <select [(ngModel)]="currentCategory" class="w-full text-sm p-2 rounded border border-gray-300 outline-none focus:border-blue-500 bg-white">
                        @for (cat of categories; track cat) { <option [value]="cat">{{ cat }}</option> }
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-500 mb-1">Frequência</label>
                    <select [(ngModel)]="currentFrequency" class="w-full text-sm p-2 rounded border border-gray-300 outline-none focus:border-blue-500 bg-white">
                        <option value="Semanal">Semanal</option>
                        <option value="Mensal">Mensal</option>
                        <option value="Ocasional">Ocasional</option>
                    </select>
                </div>
            </div>

            <div class="flex gap-2 mb-1">
              <input type="text" [(ngModel)]="newItem" (input)="onType($event)" (keyup.enter)="addItem()" list="product-suggestions" placeholder="Digite o produto..." class="flex-1 border-2 border-blue-200 bg-white rounded-lg px-4 py-3 outline-none focus:border-blue-500 transition-all font-medium">
              <datalist id="product-suggestions">
                 @for (suggestion of suggestions; track suggestion) { <option [value]="suggestion"></option> }
              </datalist>
              <app-button (click)="addItem()" className="bg-blue-600 text-white shadow-lg"><lucide-icon [img]="PlusIcon" class="w-5 h-5"></lucide-icon></app-button>
            </div>

            <p class="text-[11px] text-slate-400 mb-4 pl-1 flex items-center gap-1">
              <lucide-icon [img]="InfoIcon" class="w-3 h-3"></lucide-icon> Dica: Digite vários produtos separados por vírgula (Ex: Arroz, Feijão, Açúcar)
            </p>

            @if (shoppingList.length > 0) {
              <div class="flex flex-wrap gap-2 mb-6 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                @for (item of shoppingList; track $index) {
                  <span class="bg-white border border-blue-200 text-blue-700 px-3 py-1.5 rounded-full text-sm flex items-center gap-2 shadow-sm font-medium animate-in fade-in zoom-in">
                    {{ item }} <button (click)="removeItem($index)" class="text-blue-300 hover:text-red-500"><lucide-icon [img]="TrashIcon" class="w-4 h-4"></lucide-icon></button>
                  </span>
                }
              </div>
              <app-button (click)="comparePrices()" className="w-full justify-center bg-green-600 hover:bg-green-700 text-white gap-2 py-4 text-lg shadow-lg shadow-green-100 transition-transform active:scale-95">
                @if(loadingLocation) { <span>Localizando você...</span> }
                @else { <lucide-icon [img]="SearchIcon" class="w-5 h-5"></lucide-icon> Comparar Preços Agora }
              </app-button>
            }
          </section>

          @if (ranking.length > 0) {
            <div class="animate-in slide-in-from-bottom-4 mt-8">
              <h3 class="font-bold text-slate-700 flex items-center gap-2 text-xl mb-4">
                <lucide-icon [img]="TrophyIcon" class="text-yellow-500"></lucide-icon> Top 4 Melhores Opções
              </h3>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                @for (result of ranking; track $index) {
                  <div class="bg-white rounded-2xl shadow-md overflow-hidden border-t-4 flex flex-col transition-transform hover:-translate-y-1"
                       [class.border-t-yellow-400]="$index === 0" 
                       [class.border-t-gray-300]="$index > 0"
                       [class.ring-2]="$index === 0" [class.ring-yellow-400]="$index === 0">
                    
                    <div class="p-4 bg-gray-50 border-b border-gray-100 text-center">
                      @if ($index === 0) { <span class="inline-block bg-yellow-100 text-yellow-800 text-xs font-extrabold px-3 py-1 rounded-full mb-2">CAMPEÃO 🏆</span> }
                      <h4 class="font-bold text-lg text-slate-800 leading-tight">{{ result.storeName }}</h4>
                      <div class="flex items-center justify-center gap-1 mt-2 text-sm text-blue-600 font-medium bg-blue-50 py-1 rounded">
                        <lucide-icon [img]="NavIcon" class="w-3 h-3"></lucide-icon> 
                        {{ result.distance !== null ? result.distance + ' km' : 'Distância n/a' }}
                      </div>
                    </div>

                    <div class="p-4 text-center border-b border-gray-100 bg-white">
                      <span class="block text-xs text-gray-400 uppercase">Total da Lista</span>
                      <span class="text-2xl font-extrabold" [class.text-green-600]="$index === 0" [class.text-slate-700]="$index > 0">
                        R$ {{ result.totalPrice.toFixed(2).replace('.', ',') }}
                      </span>
                    </div>

                    <div class="p-4 flex-1 bg-gray-50/50 pb-6">
                      <div class="flex justify-between items-center mb-2">
                        <span class="text-xs font-bold text-slate-500">ITENS ENCONTRADOS</span>
                        <span class="text-xs font-bold px-2 py-0.5 rounded-full" [class.bg-green-100]="$index === 0" [class.text-green-700]="$index === 0" [class.bg-gray-200]="$index > 0">{{ result.foundItems.length }} / {{ shoppingList.length }}</span>
                      </div>
                      <div class="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                        @for (found of result.foundItems; track $index) {
                          <div class="text-xs flex justify-between border-b border-gray-200 pb-1 last:border-0">
                            <span class="text-slate-600 truncate w-2/3">{{ found.name }}</span>
                            <span class="font-bold text-slate-800">R$ {{ found.price }}</span>
                          </div>
                        }
                      </div>
                    </div>
                    
                    </div>
                }
              </div>
            </div>
          }
        }
      </main>
    </div>
  `
})
export class ConsumerListComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private ngZone = inject(NgZone);

  readonly MapIcon=MapPin; readonly CartIcon=ShoppingCart; readonly PlusIcon=Plus; readonly SearchIcon=Search; readonly TrashIcon=Trash2; readonly TrendingIcon=TrendingDown; readonly SaveIcon=Save; readonly ListIcon=List; readonly PencilIcon=Pencil; readonly XIcon=XCircle; readonly TrophyIcon=Trophy; readonly NavIcon=Navigation; readonly ArrowLeftIcon=ArrowLeft; readonly InfoIcon=Info;

  categories = ['Mercearia', 'Hortifruti', 'Carnes', 'Frios', 'Bebidas', 'Limpeza', 'Higiene', 'Padaria', 'Outros'];
  viewMode: 'create' | 'saved' = 'create';
  
  editingId: number | null = null;
  currentListName = '';
  currentCategory = 'Mercearia';
  currentFrequency = 'Semanal';
  shoppingList: string[] = [];
  newItem = '';
  savedLists: any[] = [];
  suggestions: string[] = [];
  ranking: any[] = [];
  loadingLocation = false;

  ngOnInit() { this.fetchSavedLists(); }

  fetchSavedLists() {
    const user = this.authService.currentUser() as any;
    if (user) {
      this.http.get<any[]>(`https://mercadofacil-hrvh.onrender.com/api/lists?ownerId=${user._id}`).subscribe(lists => this.savedLists = lists);
    }
  }

  resetForm() { this.editingId = null; this.currentListName = ''; this.shoppingList = []; this.ranking = []; this.viewMode = 'create'; }
  startEditing(list: any) { this.editingId = list._id; this.currentListName = list.name; this.shoppingList = [...list.items]; this.ranking = []; this.viewMode = 'create'; }
  loadListToCompare(list: any) { this.resetForm(); this.shoppingList = [...list.items]; this.comparePrices(); }
  saveListToDb() {
    const user = this.authService.currentUser() as any; if (!user) return alert('Faça Login');
    const payload = { name: this.currentListName, category: this.currentCategory, frequency: this.currentFrequency, items: this.shoppingList, ownerId: user._id };
    const req = this.editingId ? this.http.put(`https://mercadofacil-hrvh.onrender.com/api/lists/${this.editingId}`, payload) : this.http.post('https://mercadofacil-hrvh.onrender.com/api/lists', payload);
    req.subscribe(() => { alert('Salvo!'); this.fetchSavedLists(); this.viewMode = 'saved'; });
  }
  deleteList(id: number) { if(confirm('Apagar?')) this.http.delete(`https://mercadofacil-hrvh.onrender.com/api/lists/${id}`).subscribe(() => this.fetchSavedLists()); }
  onType(event: any) { const v = event.target.value; if (v.length > 2) this.http.get<string[]>(`https://mercadofacil-hrvh.onrender.com/api/products/search?q=${v}`).subscribe(d => this.suggestions = d); }
  addItem() { if(this.newItem) { if(this.newItem.includes(',')) this.shoppingList.push(...this.newItem.split(',').map(i=>i.trim()).filter(i=>i)); else this.shoppingList.push(this.newItem.trim()); } this.newItem = ''; this.suggestions = []; }
  removeItem(i: number) { this.shoppingList.splice(i, 1); }

  comparePrices() {
    if (this.shoppingList.length === 0) return;
    this.loadingLocation = true;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => { this.ngZone.run(() => this.sendComparisonRequest(p.coords.latitude, p.coords.longitude)); },
        (e) => { console.warn(e); this.ngZone.run(() => this.sendComparisonRequest(null, null)); }
      );
    } else { this.sendComparisonRequest(null, null); }
  }

  sendComparisonRequest(lat: number | null, lng: number | null) {
    const payload = { shoppingList: this.shoppingList, userLat: lat, userLng: lng };
    this.http.post<any[]>('https://mercadofacil-hrvh.onrender.com/api/compare', payload).subscribe({
      next: (data) => { this.ranking = data; this.loadingLocation = false; if (data.length === 0) alert('Nenhum produto encontrado nas lojas.'); },
      error: () => { alert('Erro ao comparar.'); this.loadingLocation = false; }
    });
  }
}
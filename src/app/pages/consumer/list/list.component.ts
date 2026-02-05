import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, MapPin, ShoppingCart, Search, Trash2, TrendingDown, Plus, Lightbulb, Save, Calendar, Tag, List } from 'lucide-angular';
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
          <div class="flex gap-2">
            <button (click)="viewMode = 'create'" [class.bg-blue-100]="viewMode === 'create'" class="p-2 rounded-full text-blue-600 hover:bg-blue-50 transition-colors">
              <lucide-icon [img]="PlusIcon" class="w-5 h-5"></lucide-icon>
            </button>
            <button (click)="viewMode = 'saved'" [class.bg-blue-100]="viewMode === 'saved'" class="p-2 rounded-full text-blue-600 hover:bg-blue-50 transition-colors relative">
              <lucide-icon [img]="ListIcon" class="w-5 h-5"></lucide-icon>
              @if(savedLists.length > 0) { <span class="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full"></span> }
            </button>
          </div>
        </div>
      </header>

      <main class="max-w-4xl mx-auto px-4 py-6 space-y-6">

        @if (viewMode === 'saved') {
          <section class="animate-in fade-in">
            <h2 class="text-xl font-bold text-slate-700 mb-4 flex items-center gap-2">
              <lucide-icon [img]="ListIcon" class="text-blue-500"></lucide-icon> Minhas Listas Salvas
            </h2>

            @if (savedLists.length === 0) {
              <div class="text-center p-8 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">
                Você ainda não salvou nenhuma lista.
                <button (click)="viewMode = 'create'" class="text-blue-600 font-bold underline ml-1">Criar agora</button>
              </div>
            }

            <div class="grid gap-4 sm:grid-cols-2">
              @for (list of savedLists; track list._id) {
                <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 transition-all group relative">
                  <button (click)="deleteList(list._id)" class="absolute top-3 right-3 text-gray-300 hover:text-red-500">
                    <lucide-icon [img]="TrashIcon" class="w-4 h-4"></lucide-icon>
                  </button>

                  <div class="flex items-center gap-2 mb-2">
                    <span class="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded bg-blue-50 text-blue-600">{{ list.category }}</span>
                    <span class="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded" [class.bg-purple-50]="list.frequency === 'Mensal'" [class.text-purple-600]="list.frequency === 'Mensal'" [class.bg-green-50]="list.frequency === 'Semanal'" [class.text-green-600]="list.frequency === 'Semanal'">{{ list.frequency }}</span>
                  </div>
                  
                  <h3 class="font-bold text-lg text-slate-800">{{ list.name }}</h3>
                  <p class="text-sm text-slate-500 mb-4">{{ list.items.length }} itens cadastrados</p>

                  <app-button (click)="loadListToCompare(list)" className="w-full justify-center bg-blue-600 text-white text-sm">
                    Usar no Comparador
                  </app-button>
                </div>
              }
            </div>
          </section>
        }

        @if (viewMode === 'create') {
          <section class="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg font-bold text-slate-700 flex items-center gap-2">
                <lucide-icon [img]="SearchIcon" class="text-blue-500"></lucide-icon> Montar Lista
              </h2>
              @if (shoppingList.length > 0) {
                <button (click)="saveListToDb()" class="text-sm bg-green-100 text-green-700 px-3 py-1.5 rounded-lg font-bold hover:bg-green-200 flex items-center gap-1 transition-colors">
                  <lucide-icon [img]="SaveIcon" class="w-4 h-4"></lucide-icon> Salvar Lista
                </button>
              }
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div>
                <label class="block text-xs font-bold text-slate-500 mb-1">Nome da Lista</label>
                <input [(ngModel)]="currentListName" placeholder="Ex: Churrasco Fim de Ano" class="w-full text-sm p-2 rounded border border-gray-300 outline-none focus:border-blue-500">
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
            
            <div class="flex gap-2 mb-4">
              <input type="text" [(ngModel)]="newItem" (input)="onType($event)" (keyup.enter)="addItem()" list="product-suggestions" placeholder="Digite o produto..."
                class="flex-1 border-2 border-blue-200 bg-slate-50 rounded-lg px-4 py-3 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all font-medium">
              <datalist id="product-suggestions">
                @for (suggestion of suggestions; track suggestion) { <option [value]="suggestion"></option> }
              </datalist>
              <app-button (click)="addItem()" className="bg-blue-600 text-white shadow-lg shadow-blue-200"><lucide-icon [img]="PlusIcon" class="w-5 h-5"></lucide-icon></app-button>
            </div>

            @if (shoppingList.length > 0) {
              <div class="flex flex-wrap gap-2 mb-6 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                @for (item of shoppingList; track $index) {
                  <span class="bg-white border border-blue-200 text-blue-700 px-3 py-1.5 rounded-full text-sm flex items-center gap-2 shadow-sm animate-in fade-in zoom-in font-medium">
                    {{ item }} <button (click)="removeItem($index)" class="text-blue-300 hover:text-red-500"><lucide-icon [img]="TrashIcon" class="w-4 h-4"></lucide-icon></button>
                  </span>
                }
              </div>
              <app-button (click)="comparePrices()" className="w-full justify-center bg-green-600 hover:bg-green-700 text-white gap-2 py-4 text-lg shadow-lg shadow-green-100">
                <lucide-icon [img]="SearchIcon" class="w-5 h-5"></lucide-icon> Comparar Preços Agora
              </app-button>
            }
          </section>

          @if (ranking.length > 0) {
            <div class="space-y-4 animate-in slide-in-from-bottom-4">
              <h3 class="font-bold text-slate-700 flex items-center gap-2 text-lg"><lucide-icon [img]="TrendingIcon" class="text-green-600"></lucide-icon> Resultado</h3>
              @for (result of ranking; track $index) {
                <div class="bg-white p-5 rounded-xl shadow-sm border border-l-4 transition-transform hover:scale-[1.01]" [class.border-l-green-500]="$index === 0" [class.border-l-gray-300]="$index > 0">
                  <div class="flex justify-between items-start">
                    <div class="flex-1">
                      <h4 class="font-bold text-xl text-slate-800 flex items-center gap-2">
                        {{ result.storeName }}
                        @if ($index === 0) { <span class="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Campeão</span> }
                      </h4>
                      <p class="text-sm text-slate-500 mb-3">{{ result.foundItems.length }} produtos encontrados</p>
                      <div class="space-y-2 mt-4">
                        @for (found of result.foundItems; track $index) {
                          <div class="text-sm border-b border-gray-100 last:border-0 pb-2">
                            <div class="flex justify-between items-center"><span class="font-medium text-slate-600">✓ {{ found.name }}</span><span class="font-bold text-slate-900">R$ {{ found.price }}</span></div>
                          </div>
                        }
                      </div>
                    </div>
                    <div class="text-right pl-6 border-l border-gray-100 ml-4">
                      <span class="block text-xs text-gray-400 uppercase tracking-wide">Total</span>
                      <span class="text-3xl font-extrabold" [class.text-green-600]="$index === 0" [class.text-slate-700]="$index > 0">R$ {{ result.totalPrice.toFixed(2).replace('.', ',') }}</span>
                    </div>
                  </div>
                </div>
              }
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

  // Ícones
  readonly MapIcon=MapPin; readonly CartIcon=ShoppingCart; readonly PlusIcon=Plus; readonly SearchIcon=Search; readonly TrashIcon=Trash2; readonly TrendingIcon=TrendingDown; readonly LightIcon=Lightbulb; readonly SaveIcon=Save; readonly CalendarIcon=Calendar; readonly TagIcon=Tag; readonly ListIcon=List;

  // Categorias Completas
  categories = [
    'Mercearia Básica', 'Hortifruti', 'Carnes e Aves', 'Frios e Laticínios', 
    'Bebidas', 'Limpeza', 'Higiene Pessoal', 'Padaria', 
    'Matinais', 'Congelados', 'Pet Shop', 'Utilidades', 'Outros'
  ];

  viewMode: 'create' | 'saved' = 'create';
  
  // Dados da Lista Atual
  currentListName = '';
  currentCategory = 'Mercearia Básica';
  currentFrequency = 'Semanal';
  shoppingList: string[] = [];
  newItem = '';
  
  // Dados Gerais
  savedLists: any[] = [];
  suggestions: string[] = [];
  ranking: any[] = [];

  ngOnInit() {
    this.fetchSavedLists();
  }

  // --- LÓGICA DE LISTAS SALVAS ---

  fetchSavedLists() {
    const user = this.authService.currentUser() as any;
    if (user) {
      this.http.get<any[]>(`https://mercadofacil-hrvh.onrender.com/api/lists?ownerId=${user._id}`)
        .subscribe(lists => this.savedLists = lists);
    }
  }

  saveListToDb() {
    if (!this.currentListName) { alert('Dê um nome para sua lista!'); return; }
    const user = this.authService.currentUser() as any;
    if (!user) { alert('Faça login para salvar listas!'); return; }

    const payload = {
      name: this.currentListName,
      category: this.currentCategory,
      frequency: this.currentFrequency,
      items: this.shoppingList,
      ownerId: user._id
    };

    this.http.post('https://mercadofacil-hrvh.onrender.com/api/lists', payload).subscribe({
      next: () => {
        alert('Lista salva com sucesso!');
        this.fetchSavedLists();
        this.viewMode = 'saved'; // Leva o usuário para ver as listas salvas
      },
      error: () => alert('Erro ao salvar.')
    });
  }

  deleteList(id: number) {
    if(confirm('Tem certeza que deseja apagar esta lista?')) {
      this.http.delete(`https://mercadofacil-hrvh.onrender.com/api/lists/${id}`).subscribe(() => this.fetchSavedLists());
    }
  }

  loadListToCompare(list: any) {
    this.shoppingList = [...list.items]; // Carrega itens
    this.currentListName = list.name;
    this.currentCategory = list.category;
    this.currentFrequency = list.frequency;
    this.viewMode = 'create'; // Volta para a tela de comparação
    this.comparePrices(); // Já roda a comparação direto
  }

  // --- LÓGICA DE COMPARAÇÃO (Mantida) ---

  onType(event: any) {
    const value = event.target.value; if (value.includes(',')) return;
    if (value.length > 2) this.http.get<string[]>(`https://mercadofacil-hrvh.onrender.com/api/products/search?q=${value}`).subscribe(data => this.suggestions = data);
  }

  addItem() {
    if (!this.newItem.trim()) return;
    if (this.newItem.includes(',')) this.shoppingList.push(...this.newItem.split(',').map(i => i.trim()).filter(i => i !== ''));
    else this.shoppingList.push(this.newItem.trim());
    this.newItem = ''; this.suggestions = [];
  }

  removeItem(index: number) { this.shoppingList.splice(index, 1); }

  comparePrices() {
    if (this.shoppingList.length === 0) return;
    this.http.post<any[]>('https://mercadofacil-hrvh.onrender.com/api/compare', { shoppingList: this.shoppingList }).subscribe({
      next: (data) => { this.ranking = data; if (data.length === 0) alert('Nenhum produto encontrado nas lojas.'); },
      error: () => alert('Erro ao comparar.')
    });
  }
}
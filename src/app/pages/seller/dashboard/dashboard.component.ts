import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, LayoutDashboard, Package, LogOut, Plus, X, Pencil, Trash2, Settings, Store, MapPin, AlertTriangle, CheckCircle, XCircle, Filter } from 'lucide-angular';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-seller-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, ButtonComponent],
  template: `
    <div class="flex h-screen bg-gray-100 font-sans">
      
      <aside class="w-64 bg-slate-900 text-white hidden md:flex flex-col shadow-xl">
        <div class="p-6 border-b border-slate-800">
          <h1 class="text-xl font-bold flex items-center gap-2 text-indigo-400">
            <lucide-icon [img]="StoreIcon" class="h-6 w-6"></lucide-icon>
            Painel Loja
          </h1>
          <p class="text-xs text-slate-400 mt-1 truncate">{{ storeName || 'Configure sua loja' }}</p>
        </div>
        <nav class="flex-1 px-4 py-6 space-y-2">
          <button (click)="currentView = 'overview'" class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors" [class.bg-indigo-600]="currentView === 'overview'">
            <lucide-icon [img]="LayoutDashboardIcon" class="h-5 w-5"></lucide-icon> Visão Geral
          </button>
          <button (click)="goToProducts()" class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors" [class.bg-indigo-600]="currentView === 'products'">
            <lucide-icon [img]="PackageIcon" class="h-5 w-5"></lucide-icon> Produtos
          </button>
          <button (click)="currentView = 'settings'" class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors" [class.bg-indigo-600]="currentView === 'settings'">
            <lucide-icon [img]="SettingsIcon" class="h-5 w-5"></lucide-icon> Configurações
            @if (!hasStoreSettings) { <span class="w-2 h-2 bg-red-500 rounded-full animate-ping ml-2"></span> }
          </button>
        </nav>
        <div class="p-4 border-t border-slate-800 mt-auto">
          <button (click)="logout()" class="flex items-center gap-3 px-4 py-2 text-red-400 hover:text-red-300 w-full">Sair</button>
        </div>
      </aside>

      <main class="flex-1 overflow-y-auto bg-gray-50">
        <header class="bg-white shadow-sm h-16 flex items-center justify-between px-6 sticky top-0 z-10">
          <h2 class="text-lg font-semibold text-gray-800">
            @if(!hasStoreSettings) { <span class="text-red-500 flex items-center gap-2"><lucide-icon [img]="AlertIcon" class="w-4 h-4"></lucide-icon> Configuração Pendente</span> }
            @else { Painel do Vendedor }
          </h2>
          <div class="flex items-center gap-4 text-sm text-gray-500">Olá, {{ currentUserName }}</div>
        </header>

        <div class="p-6 lg:p-8 space-y-8">

          @if (currentView === 'overview') {
            <div class="grid gap-6 md:grid-cols-2 animate-in fade-in">
              <div (click)="filterBy('Ativo')" class="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md cursor-pointer transition-all group">
                <div class="flex justify-between items-start">
                  <div>
                    <p class="text-gray-500 mb-1">Produtos Ativos</p>
                    <h3 class="text-4xl font-bold text-green-600 group-hover:scale-105 transition-transform">{{ activeCount }}</h3>
                  </div>
                  <div class="bg-green-100 p-3 rounded-full text-green-600">
                    <lucide-icon [img]="CheckCircleIcon" class="w-6 h-6"></lucide-icon>
                  </div>
                </div>
                <p class="text-xs text-green-600 mt-4 font-medium">Clique para ver lista</p>
              </div>

              <div (click)="filterBy('Esgotado')" class="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md cursor-pointer transition-all group">
                <div class="flex justify-between items-start">
                  <div>
                    <p class="text-gray-500 mb-1">Produtos Esgotados</p>
                    <h3 class="text-4xl font-bold text-red-500 group-hover:scale-105 transition-transform">{{ esgotadoCount }}</h3>
                  </div>
                  <div class="bg-red-100 p-3 rounded-full text-red-500">
                    <lucide-icon [img]="XCircleIcon" class="w-6 h-6"></lucide-icon>
                  </div>
                </div>
                <p class="text-xs text-red-500 mt-4 font-medium">Clique para ver lista</p>
              </div>
            </div>
          }

          @if (currentView === 'products') {
            
            @if (!hasStoreSettings) {
              <div class="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg flex justify-between items-center animate-pulse">
                <div class="flex items-center gap-3">
                  <lucide-icon [img]="AlertIcon" class="text-red-500"></lucide-icon>
                  <div>
                    <h4 class="font-bold text-red-700">Ação Necessária</h4>
                    <p class="text-sm text-red-600">Configure o <b>Nome da Loja</b> e a <b>Localização</b> para liberar os produtos.</p>
                  </div>
                </div>
                <app-button (click)="currentView = 'settings'" className="bg-red-600 text-white text-sm">Ir para Configurações</app-button>
              </div>
            } @else {
              <div class="flex justify-between items-center mb-4">
                <div class="flex items-center gap-2">
                  @if (filterStatus) {
                    <span class="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      Filtrando por: <b>{{ filterStatus }}</b>
                      <button (click)="clearFilter()" class="hover:text-red-500"><lucide-icon [img]="XIcon" class="w-3 h-3"></lucide-icon></button>
                    </span>
                  }
                </div>
                <app-button (click)="openCreateForm()" className="bg-indigo-600 text-white gap-2">
                  <lucide-icon [img]="showForm ? XIcon : PlusIcon" class="h-4 w-4"></lucide-icon> Novo Produto
                </app-button>
              </div>
            }

            @if (showForm) {
              <div class="bg-white rounded-xl border p-6 shadow-lg mb-6 animate-in slide-in-from-top-4">
                <h3 class="text-lg font-bold mb-4">{{ isEditing ? 'Editar' : 'Novo' }} Produto</h3>
                <div class="grid gap-6 md:grid-cols-2">
                  
                  <div class="col-span-2 md:col-span-1">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                    <input type="text" [(ngModel)]="currentProduct.name" class="w-full border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500">
                  </div>
                  
                  <div class="col-span-2 md:col-span-1">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Preço (R$) *</label>
                    <input type="text" [ngModel]="currentProduct.price" (ngModelChange)="applyCurrencyMask($event)" placeholder="0,00" class="w-full border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500">
                  </div>

                  <div class="col-span-2 md:col-span-1">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
                    <select [(ngModel)]="currentProduct.category" class="w-full border-gray-300 rounded-lg p-2.5 bg-white outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="" disabled selected>Selecione...</option>
                      @for (cat of categoriesList; track cat) { <option [value]="cat">{{ cat }}</option> }
                    </select>
                  </div>

                  <div class="col-span-2 md:col-span-1">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select [(ngModel)]="currentProduct.status" class="w-full border-gray-300 rounded-lg p-2.5 bg-white">
                      <option value="Ativo">Ativo</option>
                      <option value="Esgotado">Esgotado</option>
                    </select>
                  </div>

                  <div class="col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                    <textarea [(ngModel)]="currentProduct.description" rows="2" placeholder="Ex: Marca X, 500g..." class="w-full border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
                  </div>

                </div>
                <div class="mt-6 flex justify-end">
                  <app-button (click)="saveProduct()" className="bg-green-600 text-white">Salvar</app-button>
                </div>
              </div>
            }

            <div class="bg-white rounded-xl border shadow-sm overflow-hidden">
              @if (filteredProducts.length > 0) {
                <table class="w-full text-sm text-left">
                  <thead class="bg-gray-50 text-gray-500"><tr><th class="p-4">Produto</th><th class="p-4">Categoria</th><th class="p-4">Status</th><th class="p-4">Preço</th><th class="p-4 text-right">Ações</th></tr></thead>
                  <tbody>
                    @for (product of filteredProducts; track product._id) {
                      <tr class="border-b hover:bg-gray-50">
                        <td class="p-4">
                          <div class="font-bold">{{ product.name }}</div>
                          <div class="text-xs text-gray-400">{{ product.description }}</div>
                        </td>
                        <td class="p-4"><span class="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">{{ product.category }}</span></td>
                        <td class="p-4">
                          <span class="px-2 py-1 rounded-full text-xs font-bold" [class.bg-green-100]="product.status === 'Ativo'" [class.text-green-700]="product.status === 'Ativo'" [class.bg-red-100]="product.status === 'Esgotado'" [class.text-red-700]="product.status === 'Esgotado'">{{ product.status }}</span>
                        </td>
                        <td class="p-4 font-bold text-gray-800">R$ {{ product.price }}</td>
                        <td class="p-4 text-right flex justify-end gap-2">
                          <button (click)="startEdit(product)" class="text-indigo-600"><lucide-icon [img]="PencilIcon" class="w-4 h-4"></lucide-icon></button>
                          <button (click)="deleteProduct(product._id)" class="text-red-600"><lucide-icon [img]="Trash2Icon" class="w-4 h-4"></lucide-icon></button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              } @else { <div class="p-8 text-center text-gray-400">Nenhum produto encontrado.</div> }
            </div>
          }

          @if (currentView === 'settings') {
            <div class="max-w-2xl bg-white rounded-xl shadow-sm border p-8 relative">
              <h3 class="text-xl font-bold mb-6">Configurações da Loja</h3>
              <div class="space-y-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Nome da Loja <span class="text-red-500">*</span></label>
                  <input type="text" [(ngModel)]="storeSettings.storeName" class="w-full border-gray-300 rounded-lg p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Ramo de Atividade</label>
                  <select [(ngModel)]="storeSettings.storeType" class="w-full border-gray-300 rounded-lg p-3 bg-gray-50">
                    <option value="Mercado">Mercado</option>
                    <option value="Padaria">Padaria</option>
                    <option value="Hortifruti">Hortifruti</option>
                    <option value="Açougue">Açougue</option>
                  </select>
                </div>
                <div class="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                  <h4 class="font-bold text-indigo-900 flex items-center gap-2">
                    <lucide-icon [img]="MapPinIcon" class="w-4 h-4"></lucide-icon> Localização <span class="text-red-500">*</span>
                  </h4>
                  <div class="flex items-center gap-3 mt-2">
                    <app-button (click)="getLocation()" className="bg-indigo-600 text-white text-xs">📍 Obter Localização Atual</app-button>
                    @if (storeSettings.lat) { <span class="text-xs text-green-600 font-bold flex items-center gap-1"><lucide-icon [img]="CheckCircleIcon" class="w-3 h-3"></lucide-icon> Localização Salva!</span> }
                  </div>
                </div>
                <div class="flex justify-end pt-4">
                  <app-button (click)="updateStoreSettings()" className="bg-green-600 text-white shadow-lg">Salvar Alterações</app-button>
                </div>
              </div>
            </div>
          }
        </div>
      </main>
    </div>
  `
})
export class SellerDashboardComponent implements OnInit {
  authService = inject(AuthService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  readonly LayoutDashboardIcon = LayoutDashboard; readonly StoreIcon = Store; readonly PackageIcon = Package; readonly SettingsIcon = Settings; readonly LogOutIcon = LogOut; readonly PlusIcon = Plus; readonly XIcon = X; readonly PencilIcon = Pencil; readonly Trash2Icon = Trash2; readonly MapPinIcon = MapPin; readonly AlertIcon = AlertTriangle; readonly CheckCircleIcon = CheckCircle; readonly XCircleIcon = XCircle; readonly FilterIcon = Filter;

  readonly categoriesList = ['Mercearia', 'Hortifruti', 'Padaria', 'Açougue e Frios', 'Bebidas', 'Laticínios', 'Limpeza', 'Higiene Pessoal', 'Matinais', 'Enlatados', 'Biscoitos', 'Massas', 'Congelados', 'Utilidades', 'Pet Shop'];

  currentView: 'overview' | 'products' | 'settings' = 'overview';
  products: any[] = [];
  filterStatus: string | null = null;
  currentUserName = '';
  storeName = '';
  showForm = false;
  isEditing = false;
  editingId: string | null = null;
  
  currentProduct = { name: '', price: '', status: 'Ativo', description: '', category: '' };
  storeSettings = { storeName: '', storeType: 'Mercado', lat: 0, lng: 0 };

  ngOnInit() { this.checkUserAndFetch(); }

  get activeCount() { return this.products.filter(p => p.status === 'Ativo').length; }
  get esgotadoCount() { return this.products.filter(p => p.status === 'Esgotado').length; }
  get hasStoreSettings() { return this.storeSettings.storeName && this.storeSettings.lat !== 0; }
  get filteredProducts() { return this.filterStatus ? this.products.filter(p => p.status === this.filterStatus) : this.products; }

  filterBy(status: string) { this.filterStatus = status; this.currentView = 'products'; }
  clearFilter() { this.filterStatus = null; }
  goToProducts() { this.currentView = 'products'; }

  applyCurrencyMask(value: string) {
    let onlyNumbers = value.replace(/\D/g, '');
    let numberValue = (parseInt(onlyNumbers) / 100).toFixed(2);
    if (isNaN(parseFloat(numberValue))) numberValue = "0.00";
    this.currentProduct.price = numberValue.replace('.', ',');
  }

  getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        this.storeSettings.lat = position.coords.latitude;
        this.storeSettings.lng = position.coords.longitude;
        alert('Localização capturada!');
      }, () => alert('Permita o acesso ao GPS no navegador!'));
    } else alert('Sem suporte a GPS');
  }

  checkUserAndFetch() {
    const user = this.authService.currentUser() as any;
    if (!user) { this.router.navigate(['/auth']); return; }
    this.currentUserName = user.name;
    this.storeName = user.storeName;
    this.storeSettings = { storeName: user.storeName, storeType: user.storeType || 'Mercado', lat: user.lat || 0, lng: user.lng || 0 };

    this.http.get<any[]>(`https://mercadofacil-hrvh.onrender.com/api/products?ownerId=${user._id}`).subscribe(data => {
      this.products = data;
      this.cdr.detectChanges();
    });
  }

  updateStoreSettings() {
    if (!this.storeSettings.storeName || !this.storeSettings.lat) { alert('Preencha Nome e Localização'); return; }
    const user = this.authService.currentUser();
    if (!user) return;
    this.http.put('https://mercadofacil-hrvh.onrender.com/api/user/update-profile', { email: user.email, ...this.storeSettings })
      .subscribe({
        next: (res: any) => { 
          alert('Salvo!'); 
          this.storeName = this.storeSettings.storeName; 
          this.authService.currentUser.set(res.user); 
          if(this.currentView === 'settings') this.currentView = 'overview';
        },
        error: (err) => alert('ERRO DO SERVIDOR: ' + JSON.stringify(err.error))
      });
  }

  saveProduct() {
    if (!this.currentProduct.name) { alert('Nome obrigatório'); return; }
    if (!this.currentProduct.category) { alert('Categoria obrigatória'); return; }
    const user = this.authService.currentUser() as any;
    const data = { ...this.currentProduct, ownerId: user._id };

    if (this.isEditing && this.editingId) {
      this.http.put(`https://mercadofacil-hrvh.onrender.com/api/products/${this.editingId}`, data).subscribe(() => this.resetForm());
    } else {
      this.http.post('https://mercadofacil-hrvh.onrender.com/api/products', data).subscribe(() => this.resetForm());
    }
  }

  startEdit(p: any) { this.isEditing=true; this.editingId=p._id; this.currentProduct={...p}; this.showForm=true; }
  deleteProduct(id: string) { if(confirm('Excluir?')) this.http.delete(`https://mercadofacil-hrvh.onrender.com/api/products/${id}`).subscribe(()=>this.checkUserAndFetch()); }
  resetForm() { this.showForm=false; this.currentProduct={name:'',price:'',status:'Ativo', description: '', category: ''}; this.checkUserAndFetch(); }
  openCreateForm() { this.showForm=!this.showForm; this.currentProduct={name:'',price:'',status:'Ativo', description: '', category: ''}; this.isEditing=false; }
  logout() { this.authService.logout(); }
}
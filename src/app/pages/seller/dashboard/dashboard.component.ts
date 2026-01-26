import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, LayoutDashboard, Package, LogOut, Plus, DollarSign, X, Save, Pencil, Trash2, Settings, Store, MapPin } from 'lucide-angular';
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
            Gestão Loja
          </h1>
          <p class="text-xs text-slate-400 mt-1 truncate">{{ storeName || 'Minha Loja' }}</p>
        </div>
        <nav class="flex-1 px-4 py-6 space-y-2">
          <button (click)="currentView = 'overview'" class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors" [class.bg-indigo-600]="currentView === 'overview'">
            <lucide-icon [img]="LayoutDashboardIcon" class="h-5 w-5"></lucide-icon> Visão Geral
          </button>
          <button (click)="currentView = 'products'" class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors" [class.bg-indigo-600]="currentView === 'products'">
            <lucide-icon [img]="PackageIcon" class="h-5 w-5"></lucide-icon> Produtos
          </button>
          <button (click)="currentView = 'settings'" class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors" [class.bg-indigo-600]="currentView === 'settings'">
            <lucide-icon [img]="SettingsIcon" class="h-5 w-5"></lucide-icon> Configurações
          </button>
        </nav>
        <div class="p-4 border-t border-slate-800 mt-auto">
          <button (click)="logout()" class="flex items-center gap-3 px-4 py-2 text-red-400 hover:text-red-300 w-full">Sair</button>
        </div>
      </aside>

      <main class="flex-1 overflow-y-auto bg-gray-50">
        <header class="bg-white shadow-sm h-16 flex items-center justify-between px-6 sticky top-0 z-10">
          <h2 class="text-lg font-semibold text-gray-800">Painel do Vendedor</h2>
          <div class="flex items-center gap-4 text-sm text-gray-500">Olá, {{ currentUserName }}</div>
        </header>

        <div class="p-6 lg:p-8 space-y-8">

          @if (currentView === 'overview') {
            <div class="grid gap-6 md:grid-cols-2 animate-in fade-in">
              <div class="bg-white p-6 rounded-xl shadow-sm border">
                <p class="text-gray-500">Total Produtos</p>
                <h3 class="text-3xl font-bold">{{ products.length }}</h3>
              </div>
              <div class="bg-white p-6 rounded-xl shadow-sm border">
                <p class="text-gray-500">Valor em Estoque</p>
                <h3 class="text-3xl font-bold text-green-600">R$ {{ totalValue.toFixed(2) }}</h3>
              </div>
            </div>
          }

          @if (currentView === 'products') {
            <div class="flex justify-end mb-4">
              <app-button (click)="openCreateForm()" className="bg-indigo-600 text-white gap-2">
                <lucide-icon [img]="showForm ? XIcon : PlusIcon" class="h-4 w-4"></lucide-icon> Novo Produto
              </app-button>
            </div>

            @if (showForm) {
              <div class="bg-white rounded-xl border p-6 shadow-lg mb-6 animate-in slide-in-from-top-4">
                <h3 class="text-lg font-bold mb-4">{{ isEditing ? 'Editar' : 'Novo' }} Produto</h3>
                <div class="grid gap-6 md:grid-cols-2">
                  
                  <div class="col-span-2 md:col-span-1">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                    <input type="text" [(ngModel)]="currentProduct.name" class="w-full border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500" [class.border-red-500]="!currentProduct.name">
                  </div>
                  
                  <div class="col-span-2 md:col-span-1">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Preço (R$) *</label>
                    <input type="text" [ngModel]="currentProduct.price" (ngModelChange)="applyCurrencyMask($event)" placeholder="0,00" class="w-full border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500">
                  </div>

                  <div class="col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Descrição / Detalhes</label>
                    <textarea [(ngModel)]="currentProduct.description" rows="3" placeholder="Ex: Marca X, 500g, Tipo 1..." class="w-full border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
                  </div>

                  <div class="col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select [(ngModel)]="currentProduct.status" class="w-full border-gray-300 rounded-lg p-2.5 bg-white">
                      <option value="Ativo">Ativo</option>
                      <option value="Esgotado">Esgotado</option>
                    </select>
                  </div>
                </div>
                <div class="mt-6 flex justify-end">
                  <app-button (click)="saveProduct()" className="bg-green-600 text-white">Salvar</app-button>
                </div>
              </div>
            }

            <div class="bg-white rounded-xl border shadow-sm overflow-hidden">
              @if (products.length > 0) {
                <table class="w-full text-sm text-left">
                  <thead class="bg-gray-50 text-gray-500"><tr><th class="p-4">Nome</th><th class="p-4">Descrição</th><th class="p-4">Preço</th><th class="p-4 text-right">Ações</th></tr></thead>
                  <tbody>
                    @for (product of products; track product._id) {
                      <tr class="border-b hover:bg-gray-50">
                        <td class="p-4 font-bold">{{ product.name }}</td>
                        <td class="p-4 text-gray-500 truncate max-w-xs">{{ product.description || '-' }}</td>
                        <td class="p-4 font-bold text-gray-800">R$ {{ product.price }}</td>
                        <td class="p-4 text-right flex justify-end gap-2">
                          <button (click)="startEdit(product)" class="text-indigo-600"><lucide-icon [img]="PencilIcon" class="w-4 h-4"></lucide-icon></button>
                          <button (click)="deleteProduct(product._id)" class="text-red-600"><lucide-icon [img]="Trash2Icon" class="w-4 h-4"></lucide-icon></button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              } @else { <div class="p-8 text-center text-gray-400">Nenhum produto.</div> }
            </div>
          }

          @if (currentView === 'settings') {
            <div class="max-w-2xl bg-white rounded-xl shadow-sm border p-8">
              <h3 class="text-xl font-bold mb-6">Configurações da Loja</h3>
              <div class="space-y-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Nome da Loja</label>
                  <input type="text" [(ngModel)]="storeSettings.storeName" class="w-full border-gray-300 rounded-lg p-3 bg-gray-50">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <select [(ngModel)]="storeSettings.storeType" class="w-full border-gray-300 rounded-lg p-3 bg-gray-50">
                    <option value="Padaria">Padaria</option>
                    <option value="Mercado">Mercado</option>
                    <option value="Hortifruti">Hortifruti</option>
                  </select>
                </div>
                <div class="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                  <h4 class="font-bold text-indigo-900 flex items-center gap-2">
                    <lucide-icon [img]="MapPinIcon" class="w-4 h-4"></lucide-icon> Localização
                  </h4>
                  <div class="flex items-center gap-3 mt-2">
                    <app-button (click)="getLocation()" className="bg-indigo-600 text-white text-xs">📍 Obter Localização</app-button>
                    @if (storeSettings.lat) { <span class="text-xs text-green-600 font-bold">Definida!</span> }
                  </div>
                </div>
                <div class="flex justify-end pt-4">
                  <app-button (click)="updateStoreSettings()" className="bg-green-600 text-white">Salvar Tudo</app-button>
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

  readonly LayoutDashboardIcon = LayoutDashboard;
  readonly StoreIcon = Store;
  readonly PackageIcon = Package;
  readonly SettingsIcon = Settings;
  readonly LogOutIcon = LogOut;
  readonly PlusIcon = Plus;
  readonly XIcon = X;
  readonly PencilIcon = Pencil;
  readonly Trash2Icon = Trash2;
  readonly MapPinIcon = MapPin;

  currentView: 'overview' | 'products' | 'settings' = 'overview';
  products: any[] = [];
  currentUserName = '';
  storeName = '';
  
  showForm = false;
  isEditing = false;
  editingId: string | null = null;
  // Adicionei description aqui
  currentProduct = { name: '', price: '', status: 'Ativo', description: '' };

  storeSettings = { storeName: '', storeType: '', lat: 0, lng: 0 };

  ngOnInit() { this.checkUserAndFetch(); }

  get totalValue(): number {
    return this.products.reduce((acc, p) => acc + (parseFloat(p.price.replace(',', '.')) || 0), 0);
  }

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
      }, () => alert('Erro no GPS'));
    } else alert('Sem GPS');
  }

  checkUserAndFetch() {
    const user = this.authService.currentUser() as any;
    if (!user) { this.router.navigate(['/auth']); return; }
    this.currentUserName = user.name;
    this.storeName = user.storeName;
    this.storeSettings = { storeName: user.storeName, storeType: user.storeType, lat: user.lat, lng: user.lng };

    const userId = user._id;
    this.http.get<any[]>(`http://localhost:3000/api/products?ownerId=${userId}`).subscribe(data => {
      this.products = data;
      this.cdr.detectChanges();
    });
  }

  updateStoreSettings() {
    const user = this.authService.currentUser();
    if (!user) return;
    this.http.put('http://localhost:3000/api/user/update-profile', { email: user.email, ...this.storeSettings })
      .subscribe({
        next: (res: any) => { alert('Salvo!'); this.storeName = this.storeSettings.storeName; this.authService.currentUser.set(res.user); },
        error: () => alert('Erro')
      });
  }

  saveProduct() {
    if (!this.currentProduct.name) { alert('Nome obrigatório'); return; }
    const user = this.authService.currentUser() as any;
    const data = { ...this.currentProduct, ownerId: user._id };

    if (this.isEditing && this.editingId) {
      this.http.put(`http://localhost:3000/api/products/${this.editingId}`, data).subscribe(() => this.resetForm());
    } else {
      this.http.post('http://localhost:3000/api/products', data).subscribe(() => this.resetForm());
    }
  }

  startEdit(p: any) { this.isEditing=true; this.editingId=p._id; this.currentProduct={...p}; this.showForm=true; this.currentView='products'; }
  deleteProduct(id: string) { if(confirm('Excluir?')) this.http.delete(`http://localhost:3000/api/products/${id}`).subscribe(()=>this.checkUserAndFetch()); }
  // Reseta description também
  resetForm() { this.showForm=false; this.currentProduct={name:'',price:'',status:'Ativo', description: ''}; this.checkUserAndFetch(); }
  openCreateForm() { this.showForm=!this.showForm; this.currentProduct={name:'',price:'',status:'Ativo', description: ''}; this.isEditing=false; }
  logout() { this.authService.logout(); }
}
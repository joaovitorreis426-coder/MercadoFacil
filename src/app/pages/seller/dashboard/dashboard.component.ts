import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
// Importando o Módulo do Scanner e os Ícones
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { LucideAngularModule, LayoutDashboard, Package, LogOut, Plus, X, Pencil, Trash2, Settings, Store, MapPin, AlertTriangle, CheckCircle, XCircle, Filter, Scan, StopCircle, Camera } from 'lucide-angular';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-seller-dashboard',
  standalone: true,
  // ADICIONADO: ZXingScannerModule para o leitor funcionar
  imports: [CommonModule, FormsModule, LucideAngularModule, ButtonComponent, ZXingScannerModule],
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
          <button (click)="currentView = 'overview'" class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left" [class.bg-indigo-600]="currentView === 'overview'" [class.hover:bg-slate-800]="currentView !== 'overview'">
            <lucide-icon [img]="LayoutDashboardIcon" class="h-5 w-5"></lucide-icon> Visão Geral
          </button>
          
          <button (click)="goToProducts()" class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left" [class.bg-indigo-600]="currentView === 'products'" [class.hover:bg-slate-800]="currentView !== 'products'">
            <lucide-icon [img]="PackageIcon" class="h-5 w-5"></lucide-icon> Produtos
          </button>
          
          <button (click)="currentView = 'settings'" class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left" [class.bg-indigo-600]="currentView === 'settings'" [class.hover:bg-slate-800]="currentView !== 'settings'">
            <lucide-icon [img]="SettingsIcon" class="h-5 w-5"></lucide-icon> Configurações
            @if (!hasStoreSettings) { <span class="w-2 h-2 bg-red-500 rounded-full animate-ping ml-auto"></span> }
          </button>
        </nav>
        
        <div class="p-4 border-t border-slate-800 mt-auto">
          <button (click)="logout()" class="flex items-center gap-3 px-4 py-2 text-red-400 hover:text-red-300 w-full transition-colors">
            <lucide-icon [img]="LogOutIcon" class="h-5 w-5"></lucide-icon> Sair
          </button>
        </div>
      </aside>

      <main class="flex-1 overflow-y-auto bg-gray-50">
        <header class="bg-white shadow-sm h-16 flex items-center justify-between px-6 sticky top-0 z-10">
          <h2 class="text-lg font-semibold text-gray-800">
            @if(!hasStoreSettings) { 
              <span class="text-red-500 flex items-center gap-2 text-sm md:text-lg"><lucide-icon [img]="AlertIcon" class="w-4 h-4"></lucide-icon> Configuração Pendente</span> 
            } @else { Painel do Vendedor }
          </h2>
          <div class="flex items-center gap-4 text-sm text-gray-500">Olá, <span class="font-bold text-indigo-600">{{ currentUserName }}</span></div>
        </header>

        <div class="p-6 lg:p-8 space-y-8">

          @if (currentView === 'overview') {
            <div class="grid gap-6 md:grid-cols-2 animate-in fade-in">
              <div (click)="filterBy('Ativo')" class="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md cursor-pointer transition-all group border-l-4 border-l-green-500">
                <div class="flex justify-between items-start">
                  <div>
                    <p class="text-gray-500 mb-1 font-medium">Produtos Ativos</p>
                    <h3 class="text-4xl font-bold text-green-600 group-hover:scale-105 transition-transform">{{ activeCount }}</h3>
                  </div>
                  <div class="bg-green-50 p-3 rounded-full text-green-600"><lucide-icon [img]="CheckCircleIcon" class="w-6 h-6"></lucide-icon></div>
                </div>
              </div>

              <div (click)="filterBy('Esgotado')" class="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md cursor-pointer transition-all group border-l-4 border-l-red-500">
                <div class="flex justify-between items-start">
                  <div>
                    <p class="text-gray-500 mb-1 font-medium">Produtos Esgotados</p>
                    <h3 class="text-4xl font-bold text-red-500 group-hover:scale-105 transition-transform">{{ esgotadoCount }}</h3>
                  </div>
                  <div class="bg-red-50 p-3 rounded-full text-red-500"><lucide-icon [img]="XCircleIcon" class="w-6 h-6"></lucide-icon></div>
                </div>
              </div>
            </div>
          }

          @if (currentView === 'products') {
            
            @if (!hasStoreSettings) {
              <div class="bg-red-50 border border-red-200 p-6 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4 animate-pulse">
                <div class="flex items-center gap-3">
                  <div class="bg-red-100 p-2 rounded-full"><lucide-icon [img]="AlertIcon" class="text-red-500 w-6 h-6"></lucide-icon></div>
                  <div>
                    <h4 class="font-bold text-red-800 text-lg">Ação Necessária</h4>
                    <p class="text-sm text-red-600">Configure o <b>Nome da Loja</b> e a <b>Localização</b> antes de vender.</p>
                  </div>
                </div>
                <app-button (click)="currentView = 'settings'" className="bg-red-600 hover:bg-red-700 text-white text-sm shadow-md">Ir para Configurações</app-button>
              </div>
            } @else {
              <div class="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <div class="flex items-center gap-2">
                  <h3 class="text-xl font-bold text-slate-700">Gerenciar Produtos</h3>
                  @if (filterStatus) {
                    <span class="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 animate-in fade-in">
                      Filtro: {{ filterStatus }}
                      <button (click)="clearFilter()" class="hover:text-red-500"><lucide-icon [img]="XIcon" class="w-3 h-3"></lucide-icon></button>
                    </span>
                  }
                </div>
                <app-button (click)="openCreateForm()" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-lg shadow-indigo-200">
                  <lucide-icon [img]="showForm ? XIcon : PlusIcon" class="h-4 w-4"></lucide-icon> 
                  {{ showForm ? 'Cancelar' : 'Novo Produto' }}
                </app-button>
              </div>
            }

            @if (showForm) {
              <div class="bg-white rounded-xl border border-indigo-100 p-6 shadow-xl mb-8 animate-in slide-in-from-top-4 relative overflow-hidden">
                <div class="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                <h3 class="text-lg font-bold mb-6 text-slate-800 flex items-center gap-2">
                   <lucide-icon [img]="isEditing ? PencilIcon : PlusIcon" class="text-indigo-500"></lucide-icon>
                   {{ isEditing ? 'Editar Produto' : 'Cadastrar Novo Produto' }}
                </h3>

                <div class="mb-6 p-4 bg-slate-50 rounded-lg border border-dashed border-blue-200">
                    <button (click)="toggleScanner()" class="w-full py-3 bg-blue-100 text-blue-700 rounded-lg font-bold hover:bg-blue-200 flex justify-center items-center gap-2 transition-all">
                        <lucide-icon [img]="isScanning ? StopIcon : ScanIcon" class="w-5 h-5"></lucide-icon>
                        {{ isScanning ? 'Fechar Câmera' : 'Escanear Código de Barras' }}
                    </button>
                    
                    <div *ngIf="isScanning" class="mt-4 relative overflow-hidden rounded-lg bg-black h-64 flex justify-center items-center">
                        <zxing-scanner [enable]="isScanning" [tryHarder]="true" (scanSuccess)="onCodeResult($event)"></zxing-scanner>
                        <p class="text-center text-white py-2 text-xs bg-black/50 absolute bottom-0 w-full z-10">Aponte para o código de barras</p>
                    </div>
                </div>

                <div class="grid gap-6 md:grid-cols-2">
                  <div class="col-span-2 md:col-span-1">
                    <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Código GTIN</label>
                    <div class="flex gap-2">
                      <input type="text" [(ngModel)]="currentProduct.gtin" class="w-full border-gray-300 rounded-lg p-3 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Código de barras">
                      <button (click)="searchGtin(currentProduct.gtin)" class="bg-gray-200 px-3 rounded font-bold text-xs hover:bg-gray-300">Buscar</button>
                    </div>
                  </div>

                  <div class="col-span-2 md:col-span-1">
                    <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nome do Produto *</label>
                    <input type="text" [(ngModel)]="currentProduct.name" class="w-full border-gray-300 rounded-lg p-3 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ex: Arroz Branco 5kg">
                  </div>
                  
                  <div class="col-span-2 md:col-span-1">
                    <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Preço (R$) *</label>
                    <input type="text" [ngModel]="currentProduct.price" (ngModelChange)="applyCurrencyMask($event)" placeholder="0,00" class="w-full border-gray-300 rounded-lg p-3 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500">
                  </div>

                  <div class="col-span-2 md:col-span-1">
                    <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Categoria *</label>
                    <select [(ngModel)]="currentProduct.category" class="w-full border-gray-300 rounded-lg p-3 bg-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
                      <option value="" disabled selected>Selecione uma categoria...</option>
                      @for (cat of categoriesList; track cat) { <option [value]="cat">{{ cat }}</option> }
                    </select>
                  </div>

                  <div class="col-span-2 md:col-span-1">
                    <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Status</label>
                    <select [(ngModel)]="currentProduct.status" class="w-full border-gray-300 rounded-lg p-3 bg-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
                      <option value="Ativo">🟢 Ativo (Visível)</option>
                      <option value="Esgotado">🔴 Esgotado (Oculto)</option>
                    </select>
                  </div>

                  <div class="col-span-2">
                    <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Descrição</label>
                    <textarea [(ngModel)]="currentProduct.description" rows="2" placeholder="Detalhes adicionais..." class="w-full border-gray-300 rounded-lg p-3 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
                  </div>
                </div>
                
                <div *ngIf="currentProduct.image" class="mt-4 flex items-center gap-4 p-3 border rounded bg-gray-50">
                    <img [src]="currentProduct.image" class="h-16 w-16 object-contain bg-white rounded border">
                    <span class="text-xs text-green-600 font-bold">Foto encontrada!</span>
                </div>

                <div class="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button (click)="openCreateForm()" class="px-4 py-2 text-gray-500 hover:text-gray-700 font-bold transition-colors">Cancelar</button>
                  <app-button (click)="saveProduct()" className="bg-green-600 hover:bg-green-700 text-white shadow-md">Salvar Produto</app-button>
                </div>
              </div>
            }

            <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              @if (filteredProducts.length > 0) {
                <div class="overflow-x-auto">
                  <table class="w-full text-sm text-left">
                    <thead class="bg-gray-50 text-gray-500 border-b border-gray-200">
                      <tr>
                        <th class="p-4 font-bold uppercase tracking-wider text-xs">Produto</th>
                        <th class="p-4 font-bold uppercase tracking-wider text-xs">Categoria</th>
                        <th class="p-4 font-bold uppercase tracking-wider text-xs">Status</th>
                        <th class="p-4 font-bold uppercase tracking-wider text-xs">Preço</th>
                        <th class="p-4 text-right font-bold uppercase tracking-wider text-xs">Ações</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                      @for (product of filteredProducts; track product._id) {
                        <tr class="hover:bg-indigo-50/50 transition-colors group">
                          <td class="p-4">
                            <div class="font-bold text-slate-800 text-base">{{ product.name }}</div>
                            <div class="text-xs text-gray-400">GTIN: {{ product.gtin || 'n/a' }}</div>
                          </td>
                          <td class="p-4"><span class="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-xs font-bold border border-gray-200">{{ product.category }}</span></td>
                          <td class="p-4">
                            <span class="px-2.5 py-1 rounded-full text-xs font-bold flex w-fit items-center gap-1" [class.bg-green-100]="product.status === 'Ativo'" [class.text-green-700]="product.status === 'Ativo'" [class.bg-red-100]="product.status === 'Esgotado'" [class.text-red-700]="product.status === 'Esgotado'">
                              <span class="w-1.5 h-1.5 rounded-full" [class.bg-green-500]="product.status === 'Ativo'" [class.bg-red-500]="product.status === 'Esgotado'"></span>
                              {{ product.status }}
                            </span>
                          </td>
                          <td class="p-4 font-bold text-slate-800 text-base">R$ {{ product.price }}</td>
                          <td class="p-4 text-right">
                            <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button (click)="startEdit(product)" class="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"><lucide-icon [img]="PencilIcon" class="w-4 h-4"></lucide-icon></button>
                              <button (click)="deleteProduct(product._id)" class="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"><lucide-icon [img]="Trash2Icon" class="w-4 h-4"></lucide-icon></button>
                            </div>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              } @else { <div class="p-12 text-center text-gray-400">Nenhum produto encontrado.</div> }
            </div>
          }

          @if (currentView === 'settings') {
            <div class="max-w-2xl bg-white rounded-xl shadow-sm border border-gray-200 p-8 relative mx-auto">
              <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-t-xl"></div>
              <h3 class="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2">
                <lucide-icon [img]="SettingsIcon" class="text-indigo-600"></lucide-icon> Configurações da Loja
              </h3>
              
              <div class="space-y-6">
                <div>
                  <label class="block text-sm font-bold text-slate-600 mb-2">Nome da Loja <span class="text-red-500">*</span></label>
                  <input type="text" [(ngModel)]="storeSettings.storeName" class="w-full border-gray-300 rounded-lg p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                </div>
                
                <div>
                  <label class="block text-sm font-bold text-slate-600 mb-2">Ramo de Atividade</label>
                  <select [(ngModel)]="storeSettings.storeType" class="w-full border-gray-300 rounded-lg p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer">
                    <option value="Mercado">Mercado / Mercearia</option>
                    <option value="Padaria">Padaria / Confeitaria</option>
                    <option value="Hortifruti">Hortifruti</option>
                    <option value="Açougue">Açougue</option>
                  </select>
                </div>
                
                <div class="p-5 bg-indigo-50 rounded-xl border border-indigo-100">
                  <h4 class="font-bold text-indigo-900 flex items-center gap-2 mb-2">
                    <lucide-icon [img]="MapPinIcon" class="w-4 h-4"></lucide-icon> Localização <span class="text-red-500">*</span>
                  </h4>
                  <p class="text-xs text-indigo-700 mb-4">Precisamos da sua localização para mostrar sua loja aos clientes próximos.</p>
                  
                  <div class="flex items-center gap-4">
                    <app-button (click)="getLocation()" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs shadow-md">📍 Atualizar GPS</app-button>
                    @if (storeSettings.lat) { <span class="text-xs text-green-600 font-bold flex items-center gap-1"><lucide-icon [img]="CheckCircleIcon" class="w-3 h-3"></lucide-icon> OK</span> }
                  </div>
                </div>
                
                <div class="flex justify-end pt-6 border-t border-gray-100">
                  <app-button (click)="updateStoreSettings()" className="bg-green-600 hover:bg-green-700 text-white shadow-lg w-full md:w-auto justify-center">Salvar Alterações</app-button>
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

  // ÍCONES (Adicionados Scan, StopCircle, Camera para o leitor)
  readonly LayoutDashboardIcon = LayoutDashboard; readonly StoreIcon = Store; readonly PackageIcon = Package; readonly SettingsIcon = Settings; readonly LogOutIcon = LogOut; readonly PlusIcon = Plus; readonly XIcon = X; readonly PencilIcon = Pencil; readonly Trash2Icon = Trash2; readonly MapPinIcon = MapPin; readonly AlertIcon = AlertTriangle; readonly CheckCircleIcon = CheckCircle; readonly XCircleIcon = XCircle; readonly FilterIcon = Filter; readonly ScanIcon = Scan; readonly StopIcon = StopCircle; readonly CameraIcon = Camera;

  readonly categoriesList = ['Mercearia', 'Hortifruti', 'Padaria', 'Açougue e Frios', 'Bebidas', 'Laticínios', 'Limpeza', 'Higiene Pessoal', 'Matinais', 'Enlatados', 'Biscoitos', 'Massas', 'Congelados', 'Utilidades', 'Pet Shop'];

  currentView: 'overview' | 'products' | 'settings' = 'overview';
  products: any[] = [];
  filterStatus: string | null = null;
  currentUserName = '';
  storeName = '';
  showForm = false;
  isEditing = false;
  editingId: string | null = null;
  isScanning = false;
  
  currentProduct = { name: '', price: '', status: 'Ativo', description: '', category: '', gtin: '', image: '' };
  storeSettings = { storeName: '', storeType: 'Mercado', lat: 0, lng: 0 };

  ngOnInit() { this.checkUserAndFetch(); }

  get activeCount() { return this.products.filter(p => p.status === 'Ativo').length; }
  get esgotadoCount() { return this.products.filter(p => p.status === 'Esgotado').length; }
  get hasStoreSettings() { return this.storeSettings.storeName && this.storeSettings.lat !== 0; }
  get filteredProducts() { return this.filterStatus ? this.products.filter(p => p.status === this.filterStatus) : this.products; }

  filterBy(status: string) { this.filterStatus = status; this.currentView = 'products'; }
  clearFilter() { this.filterStatus = null; }
  goToProducts() { this.currentView = 'products'; }

  // FUNÇÕES DO SCANNER (Integradas)
  toggleScanner() { this.isScanning = !this.isScanning; }
  onCodeResult(result: string) {
    this.currentProduct.gtin = result;
    this.isScanning = false;
    this.searchGtin(result);
  }
  searchGtin(code: string) {
    if(!code) return;
    this.currentProduct.name = 'Buscando...';
    this.http.get<any>(`https://mercadofacil-hrvh.onrender.com/api/gtin/${code}`).subscribe({
        next: (res) => {
            if(res.found) {
                this.currentProduct.name = res.name;
                this.currentProduct.image = res.image;
            } else {
                this.currentProduct.name = '';
                alert('Produto não encontrado na base pública.');
            }
        },
        error: () => { this.currentProduct.name = ''; alert('Erro na busca.'); }
    });
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
        alert('📍 Localização capturada! Clique em Salvar Alterações.');
      }, () => alert('⚠️ Erro: Permita o acesso ao GPS no navegador!'));
    } else alert('Seu navegador não suporta GPS');
  }

  checkUserAndFetch() {
    const user = this.authService.currentUser() as any;
    if (!user) { this.router.navigate(['/auth']); return; }
    this.currentUserName = user.name;
    this.storeName = user.storeName;
    this.storeSettings = { storeName: user.storeName || '', storeType: user.storeType || 'Mercado', lat: user.lat || 0, lng: user.lng || 0 };

    this.http.get<any[]>(`https://mercadofacil-hrvh.onrender.com/api/products?ownerId=${user._id}`).subscribe(data => {
      this.products = data;
      this.cdr.detectChanges();
    });
  }

  updateStoreSettings() {
    if (!this.storeSettings.storeName || !this.storeSettings.lat) { alert('Preencha Nome e Localização'); return; }
    const user = this.authService.currentUser() as any;
    if (!user) return;
    
    this.http.put('https://mercadofacil-hrvh.onrender.com/api/user/update-profile', { email: user.email, ...this.storeSettings })
      .subscribe({
        next: (res: any) => { 
          alert('✅ Configurações salvas!'); 
          this.storeName = this.storeSettings.storeName; 
          this.authService.currentUser.set(res.user); 
          if(this.currentView === 'settings') this.currentView = 'overview';
        },
        error: (err) => alert('Erro ao salvar perfil.')
      });
  }

  saveProduct() {
    if (!this.currentProduct.name) { alert('Nome obrigatório'); return; }
    if (!this.currentProduct.category) { alert('Categoria obrigatória'); return; }
    const user = this.authService.currentUser() as any;
    const data = { ...this.currentProduct, ownerId: user._id };

    if (this.isEditing && this.editingId) {
      this.http.put(`https://mercadofacil-hrvh.onrender.com/api/products/${this.editingId}`, data).subscribe(() => { this.resetForm(); alert('Produto atualizado!'); });
    } else {
      this.http.post('https://mercadofacil-hrvh.onrender.com/api/products', data).subscribe(() => { this.resetForm(); alert('Produto criado!'); });
    }
  }

  startEdit(p: any) { 
    this.isEditing=true; 
    this.editingId=p._id; 
    this.currentProduct={...p, gtin: p.gtin || '', image: p.image || ''}; 
    this.showForm=true; 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  deleteProduct(id: string) { if(confirm('Tem certeza que deseja excluir?')) this.http.delete(`https://mercadofacil-hrvh.onrender.com/api/products/${id}`).subscribe(()=>this.checkUserAndFetch()); }
  resetForm() { this.showForm=false; this.currentProduct={name:'',price:'',status:'Ativo', description: '', category: '', gtin: '', image: ''}; this.checkUserAndFetch(); }
  openCreateForm() { this.showForm=!this.showForm; this.currentProduct={name:'',price:'',status:'Ativo', description: '', category: '', gtin: '', image: ''}; this.isEditing=false; }
  logout() { this.authService.logout(); }
}
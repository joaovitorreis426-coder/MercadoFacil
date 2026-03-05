import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule, Package, Search, Edit2, Trash2, Plus, Tag, Barcode, Box, MapPin, AlertTriangle, DollarSign } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-seller-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-slate-50 font-sans pb-20">
      
      <header class="bg-white shadow-md sticky top-0 z-10 border-b border-blue-100">
        <div class="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 class="text-xl font-black text-slate-800 flex items-center gap-2 italic uppercase tracking-tighter">
            <div class="bg-blue-600 p-2 rounded-lg text-white">
              <lucide-icon [img]="PackageIcon" class="w-6 h-6"></lucide-icon>
            </div>
            Mercado Fácil
          </h1>
          <div class="flex items-center gap-4">
             <span class="hidden md:block text-sm font-bold text-slate-400 italic">Painel do Vendedor</span>
             <button (click)="logout()" class="text-xs font-bold text-red-500 hover:underline">Sair</button>
          </div>
        </div>
      </header>

      <main class="max-w-6xl mx-auto px-4 py-8">
        
        @if (!storeConfigured && !isLoading) {
          <div class="bg-red-50 border-2 border-red-200 p-6 rounded-2xl mb-8 flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse">
            <div class="flex items-center gap-4">
              <div class="bg-red-500 text-white p-3 rounded-full">
                <lucide-icon [img]="MapPinIcon" class="w-6 h-6"></lucide-icon>
              </div>
              <div>
                <h2 class="text-red-900 font-black text-lg">Loja não localizada!</h2>
                <p class="text-red-700 text-sm">Configure seu endereço e GPS para aparecer no ranking dos clientes.</p>
              </div>
            </div>
            <a routerLink="/seller/setup" class="w-full md:w-auto bg-red-600 text-white px-8 py-3 rounded-xl font-black shadow-lg shadow-red-200 text-center">
              CONFIGURAR AGORA
            </a>
          </div>
        }

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p class="text-xs font-bold text-slate-400 uppercase mb-1">Itens Cadastrados</p>
            <p class="text-3xl font-black text-blue-600">{{ products.length }}</p>
          </div>
          <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p class="text-xs font-bold text-slate-400 uppercase mb-1">Estoque Baixo</p>
            <p class="text-3xl font-black" [class.text-red-500]="lowStockCount > 0" [class.text-slate-300]="lowStockCount === 0">
              {{ lowStockCount }}
            </p>
          </div>
          <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
             <p class="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
               <lucide-icon [img]="DollarSignIcon" class="w-3 h-3"></lucide-icon> Valor em Estoque
             </p>
             <p class="text-3xl font-black text-green-600">R$ {{ totalStockValue.toFixed(2).replace('.',',') }}</p>
          </div>
        </div>

        <div class="flex flex-col md:flex-row gap-4 mb-8">
          <div class="relative flex-1">
            <input type="text" [(ngModel)]="searchTerm" (input)="filterProducts()" placeholder="Buscar por nome, marca ou GTIN..." class="w-full bg-white border-2 border-slate-200 rounded-xl pl-12 pr-4 py-4 outline-none focus:border-blue-500 transition-all font-medium">
            <lucide-icon [img]="SearchIcon" class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5"></lucide-icon>
          </div>
          <a [routerLink]="storeConfigured ? '/seller/products/new' : null" 
             [class.opacity-50]="!storeConfigured"
             class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-black flex items-center justify-center gap-2 shadow-lg shadow-blue-100 transition-transform active:scale-95">
            <lucide-icon [img]="PlusIcon" class="w-5 h-5"></lucide-icon> ADICIONAR PRODUTO
          </a>
        </div>

        @if (isLoading) {
          <div class="flex flex-col items-center justify-center py-20">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p class="text-slate-400 font-bold uppercase tracking-widest text-xs">Sincronizando Inventário...</p>
          </div>
        }

        @if (!isLoading && filteredProducts.length === 0) {
          <div class="bg-white p-12 rounded-3xl border-2 border-dashed border-slate-200 text-center">
            <lucide-icon [img]="PackageIcon" class="text-slate-200 w-16 h-16 mx-auto mb-4"></lucide-icon>
            <h3 class="text-xl font-bold text-slate-700">Nada por aqui...</h3>
            <p class="text-slate-400 mb-6">Comece a cadastrar seus produtos para aparecer nos resultados de busca dos clientes.</p>
          </div>
        }

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (product of filteredProducts; track product.id) {
            <div class="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition-all group flex flex-col relative" [class.border-red-200]="product.stock <= 5">
              
              @if (product.stock <= 5) {
                <div class="absolute top-3 right-3 bg-red-100 text-red-600 p-1.5 rounded-lg z-10" title="Estoque Crítico">
                  <lucide-icon [img]="AlertTriangleIcon" class="w-4 h-4"></lucide-icon>
                </div>
              }

              <div class="p-6 flex-1">
                <span class="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-1 rounded-md uppercase tracking-tighter mb-2 inline-block">
                   {{ product.brand || 'Marca Própria' }}
                </span>
                <h3 class="font-black text-slate-800 text-xl leading-tight mb-2 uppercase">{{ product.name }}</h3>
                <p class="text-[10px] font-mono text-slate-400">GTIN: {{ product.gtin }}</p>
              </div>

              <div class="bg-slate-50 p-6 flex justify-between items-end border-t border-slate-100">
                <div>
                  <span class="block text-[10px] font-black text-slate-400 uppercase mb-1">Preço Sugerido</span>
                  <span class="text-3xl font-black text-green-600 italic">R$ {{ product.price?.replace('.', ',') }}</span>
                </div>
                <div class="text-right">
                  <span class="block text-[10px] font-black text-slate-400 uppercase mb-1">Qtd. Estoque</span>
                  <span class="text-xl font-black text-slate-700 flex items-center justify-end gap-1" [class.text-red-500]="product.stock <= 5">
                     {{ product.stock }} <lucide-icon [img]="BoxIcon" class="w-4 h-4"></lucide-icon>
                  </span>
                </div>
              </div>

              <div class="p-4 flex gap-2 bg-white">
                <button (click)="editProduct(product)" class="flex-1 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600 text-xs font-black py-4 rounded-xl transition-all flex justify-center items-center gap-2">
                  <lucide-icon [img]="Edit2Icon" class="w-4 h-4"></lucide-icon> ATUALIZAR PREÇO
                </button>
                <button (click)="deleteProduct(product.id)" class="bg-red-50 hover:bg-red-500 hover:text-white text-red-500 px-5 py-4 rounded-xl transition-all flex justify-center items-center shadow-sm">
                  <lucide-icon [img]="Trash2Icon" class="w-5 h-5"></lucide-icon>
                </button>
              </div>
            </div>
          }
        </div>
      </main>
    </div>
  `
})
export class SellerDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Icons
  readonly PackageIcon = Package; readonly SearchIcon = Search; readonly Edit2Icon = Edit2; 
  readonly Trash2Icon = Trash2; readonly PlusIcon = Plus; readonly TagIcon = Tag; 
  readonly BarcodeIcon = Barcode; readonly BoxIcon = Box; readonly MapPinIcon = MapPin;
  readonly AlertTriangleIcon = AlertTriangle; readonly DollarSignIcon = DollarSign;

  products: any[] = []; 
  filteredProducts: any[] = []; 
  searchTerm = ''; 
  isLoading = true;
  storeConfigured = false;
  lowStockCount = 0;
  totalStockValue = 0;

  ngOnInit() { 
    this.checkStoreStatus();
    this.fetchProducts(); 
  }

  checkStoreStatus() {
    const user = this.authService.currentUser();
    // Verifica se os campos obrigatórios para o Ranking existem no usuário logado
    if (user && user.storeName && user.latitude && user.longitude) {
      this.storeConfigured = true;
    }
  }

  fetchProducts() {
    const user = this.authService.currentUser();
    this.http.get<any[]>('https://mercadofacil-hrvh.onrender.com/api/products/all').subscribe({
      next: (data) => {
        // Filtra apenas produtos deste vendedor
        this.products = user ? data.filter(p => p.ownerId === user.id) : data;
        this.calculateMetrics();
        this.filteredProducts = [...this.products];
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  calculateMetrics() {
    this.lowStockCount = this.products.filter(p => p.stock <= 5).length;
    this.totalStockValue = this.products.reduce((acc, p) => acc + (parseFloat(p.price) * (p.stock || 0)), 0);
  }

  filterProducts() {
    const term = this.searchTerm.toLowerCase();
    this.filteredProducts = this.products.filter(p => 
      p.name?.toLowerCase().includes(term) || 
      p.gtin?.includes(term) || 
      p.brand?.toLowerCase().includes(term)
    );
  }

  editProduct(product: any) {
    const newPrice = prompt(`Atualizar preço de ${product.name}\n\nDigite o novo valor (Ex: 12.50):`, product.price);
    if (newPrice !== null && newPrice.trim() !== '') {
      const parsedPrice = parseFloat(newPrice.replace(',', '.'));
      if (isNaN(parsedPrice)) return alert('❌ Valor inválido.');

      this.http.put(`https://mercadofacil-hrvh.onrender.com/api/products/${product.id}`, { price: parsedPrice.toString() }).subscribe({
        next: () => { 
          product.price = parsedPrice.toString(); 
          this.calculateMetrics();
          alert('✅ Preço atualizado!'); 
        },
        error: () => alert('❌ Erro no servidor.')
      });
    }
  }

  deleteProduct(id: number) {
    if (confirm('⚠️ ATENÇÃO: Deseja remover este item do seu catálogo permanentemente?')) {
      this.http.delete(`https://mercadofacil-hrvh.onrender.com/api/products/${id}`).subscribe({
        next: () => { 
          this.products = this.products.filter(p => p.id !== id); 
          this.calculateMetrics();
          this.filterProducts(); 
        },
        error: () => alert('❌ Erro ao excluir.')
      });
    }
  }

  logout() {
    // Adicione aqui sua lógica de logout (limpar localStorage, etc)
    this.router.navigate(['/login']);
  }
}
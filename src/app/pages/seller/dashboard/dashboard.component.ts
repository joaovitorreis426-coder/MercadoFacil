import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Package, Search, Edit2, Trash2, Plus, Tag, Barcode, Box } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-seller-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-slate-50 font-sans pb-20">
      
      <header class="bg-white shadow-md sticky top-0 z-10 border-b border-blue-100">
        <div class="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 class="text-xl font-bold text-slate-800 flex items-center gap-2">
            <div class="bg-blue-100 p-2 rounded-lg text-blue-600">
              <lucide-icon [img]="PackageIcon" class="w-6 h-6"></lucide-icon>
            </div>
            Meu Estoque
          </h1>
          <a routerLink="/seller/products/new" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 shadow-sm">
            <lucide-icon [img]="PlusIcon" class="w-4 h-4"></lucide-icon> <span class="hidden sm:inline">Novo Produto</span>
          </a>
        </div>
      </header>

      <main class="max-w-6xl mx-auto px-4 py-8">
        
        <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex gap-4 items-center">
          <div class="relative flex-1">
            <input type="text" [(ngModel)]="searchTerm" (input)="filterProducts()" placeholder="Buscar nos meus produtos..." class="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-3 outline-none focus:border-blue-500 focus:bg-white transition-colors text-slate-700 font-medium">
            <lucide-icon [img]="SearchIcon" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5"></lucide-icon>
          </div>
          <div class="hidden sm:block text-right">
            <span class="block text-xs font-bold text-slate-400 uppercase">Total de Itens</span>
            <span class="text-xl font-black text-blue-600">{{ products.length }}</span>
          </div>
        </div>

        @if (isLoading) {
          <div class="flex flex-col items-center justify-center py-20">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
            <p class="text-slate-500 font-medium">A carregar o seu estoque...</p>
          </div>
        }

        @if (!isLoading && filteredProducts.length === 0) {
          <div class="bg-white p-10 rounded-2xl border border-dashed border-slate-300 text-center animate-in zoom-in duration-300">
            <div class="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <lucide-icon [img]="PackageIcon" class="text-slate-400 w-8 h-8"></lucide-icon>
            </div>
            <h3 class="text-xl font-bold text-slate-700 mb-2">Nenhum produto encontrado</h3>
            <p class="text-slate-500 mb-6">Você ainda não tem produtos ou a busca não encontrou nada.</p>
            <a routerLink="/seller/products/new" class="inline-block bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 font-bold px-6 py-2.5 rounded-lg transition-colors">
              Cadastrar Meu Primeiro Produto
            </a>
          </div>
        }

        @if (!isLoading && filteredProducts.length > 0) {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in slide-in-from-bottom-4">
            @for (product of filteredProducts; track product.id) {
              <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
                <div class="p-5 border-b border-slate-50 flex-1">
                  <div class="flex justify-between items-start mb-2">
                    <span class="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1">
                      <lucide-icon [img]="TagIcon" class="w-3 h-3"></lucide-icon> {{ product.brand || 'Genérico' }}
                    </span>
                    <span class="text-[10px] text-slate-400 font-mono">GTIN: {{ product.gtin || 'N/A' }}</span>
                  </div>
                  <h3 class="font-bold text-slate-800 text-lg leading-tight mb-4 group-hover:text-blue-600">{{ product.name }}</h3>
                </div>

                <div class="bg-slate-50 p-4 grid grid-cols-2 gap-2 border-b border-slate-100">
                  <div>
                    <span class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Preço</span>
                    <span class="text-lg font-black text-green-600">R$ {{ product.price?.replace('.', ',') || '0,00' }}</span>
                  </div>
                  <div class="text-right">
                    <span class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Estoque</span>
                    <span class="text-lg font-black text-slate-700 flex items-center justify-end gap-1" [class.text-red-500]="product.stock <= 5">
                      <lucide-icon [img]="BoxIcon" class="w-4 h-4"></lucide-icon> {{ product.stock || 0 }}
                    </span>
                  </div>
                </div>

                <div class="p-3 flex gap-2 bg-white">
                  <button (click)="editProduct(product)" class="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold py-2 rounded border border-blue-100 transition-colors flex justify-center items-center gap-1">
                    <lucide-icon [img]="Edit2Icon" class="w-3 h-3"></lucide-icon> Atualizar Preço
                  </button>
                  <button (click)="deleteProduct(product.id)" class="bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 px-3 py-2 rounded border border-red-100 transition-colors flex justify-center items-center">
                    <lucide-icon [img]="Trash2Icon" class="w-4 h-4"></lucide-icon>
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </main>
    </div>
  `
})
export class SellerDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  readonly PackageIcon = Package; readonly SearchIcon = Search; readonly Edit2Icon = Edit2; readonly Trash2Icon = Trash2; readonly PlusIcon = Plus; readonly TagIcon = Tag; readonly BarcodeIcon = Barcode; readonly BoxIcon = Box;

  products: any[] = []; filteredProducts: any[] = []; searchTerm = ''; isLoading = true;

  ngOnInit() { this.fetchProducts(); }

  fetchProducts() {
    const user = this.authService.currentUser();
    this.http.get<any[]>('https://mercadofacil-hrvh.onrender.com/api/products/all').subscribe({
      next: (data) => {
        this.products = user ? data.filter(p => p.ownerId === user.id) : data;
        this.filteredProducts = [...this.products];
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  filterProducts() {
    const term = this.searchTerm.toLowerCase();
    this.filteredProducts = this.products.filter(p => p.name?.toLowerCase().includes(term) || p.gtin?.includes(term) || p.brand?.toLowerCase().includes(term));
  }

  editProduct(product: any) {
    const newPrice = prompt(`Atualizar preço de ${product.name}\nPreço atual: R$ ${product.price}\n\nDigite o novo preço (ex: 15.90):`);
    if (newPrice !== null && newPrice.trim() !== '') {
      const parsedPrice = parseFloat(newPrice.replace(',', '.'));
      if (isNaN(parsedPrice)) return alert('❌ Por favor, digite um número válido.');

      this.http.put(`https://mercadofacil-hrvh.onrender.com/api/products/${product.id}`, { price: parsedPrice.toString() }).subscribe({
        next: () => { product.price = parsedPrice.toString(); alert('✅ Preço atualizado!'); },
        error: () => alert('❌ Erro ao atualizar o preço.')
      });
    }
  }

  deleteProduct(id: number) {
    if (confirm('⚠️ Deseja apagar este produto do seu estoque?')) {
      this.http.delete(`https://mercadofacil-hrvh.onrender.com/api/products/${id}`).subscribe({
        next: () => { this.products = this.products.filter(p => p.id !== id); this.filterProducts(); },
        error: () => alert('❌ Erro ao excluir o produto.')
      });
    }
  }
}
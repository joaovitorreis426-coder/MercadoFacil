import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, Package, DollarSign, CheckCircle, Tag } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-seller-product-create',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-slate-50 font-sans pb-20 pt-8 px-4">
      <div class="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-blue-100 p-6 sm:p-8">
        
        <h2 class="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <lucide-icon [img]="SearchIcon" class="w-4 h-4"></lucide-icon> Busque no catálogo global
        </h2>
        
        <div class="relative mb-8">
          <input type="text" [(ngModel)]="searchQuery" (input)="onSearchType()" placeholder="Ex: Arroz Tio João 1kg..." class="w-full border-2 border-blue-200 bg-slate-50 rounded-xl px-4 py-4 pl-12 outline-none focus:border-blue-500 font-medium text-lg">
          <lucide-icon [img]="SearchIcon" class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></lucide-icon>
          
          @if (isSearching) { <div class="absolute right-4 top-1/2 -translate-y-1/2 animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div> }

          @if (cosmosResults.length > 0) {
            <div class="absolute w-full mt-2 bg-white border border-blue-100 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto">
              @for (product of cosmosResults; track product.gtin) {
                <button (click)="selectCosmosProduct(product)" class="w-full text-left p-4 border-b border-slate-50 hover:bg-blue-50 transition-colors flex flex-col group">
                  <span class="font-bold text-slate-800">{{ product.description }}</span>
                  <span class="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase mt-1 w-fit">Marca: {{ product.brand || 'N/A' }} | GTIN: {{ product.gtin }}</span>
                </button>
              }
            </div>
          }
        </div>

        @if (selectedProduct) {
          <div class="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-8">
            <h3 class="font-bold text-lg text-blue-900">{{ selectedProduct.description }}</h3>
            <p class="text-xs font-bold text-slate-500 mt-2">CÓDIGO: {{ selectedProduct.gtin }}</p>
          </div>

          <div class="grid sm:grid-cols-2 gap-6 mb-8">
            <div>
              <label class="block text-xs font-bold text-slate-500 mb-2 uppercase">Preço de Venda (R$)</label>
              <input type="number" [(ngModel)]="productPrice" placeholder="0.00" class="w-full border border-slate-300 rounded-lg px-4 py-3 font-black text-xl text-slate-800">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 mb-2 uppercase">Estoque (unidades)</label>
              <input type="number" [(ngModel)]="productStock" placeholder="Ex: 50" class="w-full border border-slate-300 rounded-lg px-4 py-3 font-black text-xl text-slate-800">
            </div>
          </div>

          <button (click)="saveProduct()" [disabled]="isSaving" class="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white font-bold text-lg py-4 rounded-xl shadow-lg transition-transform active:scale-95">
            {{ isSaving ? 'Salvando...' : 'Cadastrar Produto na Loja' }}
          </button>
        }
      </div>
    </div>
  `
})
export class SellerProductCreateComponent {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  readonly SearchIcon = Search; readonly PackageIcon = Package; readonly DollarIcon = DollarSign; readonly CheckCircleIcon = CheckCircle; readonly TagIcon = Tag;

  searchQuery = ''; cosmosResults: any[] = []; isSearching = false; isSaving = false;
  selectedProduct: any = null; productPrice: number | null = null; productStock: number | null = null;

  onSearchType() {
    if (this.searchQuery.length >= 3) {
      this.isSearching = true;
      this.http.get<any[]>(`https://mercadofacil-hrvh.onrender.com/api/products/search?q=${this.searchQuery}`)
        .subscribe({ next: (data) => { this.cosmosResults = data; this.isSearching = false; }, error: () => this.isSearching = false });
    } else { this.cosmosResults = []; }
  }

  selectCosmosProduct(product: any) {
    this.selectedProduct = product; this.searchQuery = product.description; this.cosmosResults = [];
  }

  saveProduct() {
    const user = this.authService.currentUser();
    if (!user) return alert('Faça login primeiro.');
    if (!this.selectedProduct || !this.productPrice || !this.productStock) return alert('Preencha preço e estoque!');

    this.isSaving = true;
    const payload = { gtin: this.selectedProduct.gtin, price: this.productPrice, stock: this.productStock, ownerId: user.id };

    this.http.post('https://mercadofacil-hrvh.onrender.com/api/products/create-from-gtin', payload)
      .subscribe({
        next: (res: any) => { alert('✅ ' + res.message); this.isSaving = false; this.resetForm(); },
        error: (err) => { alert('❌ Erro: ' + err.error.error); this.isSaving = false; }
      });
  }

  resetForm() { this.searchQuery = ''; this.selectedProduct = null; this.productPrice = null; this.productStock = null; this.cosmosResults = []; }
}
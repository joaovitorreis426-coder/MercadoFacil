import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NgxScannerQrcodeModule, LOAD_WASM } from 'ngx-scanner-qrcode'; // <--- BIBLIOTECA DO SCANNER
import { LucideAngularModule, Plus, Trash2, Edit, Save, X, Scan, Camera } from 'lucide-angular';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { AuthService } from '../../../core/services/auth.service';

// Configuração necessária para o scanner carregar rápido
LOAD_WASM().subscribe();

@Component({
  selector: 'app-seller-products',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, ButtonComponent, NgxScannerQrcodeModule],
  template: `
    <div class="max-w-4xl mx-auto p-6 pb-20">
      
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-slate-800">Meus Produtos</h1>
        <button *ngIf="!showForm" (click)="openForm()" class="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700">
          <lucide-icon [img]="PlusIcon" class="w-5 h-5"></lucide-icon> Novo Produto
        </button>
      </div>

      <div *ngIf="showForm" class="bg-white p-6 rounded-xl shadow-lg border border-blue-100 mb-6 animate-in fade-in slide-in-from-top-4">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-bold text-slate-700 flex items-center gap-2">
            <lucide-icon [img]="isEditing ? EditIcon : PlusIcon" class="text-blue-500"></lucide-icon>
            {{ isEditing ? 'Editar Produto' : 'Adicionar Produto' }}
          </h2>
          <button (click)="closeForm()" class="text-gray-400 hover:text-red-500"><lucide-icon [img]="XIcon" class="w-6 h-6"></lucide-icon></button>
        </div>

        <div class="mb-6 p-4 bg-slate-50 rounded-lg border border-dashed border-blue-200">
            <button (click)="toggleScanner()" class="w-full py-3 bg-blue-100 text-blue-700 rounded-lg font-bold hover:bg-blue-200 flex justify-center items-center gap-2 transition-all">
                <lucide-icon [img]="isScanning ? XIcon : CameraIcon" class="w-5 h-5"></lucide-icon>
                {{ isScanning ? 'Fechar Câmera' : 'Escanear Código de Barras' }}
            </button>
            
            <div *ngIf="isScanning" class="mt-4 relative overflow-hidden rounded-lg bg-black">
                <ngx-scanner-qrcode #action="scanner" [config]="config" (event)="onEvent($event)"></ngx-scanner-qrcode>
                <p class="text-center text-white py-2 text-xs bg-black/50 absolute bottom-0 w-full">Aponte para o código de barras (EAN)</p>
            </div>
        </div>

        <div class="grid gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-500 mb-1">Código de Barras (GTIN)</label>
            <div class="flex gap-2">
                <input [(ngModel)]="currentProduct.gtin" placeholder="Ex: 789..." class="flex-1 p-2 rounded border border-gray-300 bg-gray-50 focus:bg-white focus:border-blue-500 outline-none transition-colors">
                <button (click)="searchGtin(currentProduct.gtin)" class="bg-gray-200 px-3 rounded font-bold text-xs hover:bg-gray-300">Buscar</button>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 mb-1">Nome do Produto</label>
            <input [(ngModel)]="currentProduct.name" placeholder="Ex: Arroz Tio João 1kg" class="w-full p-2 rounded border border-gray-300 outline-none focus:border-blue-500">
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-500 mb-1">Preço (R$)</label>
              <input [(ngModel)]="currentProduct.price" placeholder="0,00" class="w-full p-2 rounded border border-gray-300 outline-none focus:border-blue-500">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 mb-1">Categoria</label>
              <select [(ngModel)]="currentProduct.category" class="w-full p-2 rounded border border-gray-300 outline-none focus:border-blue-500 bg-white">
                <option>Mercearia</option>
                <option>Hortifruti</option>
                <option>Carnes</option>
                <option>Bebidas</option>
                <option>Limpeza</option>
                <option>Higiene</option>
                <option>Padaria</option>
                <option>Outros</option>
              </select>
            </div>
          </div>

           <div *ngIf="currentProduct.image" class="flex items-center gap-4 p-3 border rounded bg-gray-50">
               <img [src]="currentProduct.image" class="h-16 w-16 object-contain bg-white rounded border">
               <span class="text-xs text-green-600 font-bold">Foto encontrada!</span>
           </div>

          <app-button (click)="saveProduct()" className="w-full justify-center bg-green-600 hover:bg-green-700 text-white mt-2">
            <lucide-icon [img]="SaveIcon" class="w-5 h-5 mr-2"></lucide-icon> Salvar Produto
          </app-button>
        </div>
      </div>

      <div class="grid gap-4">
        <div *ngFor="let product of products" class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center group hover:border-blue-200 transition-all">
          <div>
            <h3 class="font-bold text-slate-800">{{ product.name }}</h3>
            <div class="text-sm text-slate-500 flex gap-2">
               <span class="bg-blue-50 text-blue-600 px-2 rounded text-xs font-bold">{{ product.category }}</span>
               <span *ngIf="product.gtin" class="bg-gray-100 text-gray-500 px-2 rounded text-xs">GTIN: {{ product.gtin }}</span>
            </div>
            <p class="font-bold text-green-600 mt-1">R$ {{ product.price }}</p>
          </div>
          <div class="flex gap-2">
            <button (click)="editProduct(product)" class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"><lucide-icon [img]="EditIcon" class="w-5 h-5"></lucide-icon></button>
            <button (click)="deleteProduct(product._id)" class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"><lucide-icon [img]="TrashIcon" class="w-5 h-5"></lucide-icon></button>
          </div>
        </div>
        
        <div *ngIf="products.length === 0 && !showForm" class="text-center py-10 text-gray-400">
            Nenhum produto cadastrado.
        </div>
      </div>
    </div>
  `
})
export class SellerProductsComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  readonly PlusIcon = Plus; readonly TrashIcon = Trash2; readonly EditIcon = Edit; readonly SaveIcon = Save; readonly XIcon = X; readonly ScanIcon = Scan; readonly CameraIcon = Camera;

  products: any[] = [];
  showForm = false;
  isEditing = false;
  
  // SCANNER
  @ViewChild('action') action: any;
  isScanning = false;
  config = { 
    constraints: { video: { facingMode: 'environment' } } // Tenta usar câmera traseira
  };

  currentProduct = { _id: null, name: '', price: '', category: 'Mercearia', gtin: '', image: '' };

  ngOnInit() { this.loadProducts(); }

  loadProducts() {
    const user = this.authService.currentUser() as any;
    if (user) {
      this.http.get<any[]>(`https://mercadofacil-hrvh.onrender.com/api/products?ownerId=${user._id}`).subscribe(data => this.products = data);
    }
  }

  // --- LÓGICA DO SCANNER ---
  toggleScanner() {
    this.isScanning = !this.isScanning;
    setTimeout(() => {
        if(this.isScanning) this.action.start();
        else this.action.stop();
    }, 100);
  }

  onEvent(e: any[]) {
    if (e && e.length > 0) {
        const code = e[0].value;
        // Bip de sucesso
        this.currentProduct.gtin = code;
        this.isScanning = false;
        this.action.stop();
        this.searchGtin(code); // Busca automática
    }
  }

  searchGtin(code: string) {
    if(!code) return;
    this.currentProduct.name = 'Buscando informações...';
    
    this.http.get<any>(`https://mercadofacil-hrvh.onrender.com/api/gtin/${code}`).subscribe({
        next: (res) => {
            if(res.found) {
                this.currentProduct.name = res.name;
                this.currentProduct.image = res.image;
                alert(`Produto encontrado: ${res.name}`);
            } else {
                this.currentProduct.name = '';
                alert('Produto não encontrado na base pública. Preencha manualmente.');
            }
        },
        error: () => {
            this.currentProduct.name = '';
            alert('Erro ao buscar dados.');
        }
    });
  }
  // -------------------------

  openForm() { this.resetForm(); this.showForm = true; }
  closeForm() { this.showForm = false; this.isScanning = false; }

  resetForm() {
    this.currentProduct = { _id: null, name: '', price: '', category: 'Mercearia', gtin: '', image: '' };
    this.isEditing = false;
  }

  saveProduct() {
    const user = this.authService.currentUser() as any;
    if (!user) return;

    const payload = { ...this.currentProduct, ownerId: user._id };

    if (this.isEditing && this.currentProduct._id) {
      this.http.put(`https://mercadofacil-hrvh.onrender.com/api/products/${this.currentProduct._id}`, payload).subscribe(() => {
        this.loadProducts(); this.closeForm();
      });
    } else {
      this.http.post('https://mercadofacil-hrvh.onrender.com/api/products', payload).subscribe(() => {
        this.loadProducts(); this.closeForm();
      });
    }
  }

  editProduct(product: any) {
    this.currentProduct = { ...product };
    this.isEditing = true;
    this.showForm = true;
  }

  deleteProduct(id: number) {
    if (confirm('Tem certeza?')) {
      this.http.delete(`https://mercadofacil-hrvh.onrender.com/api/products/${id}`).subscribe(() => this.loadProducts());
    }
  }
}
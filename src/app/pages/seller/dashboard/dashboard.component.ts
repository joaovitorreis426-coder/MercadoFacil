import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule, Package, Search, Edit2, Trash2, Plus, Tag, Box, MapPin } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-seller-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  templateUrl: './dashboard.component.html'
})
export class SellerDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Ícones
  readonly PackageIcon = Package; readonly SearchIcon = Search; readonly Edit2Icon = Edit2; 
  readonly Trash2Icon = Trash2; readonly PlusIcon = Plus; readonly TagIcon = Tag; 
  readonly BoxIcon = Box; readonly MapPinIcon = MapPin;

  products: any[] = []; 
  filteredProducts: any[] = []; 
  searchTerm = ''; 
  isLoading = true;
  storeConfigured = false;

  ngOnInit() { 
    this.checkStoreStatus();
    this.fetchProducts(); 
  }

  checkStoreStatus() {
    const user = this.authService.currentUser();
    // Verifica se a loja já foi configurada para liberar o cadastro
    if (user && user.storeName && user.latitude) {
      this.storeConfigured = true;
    }
  }

  fetchProducts() {
    const user = this.authService.currentUser();
    this.http.get<any[]>('https://mercadofacil-hrvh.onrender.com/api/products/all').subscribe({
      next: (data) => {
        // Filtra apenas produtos deste vendedor logado
        this.products = user ? data.filter(p => p.ownerId === user.id) : data;
        this.filteredProducts = [...this.products];
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  filterProducts() {
    const term = this.searchTerm.toLowerCase();
    this.filteredProducts = this.products.filter(p => 
      p.name?.toLowerCase().includes(term) || 
      p.gtin?.includes(term)
    );
  }

  editProduct(product: any) {
    const newPrice = prompt(`Atualizar preço de ${product.name}:`, product.price);
    if (newPrice !== null && newPrice.trim() !== '') {
      const parsedPrice = parseFloat(newPrice.replace(',', '.'));
      if (isNaN(parsedPrice)) return alert('❌ Valor inválido.');

      this.http.put(`https://mercadofacil-hrvh.onrender.com/api/products/${product.id}`, { price: parsedPrice.toString() }).subscribe({
        next: () => { 
          product.price = parsedPrice.toString(); 
          alert('✅ Preço atualizado!'); 
        },
        error: () => alert('❌ Erro ao atualizar.')
      });
    }
  }

  deleteProduct(id: number) {
    if (confirm('Deseja remover este item do catálogo?')) {
      this.http.delete(`https://mercadofacil-hrvh.onrender.com/api/products/${id}`).subscribe({
        next: () => { 
          this.products = this.products.filter(p => p.id !== id); 
          this.filterProducts(); 
        },
        error: () => alert('❌ Erro ao excluir.')
      });
    }
  }

  logout() {
    this.router.navigate(['/login']);
  }
}
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

  readonly PackageIcon = Package; readonly SearchIcon = Search; readonly Edit2Icon = Edit2; 
  readonly Trash2Icon = Trash2; readonly PlusIcon = Plus; readonly TagIcon = Tag; 
  readonly BoxIcon = Box; readonly MapPinIcon = MapPin;

  products: any[] = []; 
  filteredProducts: any[] = []; 
  searchTerm = ''; 
  isLoading = true;
  storeConfigured = false;

  ngOnInit() { 
    const user = this.authService.currentUser();
    if (user && user.storeName && user.latitude) this.storeConfigured = true;
    this.fetchProducts(); 
  }

  fetchProducts() {
    const user = this.authService.currentUser();
    this.http.get<any[]>('https://mercadofacil-hrvh.onrender.com/api/products/all').subscribe({
      next: (data) => {
        this.products = user ? data.filter(p => p.ownerId === user.id) : [];
        this.filteredProducts = [...this.products];
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  filterProducts() {
    const term = this.searchTerm.toLowerCase();
    this.filteredProducts = this.products.filter(p => p.name?.toLowerCase().includes(term));
  }

 deleteProduct(id: number) {
    if (confirm('Remover este produto?')) {
      // GARANTA QUE O CAMINHO SEJA /products/ (plural) para bater com o server.js
      this.http.delete(`https://mercadofacil-hrvh.onrender.com/api/products/${id}`).subscribe({
        next: () => {
          this.products = this.products.filter(p => p.id !== id);
          this.filterProducts();
        },
        error: (err) => {
          console.error("Erro 404 ou 500 ao deletar:", err);
          alert('Erro ao excluir o produto do servidor.');
        }
      });
    }
}
  
  logout() { this.router.navigate(['/login']); }
}
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000'; // URL do Node.js

  // Busca produtos do vendedor
  getSellerProducts() {
    return this.http.get<any[]>(`${this.apiUrl}/products`);
  }

  // Busca lojas próximas
  getNearbyStores(lat: number, lng: number) {
    // Adicionamos <any[]> para dizer ao TypeScript que isso retorna uma lista
    return this.http.get<any[]>(`${this.apiUrl}/stores`);
  }
}
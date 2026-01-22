import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, ShoppingBag } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-consumer-map',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <div class="h-screen flex flex-col">
      <header class="bg-white shadow-md z-10 p-4 flex justify-between items-center">
        <h1 class="text-xl font-bold text-gray-800">📍 Mercado Fácil Market - Lojas Próximas</h1>
        
        <div class="flex gap-4">
          <a routerLink="/consumer/list" class="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
            <lucide-icon [img]="ShoppingBagIcon"></lucide-icon>
            Ver Lista de Produtos
          </a>
          <button (click)="logout()" class="text-red-500 font-medium">Sair</button>
        </div>
      </header>

      <div id="map" class="flex-1 w-full bg-gray-200"></div>
    </div>
  `
})
export class MapComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  
  readonly ShoppingBagIcon = ShoppingBag;
  
  private map: any;

  ngOnInit() {
    this.fixLeafletIcons(); // <--- CORREÇÃO DOS ÍCONES
    this.initMap();
    this.loadSellers();
  }

  // --- FUNÇÃO PARA CORRIGIR O ERRO DAS IMAGENS ---
  fixLeafletIcons() {
    const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
    const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
    const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

    const DefaultIcon = L.icon({
      iconUrl: iconUrl,
      iconRetinaUrl: iconRetinaUrl,
      shadowUrl: shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });

    L.Marker.prototype.options.icon = DefaultIcon;
  }

  initMap() {
    // Inicia centrado em Santo Amaro (ou onde você preferir)
    this.map = L.map('map').setView([-12.5472, -38.7119], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
  }

  loadSellers() {
    this.http.get<any[]>('http://localhost:3000/api/sellers')
      .subscribe(sellers => {
        console.log('Lojas encontradas:', sellers); // Debug para ver se veio algo
        sellers.forEach(seller => {
          if (seller.lat && seller.lng) {
            this.addMarker(seller);
          }
        });
      });
  }

  addMarker(seller: any) {
    const marker = L.marker([seller.lat, seller.lng]).addTo(this.map);

    const popupContent = `
      <div class="p-2 min-w-[200px]">
        <h3 class="font-bold text-lg text-indigo-700">${seller.storeName}</h3>
        <span class="text-xs bg-gray-200 px-2 py-1 rounded font-semibold">${seller.storeType}</span>
        <p class="text-sm mt-3 text-gray-600">Confira os preços na lista!</p>
      </div>
    `;

    marker.bindPopup(popupContent);
  }

  logout() {
    this.authService.logout();
  }
}
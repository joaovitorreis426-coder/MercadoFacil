import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, ArrowLeft } from 'lucide-angular';
import * as L from 'leaflet'; // Importa o motor do mapa

@Component({
  selector: 'app-consumer-map',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <div class="flex flex-col h-screen bg-slate-50">
      
      <header class="bg-white shadow-sm p-4 sticky top-0 z-[1000] flex items-center gap-4">
        <a routerLink="/consumer/list" class="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-blue-100 hover:text-blue-600 transition-colors">
          <lucide-icon [img]="BackIcon" class="w-5 h-5"></lucide-icon>
        </a>
        <h1 class="text-xl font-bold text-slate-800">Mapa de Mercados</h1>
      </header>

      <div class="flex-1 relative">
        @if (loading) {
          <div class="absolute inset-0 z-[2000] bg-white/80 flex flex-col items-center justify-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-4"></div>
            <p class="text-blue-800 font-bold">Buscando a sua localização...</p>
          </div>
        }
        
        <div id="map" class="w-full h-full z-0"></div>
      </div>

    </div>
  `
})
export class ConsumerMapComponent implements OnInit {
  private http = inject(HttpClient);
  readonly BackIcon = ArrowLeft;
  
  map: any;
  loading = true;
  userLat: number = -14.2350; // Posição padrão (Centro do Brasil)
  userLng: number = -51.9253;

  ngOnInit() {
    this.initMap();
  }

  // 1. Tenta pegar a localização do cliente
  initMap() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.userLat = pos.coords.latitude;
          this.userLng = pos.coords.longitude;
          this.loadLeaflet(14); // Zoom mais próximo (14) porque achou o cliente
        },
        () => {
          alert('GPS desativado. Mostrando visão geral do mapa.');
          this.loadLeaflet(4); // Zoom afastado (4)
        }
      );
    } else {
      this.loadLeaflet(4);
    }
  }

  // 2. Desenha o mapa na tela
  loadLeaflet(zoomLevel: number) {
    // Cria o mapa e centraliza
    this.map = L.map('map').setView([this.userLat, this.userLng], zoomLevel);

    // Carrega as imagens das ruas (OpenStreetMap - Gratuito)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Cria o Pino Azul (Você)
    const userIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
    });

    // Coloca o Pino Azul no mapa
    L.marker([this.userLat, this.userLng], { icon: userIcon })
      .addTo(this.map)
      .bindPopup('<b>📍 Você está aqui!</b>')
      .openPopup();

    // Chama a função para buscar os mercados
    this.fetchSellersAndDrawPins();
  }

  // 3. Busca os mercados no Backend e espalha os pinos
  fetchSellersAndDrawPins() {
    this.http.get<any[]>('https://mercadofacil-hrvh.onrender.com/api/sellers').subscribe({
      next: (sellers) => {
        
        // Cria o Pino Verde (Mercados)
        const storeIcon = L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
        });

        // Espalha os mercados pelo mapa
        sellers.forEach(seller => {
          if (seller.lat && seller.lng) {
            L.marker([seller.lat, seller.lng], { icon: storeIcon })
              .addTo(this.map)
              .bindPopup(`
                <div class="text-center">
                  <b class="text-blue-700 text-lg">${seller.storeName || 'Mercado'}</b><br>
                  <span class="text-gray-500 text-sm">${seller.storeType || 'Loja'}</span>
                </div>
              `);
          }
        });
        
        this.loading = false; // Esconde a tela de carregamento
      },
      error: () => this.loading = false
    });
  }
}
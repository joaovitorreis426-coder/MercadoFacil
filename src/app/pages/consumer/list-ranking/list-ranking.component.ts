import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule, Trophy, MapPin, ShoppingCart, ArrowLeft, Star } from 'lucide-angular';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-list-ranking',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-50 font-sans pb-20">
      <header class="bg-white p-4 shadow-sm sticky top-0 z-10">
        <div class="max-w-2xl mx-auto flex items-center gap-4">
          <a routerLink="/consumer/list" class="text-slate-600">
            <lucide-icon [img]="ArrowLeftIcon"></lucide-icon>
          </a>
          <h1 class="text-xl font-bold text-slate-800">Melhores Opções</h1>
        </div>
      </header>

      <main class="max-w-2xl mx-auto p-4">
        <div class="bg-blue-600 rounded-2xl p-6 mb-6 text-white shadow-lg shadow-blue-200 flex items-center justify-between">
          <div>
            <p class="text-blue-100 text-sm font-bold uppercase tracking-wider">Economia Encontrada</p>
            <h2 class="text-2xl font-black">Ranking de Lojas</h2>
          </div>
          <lucide-icon [img]="TrophyIcon" class="w-10 h-10 text-yellow-400"></lucide-icon>
        </div>

        @if (isLoading) {
          <div class="flex flex-col items-center justify-center py-20">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
            <p class="text-slate-500">Calculando melhor trajeto e preços...</p>
          </div>
        }

        @if (!isLoading && ranking.length === 0) {
          <div class="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <lucide-icon [img]="ShoppingCartIcon" class="w-12 h-12 text-slate-300 mx-auto mb-4"></lucide-icon>
            <p class="text-slate-500 font-medium px-6">Nenhum estabelecimento próximo possui todos os itens da sua lista no momento.</p>
          </div>
        }

        <div class="space-y-4">
          @for (store of ranking; track store.id; let i = $index) {
            <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center justify-between group hover:border-blue-300 transition-all animate-in slide-in-from-bottom-4" [style.animation-delay]="i * 100 + 'ms'">
              
              <div class="flex items-center gap-4">
                <div class="flex flex-col items-center">
                  <span [class]="i === 0 ? 'text-yellow-500' : 'text-slate-300'" class="text-2xl font-black italic">
                    #{{ i + 1 }}
                  </span>
                  @if (i === 0) { <lucide-icon [img]="StarIcon" class="w-4 h-4 text-yellow-400 fill-yellow-400"></lucide-icon> }
                </div>

                <div>
                  <h3 class="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors">{{ store.name }}</h3>
                  <div class="flex items-center gap-2 text-slate-500 text-sm">
                    <lucide-icon [img]="MapPinIcon" class="w-3 h-3 text-red-500"></lucide-icon>
                    <span>{{ store.distance.toFixed(1) }} km de distância</span>
                  </div>
                </div>
              </div>

              <div class="text-right">
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total da Lista</p>
                <p class="text-2xl font-black text-green-600">
                  R$ {{ store.totalPrice.toFixed(2).replace('.', ',') }}
                </p>
                <span class="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded">
                  {{ store.itemsFound }} / {{ totalItemsRequested }} itens
                </span>
              </div>

            </div>
          }
        </div>
      </main>
    </div>
  `
})
export class ListRankingComponent implements OnInit {
  private http = inject(HttpClient);
  
  readonly TrophyIcon = Trophy;
  readonly MapPinIcon = MapPin;
  readonly ShoppingCartIcon = ShoppingCart;
  readonly ArrowLeftIcon = ArrowLeft;
  readonly StarIcon = Star;

  ranking: any[] = [];
  isLoading = true;
  totalItemsRequested = 0;

  ngOnInit() {
    this.loadRanking();
  }

  loadRanking() {
    // 1. Pegamos a localização do usuário salva no navegador
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      // 2. Pegamos a lista de compras do localStorage (aquela que fizemos antes)
      const savedList = JSON.parse(localStorage.getItem('my_shopping_list') || '[]');
      this.totalItemsRequested = savedList.length;
      
      const gtins = savedList.map((p: any) => p.gtin).join(',');

      // 3. Chamamos a API do Backend para fazer o cálculo
      this.http.get<any[]>(`https://mercadofacil-hrvh.onrender.com/api/consumer/ranking`, {
        params: { lat, lng, products: gtins }
      }).subscribe({
        next: (data) => {
          this.ranking = data;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        }
      });
    });
  }
}
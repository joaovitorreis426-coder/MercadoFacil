import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { LucideAngularModule, MapPin, Store, CheckCircle } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-store-setup',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div class="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-blue-50">
        <div class="text-center mb-8">
          <div class="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
            <lucide-icon [img]="StoreIcon" class="w-8 h-8"></lucide-icon>
          </div>
          <h1 class="text-2xl font-black text-slate-800">Configurar sua Loja</h1>
          <p class="text-slate-500">Precisamos da sua localização para aparecer no mapa.</p>
        </div>

        <div class="space-y-6">
          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Nome do Estabelecimento</label>
            <input type="text" [(ngModel)]="storeName" placeholder="Ex: Mercado do João" class="w-full border-2 border-slate-100 rounded-xl px-4 py-3 outline-none focus:border-blue-500">
          </div>

          <button (click)="getLocation()" class="w-full flex items-center justify-center gap-2 py-4 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-700 transition-all">
            <lucide-icon [img]="MapPinIcon" class="w-5 h-5 text-red-500"></lucide-icon>
            {{ coords ? 'Localização Capturada!' : 'Capturar minha Localização' }}
          </button>

          <button (click)="save()" [disabled]="!storeName || !coords" class="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl font-black shadow-lg shadow-blue-200 transition-all">
            Salvar e Começar
          </button>
        </div>
      </div>
    </div>
  `
})
export class StoreSetupComponent {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly StoreIcon = Store; readonly MapPinIcon = MapPin;
  storeName = ''; coords: { lat: number, lng: number } | null = null;

  getLocation() {
    navigator.geolocation.getCurrentPosition(pos => {
      this.coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    });
  }

  save() {
    const user = this.auth.currentUser();
    this.http.put(`https://mercadofacil-hrvh.onrender.com/api/auth/update-store`, {
      id: user.id,
      storeName: this.storeName,
      latitude: this.coords?.lat,
      longitude: this.coords?.lng
    }).subscribe(() => {
      // Atualiza o usuário local e vai para o dashboard
      user.storeName = this.storeName;
      this.router.navigate(['/seller/dashboard']);
    });
  }
}
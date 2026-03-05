import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule, MapPin, Store, CheckCircle, Navigation, ArrowLeft, Loader2 } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-store-setup',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
      
      <div class="max-w-md w-full mb-4">
        <a routerLink="/seller/dashboard" class="flex items-center gap-2 text-slate-400 font-bold text-sm hover:text-blue-600 transition-colors">
          <lucide-icon [img]="ArrowLeftIcon" class="w-4 h-4"></lucide-icon> Voltar ao Painel
        </a>
      </div>

      <div class="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-blue-100/50 p-8 border border-blue-50 relative overflow-hidden">
        
        <div class="absolute -top-10 -right-10 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-50"></div>

        <div class="text-center mb-10">
          <div class="bg-blue-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-200 rotate-3">
            <lucide-icon [img]="StoreIcon" class="w-10 h-10 text-white"></lucide-icon>
          </div>
          <h1 class="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Configurar Loja</h1>
          <p class="text-slate-400 font-medium text-sm mt-2">Para aparecer no ranking de preços, precisamos identificar seu estabelecimento.</p>
        </div>

        <div class="space-y-8">
          <div>
            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Nome do Estabelecimento</label>
            <div class="relative">
              <input type="text" [(ngModel)]="storeName" placeholder="Ex: Supermercado Central" 
                class="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 outline-none focus:border-blue-600 focus:bg-white transition-all font-bold text-slate-700">
              <lucide-icon [img]="StoreIcon" class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5"></lucide-icon>
            </div>
          </div>

          <div>
            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Localização GPS</label>
            
            @if (!coords) {
              <button (click)="getLocation()" [disabled]="isDetecting" 
                class="w-full flex items-center justify-center gap-3 py-5 bg-slate-900 hover:bg-blue-600 text-white rounded-2xl font-black transition-all shadow-lg active:scale-95 disabled:bg-slate-300">
                @if (isDetecting) {
                  <lucide-icon [img]="LoaderIcon" class="w-5 h-5 animate-spin"></lucide-icon> Detectando...
                } @else {
                  <lucide-icon [img]="MapPinIcon" class="w-5 h-5"></lucide-icon> CAPTURAR MINHA POSIÇÃO
                }
              </button>
            } @else {
              <div class="bg-green-50 border-2 border-green-200 p-4 rounded-2xl flex items-center justify-between animate-in zoom-in">
                <div class="flex items-center gap-3">
                  <div class="bg-green-500 text-white p-2 rounded-lg">
                    <lucide-icon [img]="CheckIcon" class="w-4 h-4"></lucide-icon>
                  </div>
                  <div>
                    <p class="text-green-800 font-black text-xs uppercase">Posição Capturada!</p>
                    <p class="text-green-600 text-[10px] font-mono">{{ coords.lat.toFixed(4) }}, {{ coords.lng.toFixed(4) }}</p>
                  </div>
                </div>
                <button (click)="coords = null" class="text-xs font-bold text-green-700 hover:underline">Alterar</button>
              </div>
            }
          </div>

          <button (click)="saveStore()" [disabled]="!storeName || !coords || isSaving" 
            class="w-full py-5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-300 text-white rounded-2xl font-black text-lg shadow-2xl shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2">
            {{ isSaving ? 'SALVANDO...' : 'SALVAR CONFIGURAÇÕES' }}
            <lucide-icon [img]="NavigationIcon" class="w-5 h-5" *ngIf="!isSaving"></lucide-icon>
          </button>
        </div>

        <p class="text-center text-[10px] text-slate-300 font-bold uppercase mt-10 tracking-widest">Acesso Restrito ao Vendedor</p>
      </div>
    </div>
  `
})
export class StoreSetupComponent {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private router = inject(Router);

  // Ícones
  readonly StoreIcon = Store; readonly MapPinIcon = MapPin;
  readonly CheckIcon = CheckCircle; readonly NavigationIcon = Navigation;
  readonly ArrowLeftIcon = ArrowLeft; readonly LoaderIcon = Loader2;

  storeName = '';
  coords: { lat: number, lng: number } | null = null;
  isDetecting = false;
  isSaving = false;

  getLocation() {
    this.isDetecting = true;
    
    if (!navigator.geolocation) {
      alert("Seu navegador não suporta geolocalização.");
      this.isDetecting = false;
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        this.isDetecting = false;
      },
      (err) => {
        alert("Erro ao capturar localização. Verifique se o GPS está ativo e se você deu permissão.");
        this.isDetecting = false;
      },
      { enableHighAccuracy: true }
    );
  }

  saveStore() {
    const user = this.auth.currentUser();
    if (!user) return;

    this.isSaving = true;
    const payload = {
      id: user.id,
      storeName: this.storeName,
      latitude: this.coords?.lat,
      longitude: this.coords?.lng
    };

    this.http.put('https://mercadofacil-hrvh.onrender.com/api/auth/update-store', payload)
      .subscribe({
        next: () => {
          // 🔥 MUITO IMPORTANTE: Atualiza o usuário na memória local do App
          user.storeName = this.storeName;
          user.latitude = this.coords?.lat;
          user.longitude = this.coords?.lng;
          
          // Salva novamente no localStorage para o Dashboard ler os dados novos
          localStorage.setItem('user', JSON.stringify(user));

          alert("✅ Loja configurada com sucesso!");
          this.router.navigate(['/seller/dashboard']);
        },
        error: (err) => {
          this.isSaving = false;
          console.error(err);
          alert("❌ Erro ao salvar configurações. Tente novamente.");
        }
      });
  }
}
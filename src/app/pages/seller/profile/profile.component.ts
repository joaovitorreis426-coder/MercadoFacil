import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule, Save, Store, MapPin, Navigation } from 'lucide-angular';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-seller-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, ButtonComponent],
  template: `
    <div class="max-w-md mx-auto p-6 bg-white rounded-xl shadow-sm border border-blue-100 mt-10">
      <h2 class="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <lucide-icon [img]="StoreIcon" class="text-blue-600"></lucide-icon> Minha Loja
      </h2>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-bold text-slate-500 mb-1">Nome da Loja</label>
          <input [(ngModel)]="storeName" placeholder="Ex: Mercadinho do Bairro" class="w-full p-3 rounded-lg border border-gray-300 outline-none focus:border-blue-500">
        </div>

        <div>
          <label class="block text-sm font-bold text-slate-500 mb-1">Tipo de Comércio</label>
          <select [(ngModel)]="storeType" class="w-full p-3 rounded-lg border border-gray-300 outline-none focus:border-blue-500 bg-white">
            <option value="Mercado">Mercado / Mercearia</option>
            <option value="Hortifruti">Hortifruti</option>
            <option value="Açougue">Açougue</option>
            <option value="Padaria">Padaria</option>
            <option value="Farmácia">Farmácia</option>
          </select>
        </div>

        <div class="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <label class="block text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
            <lucide-icon [img]="MapIcon" class="w-4 h-4"></lucide-icon> Localização da Loja
          </label>
          
          <div class="flex items-center gap-3 mb-3">
            <div class="flex-1 bg-white p-2 rounded border border-blue-200 text-xs text-gray-500">
              Lat: {{ lat || 'Não definida' }} <br>
              Lng: {{ lng || 'Não definida' }}
            </div>
            <button (click)="getLocation()" class="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold shadow-sm">
              <lucide-icon [img]="NavIcon" class="w-4 h-4"></lucide-icon> Pegar GPS Atual
            </button>
          </div>
          <p class="text-[10px] text-blue-600">
            * Clique no botão estando dentro da sua loja para salvar a localização exata.
          </p>
        </div>

        <app-button (click)="saveProfile()" className="w-full justify-center bg-green-600 hover:bg-green-700 text-white mt-4 py-3">
          <lucide-icon [img]="SaveIcon" class="w-5 h-5 mr-2"></lucide-icon> Salvar Dados da Loja
        </app-button>
      </div>
    </div>
  `
})
export class SellerProfileComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  readonly SaveIcon = Save; readonly StoreIcon = Store; readonly MapIcon = MapPin; readonly NavIcon = Navigation;

  storeName = '';
  storeType = 'Mercado';
  lat: number | null = null;
  lng: number | null = null;
  email = '';

  ngOnInit() {
    const user = this.authService.currentUser() as any;
    if (user) {
      this.email = user.email;
      this.storeName = user.storeName || '';
      this.storeType = user.storeType || 'Mercado';
      this.lat = user.lat || null;
      this.lng = user.lng || null;
    }
  }

  getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.lat = position.coords.latitude;
          this.lng = position.coords.longitude;
          alert('📍 Localização capturada! Clique em SALVAR para gravar.');
        },
        (error) => alert('Erro ao pegar localização. Permita o acesso ao GPS.')
      );
    } else {
      alert('Seu navegador não suporta GPS.');
    }
  }

  saveProfile() {
    const payload = {
      email: this.email,
      storeName: this.storeName,
      storeType: this.storeType,
      lat: this.lat,
      lng: this.lng
    };

    this.http.put('https://mercadofacil-hrvh.onrender.com/api/user/update-profile', payload).subscribe({
      next: (res: any) => {
        alert('Perfil atualizado com sucesso!');
        // Atualiza o usuário localmente também
        this.authService.currentUser.set(res.user);
      },
      error: () => alert('Erro ao atualizar perfil.')
    });
  }
}
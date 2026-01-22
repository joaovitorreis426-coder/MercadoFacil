import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, ShoppingBag, Store, MapPin, TrendingDown, ArrowRight } from 'lucide-angular';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-gradient-to-b from-indigo-50 to-white font-sans">
      
      <nav class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div class="flex items-center gap-2 font-bold text-2xl text-indigo-900">
          <div class="bg-indigo-600 text-white p-1.5 rounded-lg">
            <lucide-icon [img]="ShoppingBagIcon" class="w-6 h-6"></lucide-icon>
          </div>
          Mercado Fácil Market
        </div>
        <div class="hidden md:flex gap-6 text-gray-600 font-medium">
          <a href="#como-funciona" class="hover:text-indigo-600 transition">Como funciona</a>
          <a href="#vantagens" class="hover:text-indigo-600 transition">Vantagens</a>
        </div>
        <a routerLink="/auth" class="text-indigo-600 font-bold hover:bg-indigo-50 px-4 py-2 rounded-lg transition">
          Fazer Login
        </a>
      </nav>

      <header class="max-w-7xl mx-auto px-6 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
        <div class="space-y-6 animate-in slide-in-from-left-4 duration-700">
          <span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold tracking-wide uppercase">
            Economia Real
          </span>
          <h1 class="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight">
            Compare preços e <span class="text-indigo-600">economize</span> na cesta básica.
          </h1>
          <p class="text-lg text-gray-600 md:w-3/4">
            Conectamos consumidores aos mercadinhos locais. Encontre o menor preço perto de você ou venda seus produtos para a vizinhança.
          </p>
          
          <div class="flex flex-col sm:flex-row gap-4 pt-4">
            <a routerLink="/auth" class="flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
              Começar Agora
              <lucide-icon [img]="ArrowRightIcon" class="w-5 h-5"></lucide-icon>
            </a>
            <a href="#como-funciona" class="flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-200 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition">
              Saber mais
            </a>
          </div>
        </div>

        <div class="relative animate-in slide-in-from-right-4 duration-700 hidden md:block">
          <div class="absolute inset-0 bg-indigo-600 rounded-full opacity-5 blur-3xl"></div>
          <div class="relative bg-white p-8 rounded-2xl shadow-xl border border-gray-100 transform rotate-2 hover:rotate-0 transition duration-500">
            <div class="flex items-center justify-between mb-6">
              <div>
                <p class="text-xs text-gray-400 uppercase">Sua Cesta</p>
                <p class="font-bold text-xl text-gray-800">Comparador de Preços</p>
              </div>
              <div class="bg-green-100 p-2 rounded-lg">
                <lucide-icon [img]="TrendingIcon" class="text-green-600 w-6 h-6"></lucide-icon>
              </div>
            </div>
            <div class="space-y-4">
              <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span class="font-medium text-gray-700">Mercadinho do João</span>
                <span class="font-bold text-green-600">R$ 15,90</span>
              </div>
              <div class="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-lg opacity-60">
                <span class="font-medium text-gray-500">Supermercado Extra</span>
                <span class="font-bold text-gray-400">R$ 18,50</span>
              </div>
              <div class="pt-4 border-t flex justify-between text-sm">
                <span class="text-gray-500">Economia estimada:</span>
                <span class="font-bold text-indigo-600">R$ 2,60</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section id="como-funciona" class="bg-white py-20">
        <div class="max-w-7xl mx-auto px-6">
          <div class="text-center mb-16">
            <h2 class="text-3xl font-bold text-gray-900">O que você procura?</h2>
            <p class="text-gray-500 mt-2">Temos soluções para quem compra e para quem vende.</p>
          </div>

          <div class="grid md:grid-cols-2 gap-8">
            <div class="group p-8 rounded-2xl border border-gray-100 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-50 transition duration-300">
              <div class="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition">
                <lucide-icon [img]="MapPinIcon" class="w-7 h-7"></lucide-icon>
              </div>
              <h3 class="text-2xl font-bold text-gray-900 mb-3">Para Consumidores</h3>
              <p class="text-gray-600 mb-6">
                Encontre mercadinhos próximos, monte sua lista de compras e descubra onde o total fica mais barato.
              </p>
              <ul class="space-y-2 mb-8 text-gray-500">
                <li class="flex items-center gap-2"><div class="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Mapa de Lojas</li>
                <li class="flex items-center gap-2"><div class="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Comparador de Preços</li>
              </ul>
              <a routerLink="/auth" class="inline-flex items-center text-blue-600 font-bold hover:gap-2 transition-all">
                Quero economizar <lucide-icon [img]="ArrowRightIcon" class="w-4 h-4 ml-1"></lucide-icon>
              </a>
            </div>

            <div class="group p-8 rounded-2xl border border-gray-100 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-50 transition duration-300">
              <div class="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition">
                <lucide-icon [img]="StoreIcon" class="w-7 h-7"></lucide-icon>
              </div>
              <h3 class="text-2xl font-bold text-gray-900 mb-3">Para Vendedores</h3>
              <p class="text-gray-600 mb-6">
                Cadastre sua loja, gerencie seu estoque e seja encontrado por clientes do seu bairro.
              </p>
              <ul class="space-y-2 mb-8 text-gray-500">
                <li class="flex items-center gap-2"><div class="w-1.5 h-1.5 bg-purple-500 rounded-full"></div> Painel de Gestão</li>
                <li class="flex items-center gap-2"><div class="w-1.5 h-1.5 bg-purple-500 rounded-full"></div> Visibilidade no Mapa</li>
              </ul>
              <a routerLink="/auth" class="inline-flex items-center text-purple-600 font-bold hover:gap-2 transition-all">
                Quero vender mais <lucide-icon [img]="ArrowRightIcon" class="w-4 h-4 ml-1"></lucide-icon>
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer class="bg-gray-50 border-t border-gray-200 py-12">
        <div class="max-w-7xl mx-auto px-6 text-center">
          <p class="text-gray-500">© 2026 Mercado Fácil Market. Projeto Acadêmico.</p>
        </div>
      </footer>
    </div>
  `
})
export class LandingPageComponent {
  readonly ShoppingBagIcon = ShoppingBag;
  readonly StoreIcon = Store;
  readonly MapPinIcon = MapPin;
  readonly TrendingIcon = TrendingDown;
  readonly ArrowRightIcon = ArrowRight;
}
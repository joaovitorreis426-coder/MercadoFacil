import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../utils/cn';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="computedClass">
      @if (title) {
        <div class="flex flex-col space-y-1.5 p-6">
          <h3 class="text-2xl font-semibold leading-none tracking-tight">{{ title }}</h3>
          @if (description) {
            <p class="text-sm text-muted-foreground text-gray-500">{{ description }}</p>
          }
        </div>
      }
      
      <div class="p-6 pt-0">
        <ng-content></ng-content>
      </div>
      
      @if (footer) {
        <div class="flex items-center p-6 pt-0">
          {{ footer }}
        </div>
      }
    </div>
  `
})
export class CardComponent {
  @Input() className: string = '';
  @Input() title: string = '';
  @Input() description: string = '';
  @Input() footer: string = '';

  get computedClass() {
    return cn("rounded-lg border bg-white text-slate-950 shadow-sm", this.className);
  }
}
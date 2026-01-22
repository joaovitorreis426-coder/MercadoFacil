import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../utils/cn'; // Importando o utilitário que criamos no Passo 2

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [class]="computedClass"
      [disabled]="disabled"
      (click)="onClick.emit($event)">
      <ng-content></ng-content>
    </button>
  `
})
export class ButtonComponent {
  @Input() className: string = '';
  @Input() disabled: boolean = false;
  // Variantes baseadas no shadcn/ui padrão
  @Input() variant: 'default' | 'destructive' | 'outline' | 'ghost' | 'link' = 'default';
  
  @Output() onClick = new EventEmitter<Event>();

  get computedClass() {
    // Classes base copiadas do padrão shadcn (similar ao button.jsx original )
    const baseClasses = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2";
    
    const variants = {
      default: "bg-slate-900 text-white hover:bg-slate-900/90", // Primary
      destructive: "bg-red-500 text-white hover:bg-red-500/90",
      outline: "border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900",
      ghost: "hover:bg-slate-100 hover:text-slate-900",
      link: "text-slate-900 underline-offset-4 hover:underline"
    };

    return cn(baseClasses, variants[this.variant], this.className);
  }
}
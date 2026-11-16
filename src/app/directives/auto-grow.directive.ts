import { AfterViewInit, Directive, ElementRef, HostListener } from '@angular/core';

/** Ajuste la hauteur d'un <textarea> à son contenu. */
@Directive({ selector: 'textarea[appAutoGrow]' })
export class AutoGrowDirective implements AfterViewInit {

  constructor(private el: ElementRef<HTMLTextAreaElement>) { }

  ngAfterViewInit(): void {
    // ngModel écrit la valeur de façon asynchrone : on attend le prochain tick
    setTimeout(() => this.ajuster());
  }

  @HostListener('input')
  ajuster(): void {
    const el = this.el.nativeElement;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }
}

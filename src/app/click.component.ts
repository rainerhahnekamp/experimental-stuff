import { Component, inject, Injectable, signal } from '@angular/core';
import { createIncrementalCompilerHost } from 'typescript';


@Injectable({ providedIn: 'root' })
export class ClickCounter {
  #counter = 0;

  get counter() {
    return this.#counter
  }

  increment() {
    this.#counter++
  }

}

@Component({
  selector: 'app-click',
  template: `
    <button (click)="onClick()">Click me!</button>
    @if (clicked()) {
      <p>You clicked me!</p>
    }
  `,
  standalone: true,
})
export class ClickComponent {
  clickCounter = inject(ClickCounter);
  clicked = signal(false)

  onClick() {
    this.clicked.update(value => !value)
    this.clickCounter.increment();
  }
}

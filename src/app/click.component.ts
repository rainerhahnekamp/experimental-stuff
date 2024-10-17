import {Component, signal} from '@angular/core';

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
  clicked = signal(false)

  onClick() {
    console.log('clicked');
    this.clicked.update(value => !value)
  }
}

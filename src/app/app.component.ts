import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {ClickComponent} from './click.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ClickComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'playwright-component-testing-angular-prototype';
}

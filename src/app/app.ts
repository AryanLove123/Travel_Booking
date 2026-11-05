import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastHost } from './shared/ui/toast-host';
import { SiteHeader } from './shared/layout/site-header/site-header';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastHost, SiteHeader],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('tripsy');
}

import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink],
  template: `
    <section class="container page">
      <div class="empty">
        <h1>Page not found</h1>
        <p>The page you were looking for does not exist.</p>
        <a routerLink="/" class="btn">Back to home</a>
      </div>
    </section>
  `,
})
export class NotFoundPage {}

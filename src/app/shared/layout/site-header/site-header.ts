import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../ui/toast.service';

@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
})
export class SiteHeader {
  auth = inject(AuthService);
  router = inject(Router);
  toast = inject(ToastService);
  menuOpen = signal(false);
  navOpen = signal(false);

  toggleRole(): void{
    const next = this.auth.isAdmin() ? 'customer' : 'admin';
  }

  async signOut(): Promise<void> {
    this.menuOpen.set(false);
    await this.auth.signOut();
    this.toast.info('You have been signed out.');
    await this.router.navigate(['/']);
  }
}

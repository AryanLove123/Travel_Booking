import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { Router } from '@angular/router';
import { UserRole } from '../../models/domain.model';

@Component({
  selector: 'app-login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './login-page.html',
  styles: `.narrow { max-width: 520px; } hr { border: 0; border-top: 1px solid var(--c-line); width: 100%; } .small { font-size: var(--fs-sm); }`,
})
export class LoginPage {
  auth = inject(AuthService);
  router = inject(Router);
  returnUrl = input<string>();
  
  async google(): Promise<void>{
    if(await this.auth.signInWithGoogle()){
      await this.done();
    }
  }

  demo(role: UserRole): void{
    this.auth.signInDemo(role);
    this.done();
  }

  done(): Promise<boolean>{
    const target = this.returnUrl();
    return this.router.navigateByUrl(target && target.startsWith('/') && !target.startsWith('//') ? target : '/');
  }
}

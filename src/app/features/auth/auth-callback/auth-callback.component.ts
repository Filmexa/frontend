import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
import { UserService } from '../../../core/services/user/user.service';
import { ErrorResponse } from '../../../shared/interfaces/ErrorResponse';
import { ToastService } from '../../../shared/services/toast/toast.service';

@Component({
  selector: 'app-auth-callback',
  imports: [],
  templateUrl: './auth-callback.component.html',
  styleUrl: './auth-callback.component.css',
})
export class AuthCallbackComponent implements OnInit, OnDestroy {
  hasError = false;
  dots = '';

  private dotsInterval?: ReturnType<typeof setInterval>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private userService: UserService,
    private toastService: ToastService,
  ) { }

  ngOnInit(): void {
    this.dotsInterval = setInterval(() => {
      this.dots = this.dots.length >= 3 ? '' : this.dots + '.';
    }, 400);

    const { code, state } = this.route.snapshot.queryParams;
    const provider = this.route.snapshot.data['provider'] as 'google' | '42' | 'facebook';

    if (!code || !state) {
      this.hasError = true;
      this.toastService.error($localize`:@@toast.authCallback.missingData:Missing authentication data.`);
      setTimeout(() => this.router.navigate(['/login']), 2000);
      return;
    }

    let callback$: ReturnType<typeof this.authService.handleGoogleCallback>;
    switch (provider) {
      case 'google':
        callback$ = this.authService.handleGoogleCallback(code, state);
        break;
      case '42':
        callback$ = this.authService.handleIntraCallback(code, state);
        break;
      case 'facebook':
        callback$ = this.authService.handleFacebookCallback(code, state);
        break;
      default:
        this.hasError = true;
        this.toastService.error($localize`:@@toast.authCallback.missingData:Missing authentication data.`);
        setTimeout(() => this.router.navigate(['/login']), 2000);
        return;
    }

    callback$.subscribe({
      next: () => {
        this.userService.loadCurrentUser();
        this.toastService.success($localize`:@@toast.login.success:Logged in successfully.`);
        this.router.navigate(['/']);
      },
      error: (err: ErrorResponse) => {
        this.hasError = true;
        this.toastService.error(err.message ?? $localize`:@@toast.authCallback.error:${provider}:INTERPOLATION: login failed.`);
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.dotsInterval);
  }
}

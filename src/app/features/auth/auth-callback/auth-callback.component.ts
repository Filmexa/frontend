import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
import { UserService } from '../../../core/services/user/user.service';
import { ErrorResponse } from '../../../shared/interfaces/ErrorResponse';

@Component({
  selector: 'app-auth-callback',
  imports: [],
  templateUrl: './auth-callback.component.html',
  styleUrl: './auth-callback.component.css',
})
export class AuthCallbackComponent implements OnInit, OnDestroy {
  errorMessage = '';
  dots = '';

  private dotsInterval?: ReturnType<typeof setInterval>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private userService: UserService,
  ) { }

  ngOnInit(): void {
    this.dotsInterval = setInterval(() => {
      this.dots = this.dots.length >= 3 ? '' : this.dots + '.';
    }, 400);

    const { code, state } = this.route.snapshot.queryParams;
    const provider = this.route.snapshot.data['provider'] as 'google' | 'intra';

    if (!code || !state) {
      this.errorMessage = 'Missing authentication data.';
      setTimeout(() => this.router.navigate(['/login']), 2000);
      return;
    }

    const callback$ = provider === 'google'
      ? this.authService.handleGoogleCallback(code, state)
      : this.authService.handleIntraCallback(code, state);

    callback$.subscribe({
      next: () => {
        this.userService.loadCurrentUser();
        this.router.navigate(['/']);
      },
      error: (err: ErrorResponse) => {
        this.errorMessage = err.message ?? `${provider} login failed.`;
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.dotsInterval);
  }
}

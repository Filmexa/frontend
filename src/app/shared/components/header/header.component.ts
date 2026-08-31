import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
import { UserService } from '../../../core/services/user/user.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  protected mobileMenuOpen = signal(false);

  constructor(
    protected authService: AuthService,
    protected userService: UserService,
    private router: Router,
  ) {
    if (this.authService.isLoggedIn()) {
      this.userService.loadCurrentUser();
    }
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  onLogout(): void {
    this.authService.logout().subscribe(() => {
      this.userService.clearUser();
      this.router.navigate(['/']);
    });
  }
}

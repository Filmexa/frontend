import { Component } from '@angular/core';
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
  constructor(
    protected authService: AuthService,
    protected userService: UserService,
    private router: Router,
  ) {
    if (this.authService.isLoggedIn()) {
      this.userService.loadCurrentUser();
    }
  }

  onLogout(): void {
    this.authService.logout().subscribe(() => {
      this.userService.clearUser();
      this.router.navigate(['/']);
    });
  }
}

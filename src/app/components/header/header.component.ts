import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  constructor(
    protected authService: AuthService,
    private router: Router,
  ) { }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}

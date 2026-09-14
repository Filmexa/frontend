import { Component, ElementRef, HostListener, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
import { UserService } from '../../../core/services/user/user.service';
import { MovieService } from '../../../core/services/movie/movie.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  protected mobileMenuOpen = signal(false);
  protected browseOpen = signal(false);
  protected readonly categories: readonly string[];

  constructor(
    protected authService: AuthService,
    protected userService: UserService,
    private movieService: MovieService,
    private router: Router,
    private elementRef: ElementRef<HTMLElement>,
  ) {
    this.categories = this.movieService.getCategories();

    if (this.authService.isLoggedIn()) {
      this.userService.loadCurrentUser();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.browseOpen.set(false);
    }
  }

  toggleBrowse(): void {
    this.browseOpen.update((open) => !open);
  }

  closeBrowse(): void {
    this.browseOpen.set(false);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
    this.browseOpen.set(false);
  }

  onLogout(): void {
    this.authService.logout().subscribe(() => {
      this.userService.clearUser();
      this.router.navigate(['/']);
    });
  }
}

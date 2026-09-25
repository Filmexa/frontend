import { Component, effect, ElementRef, HostListener, signal, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
import { UserService } from '../../../core/services/user/user.service';
import { MovieCategoryService } from '../../../core/services/movie/movie-category.service';
import { MovieCategoryResponse } from '../../../core/interfaces/movie/MovieCategoryResponse';
import { ErrorResponse } from '../../interfaces/ErrorResponse';
import { ToastService } from '../../services/toast/toast.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  protected mobileMenuOpen = signal(false);
  protected browseOpen = signal(false);
  protected categories: MovieCategoryResponse[] = [];

  constructor(
    protected authService: AuthService,
    protected userService: UserService,
    private movieCategoryService: MovieCategoryService,
    private toastService: ToastService,
    private router: Router,
    private elementRef: ElementRef<HTMLElement>,
  ) {
    if (this.authService.isLoggedIn()) {
      this.userService.loadCurrentUser();
    }

    // The header lives in the root component and is created before login,
    // so react to auth changes instead of only checking once at construction.
    effect(() => {
      if (this.authService.isLoggedIn()) {
        untracked(() => this.loadCategories());
      } else {
        this.categories = [];
      }
    });
  }

  private loadCategories(): void {
    this.movieCategoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error: ErrorResponse) => {
        this.toastService.error(
          error.message ?? $localize`:@@toast.header.categoriesError:Failed to load movie categories.`
        );
      },
    });
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
      this.router.navigate(['/login']);
    });
  }
}

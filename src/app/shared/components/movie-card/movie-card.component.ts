import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Movie } from '../../../core/interfaces/movie/Movie';
import { AuthService } from '../../../core/services/auth/auth.service';

@Component({
  selector: 'app-movie-card',
  imports: [],
  templateUrl: './movie-card.component.html',
  styleUrl: './movie-card.component.css'
})
export class MovieCardComponent {
  @Input({ required: true }) movie!: Movie;

  readonly defaultPoster = '/assets/default-movie.svg';

  constructor(
    private router: Router,
    private authService: AuthService,
  ) { }

  goToDetails(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.router.navigate(['/movie', this.movie.id]);
  }

  get posterUrl(): string {
    return this.movie.poster?.trim() || this.defaultPoster;
  }

  useDefaultPoster(event: Event): void {
    const image = event.target as HTMLImageElement;
    if (!image.src.endsWith(this.defaultPoster)) {
      image.src = this.defaultPoster;
    }
  }
}

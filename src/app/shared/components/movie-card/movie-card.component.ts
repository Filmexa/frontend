import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Movie } from '../../../core/interfaces/movie/Movie';
import { AuthService } from '../../../core/services/auth/auth.service';
import { ToastService } from '../../services/toast/toast.service';

@Component({
  selector: 'app-movie-card',
  imports: [],
  templateUrl: './movie-card.component.html',
  styleUrl: './movie-card.component.css'
})
export class MovieCardComponent {
  @Input({ required: true }) movie!: Movie;

  constructor(
    private router: Router,
    private authService: AuthService,
    private toastService: ToastService,
  ) { }

  goToDetails(): void {
    if (!this.authService.isLoggedIn()) {
      this.toastService.error(
        $localize`:@@toast.movieCard.signInRequired:Please sign in to view movie details.`
      );
      return;
    }

    this.router.navigate(['/movie', this.movie.id]);
  }
}

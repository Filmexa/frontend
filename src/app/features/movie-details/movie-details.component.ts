import { Component, signal } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Movie } from '../../core/interfaces/movie/Movie';
import { MovieService } from '../../core/services/movie/movie.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { CommentsComponent } from './components/comments/comments.component';
import { ActorRowComponent } from './components/actor-row/actor-row.component';

@Component({
  selector: 'app-movie-details',
  imports: [ActorRowComponent, CommentsComponent],
  templateUrl: './movie-details.component.html',
  styleUrl: './movie-details.component.css'
})
export class MovieDetailsComponent {
  movie?: Movie;
  readonly isPlaying = signal(false);
  readonly isLoading = signal(true);

  constructor(
    private route: ActivatedRoute,
    private movieService: MovieService,
    private authService: AuthService,
    private location: Location,
  ) {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      this.isPlaying.set(false);
      this.isLoading.set(true);
      this.movie = undefined;

      this.movieService.getMovieDetails(id).subscribe({
        next: (movie) => this.setMovie(movie),
        error: () => this.setMovie(undefined),
      });
    });
  }

  private setMovie(movie: Movie | undefined): void {
    this.movie = movie;
    this.isLoading.set(false);
  }

  play(): void {
    this.isPlaying.set(true);
  }

  goBack(): void {
    this.location.back();
  }

}

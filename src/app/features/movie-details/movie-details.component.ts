import { Component, signal } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Movie } from '../../core/interfaces/movie/Movie';
import { HeroMovie } from '../../core/interfaces/movie/HeroMovie';
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
        error: () => this.loadFallbackMovie(id),
      });
    });
  }

  private setMovie(movie: Movie | undefined): void {
    this.movie = movie;
    this.isLoading.set(false);
  }

  private loadFallbackMovie(id: number): void {
    const direct = this.movieService.getMovieById(id);
    if (direct) {
      this.setMovie(direct);
      return;
    }

    this.movieService.getTopMovies().subscribe({
      next: (heroMovies) => {
        const hero = heroMovies.find((movie) => movie.id === id);
        this.setMovie(hero ? this.fromHeroMovie(hero) : undefined);
      },
      error: () => this.setMovie(undefined),
    });
  }

  play(): void {
    this.isPlaying.set(true);
  }

  goBack(): void {
    this.location.back();
  }

  private fromHeroMovie(hero: HeroMovie): Movie {
    return {
      id: hero.id,
      title: hero.title,
      poster: hero.thumbnail,
      backdrop: hero.backdrop,
      year: hero.year,
      rating: 0,
      duration: '',
      genres: hero.genres,
      description: hero.description,
      category: hero.genres[0] ?? 'Trending Now',
      actors: [],
    };
  }
}

import { Component, signal } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Movie } from '../../core/interfaces/movie/Movie';
import { HeroMovie } from '../../core/interfaces/movie/HeroMovie';
import { MovieService } from '../../core/services/movie/movie.service';
import { MyListService } from '../../core/services/movie/my-list.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { MovieRowComponent } from '../home/components/movie-row/movie-row.component';
import { CommentsComponent } from './components/comments/comments.component';

@Component({
  selector: 'app-movie-details',
  imports: [MovieRowComponent, CommentsComponent],
  templateUrl: './movie-details.component.html',
  styleUrl: './movie-details.component.css'
})
export class MovieDetailsComponent {
  movie?: Movie;
  moreLikeThis: Movie[] = [];
  readonly isPlaying = signal(false);

  constructor(
    private route: ActivatedRoute,
    private movieService: MovieService,
    protected myListService: MyListService,
    protected authService: AuthService,
    private location: Location,
  ) {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      this.isPlaying.set(false);
      this.moreLikeThis = [];

      const direct = this.movieService.getMovieById(id);
      if (direct) {
        this.setMovie(direct);
        return;
      }

      this.movieService.getTopMovies().subscribe((heroMovies) => {
        const hero = heroMovies.find((m) => m.id === id);
        this.setMovie(hero ? this.fromHeroMovie(hero) : undefined);
      });
    });
  }

  private setMovie(movie: Movie | undefined): void {
    this.movie = movie;
    if (movie) {
      this.movieService.getMoviesByCategory(movie.category, 0, 20).subscribe((page) => {
        this.moreLikeThis = page.content.filter((m) => m.id !== movie.id);
      });
    }
  }

  play(): void {
    this.isPlaying.set(true);
  }

  toggleMyList(): void {
    if (this.movie && this.authService.isLoggedIn()) {
      this.myListService.toggle(this.movie.id);
    }
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
    };
  }
}

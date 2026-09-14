import { Component, signal } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Movie } from '../../core/interfaces/movie/Movie';
import { HeroMovie } from '../../core/interfaces/movie/HeroMovie';
import { MovieService } from '../../core/services/movie/movie.service';
import { HeroService } from '../../core/services/movie/hero.service';
import { MyListService } from '../../core/services/movie/my-list.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { MovieRowComponent } from '../home/components/movie-row/movie-row.component';

@Component({
  selector: 'app-movie-details',
  imports: [MovieRowComponent],
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
    private heroService: HeroService,
    protected myListService: MyListService,
    protected authService: AuthService,
    private location: Location,
  ) {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      this.movie = this.movieService.getMovieById(id) ?? this.fromHeroMovie(id);
      this.isPlaying.set(false);
      this.moreLikeThis = [];

      if (this.movie) {
        this.movieService.getMoviesByCategory(this.movie.category, 0, 20).subscribe((page) => {
          this.moreLikeThis = page.content.filter((m) => m.id !== this.movie!.id);
        });
      }
    });
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

  private fromHeroMovie(id: number): Movie | undefined {
    const hero = this.heroService.getTopMovies().find((m: HeroMovie) => m.id === id);
    if (!hero) {
      return undefined;
    }

    return {
      id: hero.id,
      title: hero.title,
      poster: hero.backdrop,
      backdrop: hero.backdrop,
      type: 'movie',
      year: hero.year,
      rating: Math.round(hero.rating * 10),
      duration: hero.duration,
      genres: hero.genres,
      description: hero.description,
      category: hero.genres[0] ?? 'Trending Now',
    };
  }
}

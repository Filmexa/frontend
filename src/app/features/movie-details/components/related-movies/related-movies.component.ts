import { Component, Input, OnChanges, OnDestroy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { of, Subscription, switchMap } from 'rxjs';
import { Movie } from '../../../../core/interfaces/movie/Movie';
import { MovieCategoryService } from '../../../../core/services/movie/movie-category.service';
import { MovieService } from '../../../../core/services/movie/movie.service';

@Component({
  selector: 'app-related-movies',
  imports: [RouterLink],
  templateUrl: './related-movies.component.html',
  styleUrl: './related-movies.component.css',
})
export class RelatedMoviesComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) movie!: Movie;

  readonly movies = signal<Movie[]>([]);
  readonly loading = signal(false);
  readonly defaultPoster = '/assets/default-movie.svg';

  private subscription?: Subscription;

  constructor(
    private movieCategoryService: MovieCategoryService,
    private movieService: MovieService,
  ) { }

  ngOnChanges(): void {
    this.loadRelatedMovies();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  useDefaultPoster(event: Event): void {
    const image = event.target as HTMLImageElement;
    if (!image.src.endsWith(this.defaultPoster)) {
      image.src = this.defaultPoster;
    }
  }

  private loadRelatedMovies(): void {
    this.subscription?.unsubscribe();
    this.movies.set([]);

    const genreName = this.movie.genres[0] ?? this.movie.category;
    if (!genreName) {
      return;
    }

    this.loading.set(true);
    this.subscription = this.movieCategoryService.getCategories().pipe(
      switchMap((categories) => {
        const normalizedGenre = this.normalize(genreName);
        const category = categories.find((item) => this.normalize(item.name) === normalizedGenre);
        return category
          ? this.movieService.getMoviesByGenre(category.genreId, category.name, 0, 12)
          : of(undefined);
      }),
    ).subscribe({
      next: (result) => {
        this.movies.set(result?.content.filter((movie) => movie.id !== this.movie.id) ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private normalize(value: string): string {
    return value.normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  }
}

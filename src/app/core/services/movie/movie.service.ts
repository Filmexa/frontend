import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Movie } from '../../interfaces/movie/Movie';
import { MovieSearchFilters } from '../../interfaces/movie/MovieSearchFilters';
import { MovieSummaryResponse } from '../../interfaces/movie/MovieSummaryResponse';
import { Page } from '../../../shared/interfaces/Page';
import { ErrorResponse } from '../../../shared/interfaces/ErrorResponse';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../user/user.service';
import { LanguageService } from '../language/language.service';
import { HeroMovieResponse } from '../../interfaces/movie/HeroMovieResponse';
import { HeroMovie } from '../../interfaces/movie/HeroMovie';
import { MovieDetailsResponse } from '../../interfaces/movie/MovieDetailsResponse';
import { GenreMoviesResponse } from '../../interfaces/movie/GenreMoviesResponse';

const CATEGORIES = [
  'Trending Now', 'Popular Movies', 'Action', 'Comedy', 'Horror', 'Drama', 'Romance',
  'Sci-Fi', 'Thriller', 'Animation', 'Documentary', 'Fantasy', 'Crime', 'Adventure',
  'Family', 'Mystery',
] as const;

const TITLE_POOL = [
  'Moana', 'Mayday', 'Lanterns', 'Spider-Man', 'The Odyssey', 'Reacher', 'One Night Only',
  'Practical Magic', 'Silo', 'Mutiny', 'Runner', 'Obsession', 'Lioness', 'Drawn Together',
  'The Bombing', 'Coyote vs. Acme', 'Colony', 'Mongoose', 'Ghost in the Cell', 'Shape of My Heart',
];

const DURATION_POOL = ['1h 32m', '1h 48m', '1h 55m', '2h 5m', '2h 18m', '2h 32m', '2h 49m'];

const GENRE_POOL = [
  'Action', 'Adventure', 'Comedy', 'Crime', 'Drama', 'Fantasy', 'Horror', 'Mystery',
  'Romance', 'Sci-Fi', 'Thriller', 'Animation', 'Documentary', 'Family',
];

const ACTOR_NAMES = [
  'Alex Morgan', 'Jamie Chen', 'Samira Cole', 'Noah Bennett',
  'Maya Laurent', 'Elias Stone', 'Sofia Reyes', 'Daniel Kim',
];

@Injectable({
  providedIn: 'root'
})
export class MovieService {
  private readonly apiUrl = `${environment.apiUrl}/movies`;

  private readonly moviesByCategory = new Map<string, Movie[]>(
    CATEGORIES.map((category, categoryIndex) => [
      category,
      this.generateMovies(category, categoryIndex, 100),
    ]),
  );

  private readonly moviesById = new Map<number, Movie>(
    Array.from(this.moviesByCategory.values())
      .flat()
      .map((movie) => [movie.id, movie]),
  );

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private userService: UserService,
    private languageService: LanguageService,
  ) { }

  getHomeCategories(): Observable<Record<string, Movie[]>> {
    return this.http.get<Record<string, MovieSummaryResponse[]>>(`${this.apiUrl}/home`, {
      params: { language: this.resolveLanguage() },
    }).pipe(
      map((categories) => this.toMovieMap(categories)),
      catchError(this.mapError),
    );
  }

  private authHeaders(): HttpHeaders {
    const token = this.authService.getAccessToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  getTopMovies(): Observable<HeroMovie[]> {
    return this.http.get<HeroMovieResponse[]>(`${this.apiUrl}/trending/week`, {
      params: { language: this.resolveLanguage() },
    }).pipe(
      map((movies) => movies.map((movie) => this.toHeroMovie(movie))),
      catchError(this.mapError),
    );
  }

  getMovieDetails(id: number, page: number = 0, size: number = 1, sort?: string): Observable<Movie> {
    const params: Record<string, string | number> = {
      language: this.resolveLanguage(),
      page,
      size,
    };

    if (sort) {
      params['sort'] = sort;
    }

    return this.http.get<MovieDetailsResponse>(`${this.apiUrl}/${id}`, {
      params,
      headers: this.authHeaders(),
    }).pipe(
      map((movie) => this.toMovieDetails(movie)),
      catchError(this.mapError),
    );
  }

  getMoviesByGenre(
    genreId: number,
    category: string,
    page: number = 0,
    size: number = 20,
    sort?: string,
  ): Observable<Page<Movie>> {
    const params: Record<string, string | number> = {
      language: this.resolveLanguage(),
      page,
      size,
    };

    if (sort) {
      params['sort'] = sort;
    }

    return this.http.get<GenreMoviesResponse>(`${this.apiUrl}/genre/${genreId}`, {
      params,
    }).pipe(
      map((response) => ({
        content: response.movies.map((movie) => this.toMovie(movie, category)),
        totalElements: response.totalResults,
        totalPages: response.totalPages,
        number: Math.max(0, response.page - 1),
        size,
      })),
      catchError(this.mapError),
    );
  }

  private toHeroMovie(movie: HeroMovieResponse): HeroMovie {
    return {
      id: movie.id,
      title: movie.title,
      description: movie.overview,
      thumbnail: movie.thumbnail,
      backdrop: movie.backdropUrl,
      year: new Date(movie.releaseDate).getFullYear(),
      genres: movie.genres,
    };
  }

  private toMovieDetails(movie: MovieDetailsResponse): Movie {
    return {
      id: movie.id,
      title: movie.title,
      poster: movie.backdropPath,
      backdrop: movie.backdropPath,
      year: this.releaseYear(movie.releaseDate),
      rating: 0,
      duration: '',
      genres: movie.genres ?? [],
      description: movie.overview,
      category: movie.genres?.[0] ?? '',
      actors: movie.actors ?? [],
      imdbId: movie.imdbId,
    };
  }

  getCategories(): readonly string[] {
    return CATEGORIES;
  }

  getGenres(): readonly string[] {
    return GENRE_POOL;
  }

  getAllMovies(): Movie[] {
    return Array.from(this.moviesById.values());
  }

  /**
   * Mimics a paginated API response (see `Page<T>`) so this can be swapped for a real
   * HTTP call later without touching callers.
   */
  getMoviesByCategory(category: string, page: number = 0, size: number = 20): Observable<Page<Movie>> {
    const all = this.moviesByCategory.get(category) ?? [];
    const start = page * size;
    const content = all.slice(start, start + size);

    const response: Page<Movie> = {
      content,
      totalElements: all.length,
      totalPages: Math.max(1, Math.ceil(all.length / size)),
      number: page,
      size,
    };

    return of(response).pipe(delay(300));
  }

  getMovieById(id: number): Movie | undefined {
    return this.moviesById.get(id);
  }

  /**
   * Mimics a search API call: filtering/sorting happens here so the caller only ever
   * sends filter criteria and receives results, matching how a real endpoint would work.
   */
  searchMovies(filters: MovieSearchFilters): Observable<Movie[]> {
    const query = filters.query?.trim().toLowerCase() ?? '';

    const filtered = this.getAllMovies().filter((movie) => {
      const matchesQuery = !query || movie.title.toLowerCase().includes(query);
      const matchesGenre = !filters.genre || filters.genre === 'all' || movie.genres.includes(filters.genre);
      const matchesRating = filters.minRating === undefined || movie.rating >= filters.minRating;
      const matchesYear = filters.year === undefined || movie.year === filters.year;
      return matchesQuery && matchesGenre && matchesRating && matchesYear;
    });

    const sorted = this.sortMovies(filtered, filters.sort ?? 'popular');
    return of(sorted).pipe(delay(300));
  }

  private sortMovies(movies: Movie[], sort: MovieSearchFilters['sort']): Movie[] {
    const sorted = [...movies];

    switch (sort) {
      case 'newest':
        return sorted.sort((a, b) => b.year - a.year);
      case 'oldest':
        return sorted.sort((a, b) => a.year - b.year);
      case 'title':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case 'popular':
      default:
        return sorted.sort((a, b) => b.rating - a.rating);
    }
  }

  private generateMovies(category: string, categoryIndex: number, count: number = 20): Movie[] {
    return Array.from({ length: count }, (_, i) => {
      const id = categoryIndex * 100 + i + 1;
      const title = TITLE_POOL[(i + categoryIndex * 3) % TITLE_POOL.length];
      const seed = encodeURIComponent(category.toLowerCase().replace(/\s+/g, '-'));

      return {
        id,
        title,
        poster: `https://picsum.photos/seed/${seed}-${i}/300/450`,
        backdrop: `https://picsum.photos/seed/${seed}-${i}-backdrop/1280/720`,
        year: 2000 + ((categoryIndex * 7 + i * 3) % 26),
        rating: 60 + ((categoryIndex * 11 + i * 5) % 40),
        duration: DURATION_POOL[(categoryIndex + i) % DURATION_POOL.length],
        genres: [
          GENRE_POOL[(categoryIndex + i) % GENRE_POOL.length],
          GENRE_POOL[(categoryIndex + i + 3) % GENRE_POOL.length],
          GENRE_POOL[(categoryIndex + i + 6) % GENRE_POOL.length],
        ],
        description:
          `${title} follows a group of unlikely heroes as they navigate danger, betrayal and ` +
          `unexpected alliances in a story that blends ${category.toLowerCase()} with heart-pounding stakes.`,
        category,
        actors: ACTOR_NAMES.map((name, actorIndex) => ({
          id: id * 100 + actorIndex,
          name,
          profile: `https://picsum.photos/seed/actor-${id}-${actorIndex}/300/300`,
          character: actorIndex === 0 ? 'Lead' : `Character ${actorIndex + 1}`,
        })),
      };
    });
  }

  private toMovieMap(categories: Record<string, MovieSummaryResponse[]>): Record<string, Movie[]> {
    const result: Record<string, Movie[]> = {};
    for (const [category, movies] of Object.entries(categories)) {
      result[category] = movies.map((movie) => this.toMovie(movie, category));
    }
    return result;
  }

  private toMovie(movie: MovieSummaryResponse, category: string): Movie {
    return {
      id: movie.id,
      title: movie.title,
      poster: movie.thumbnail,
      backdrop: movie.thumbnail,
      year: new Date(movie.releaseDate).getFullYear(),
      rating: 0,
      duration: '',
      genres: [],
      description: '',
      category,
      actors: [],
    };
  }

  private resolveLanguage(): string {
    if (this.authService.isLoggedIn()) {
      const preferredLanguage = this.userService.profile()?.preferredLanguage;
      const locale = this.languageService.localeFromPreferredLanguage(preferredLanguage);
      if (locale) {
        return locale;
      }
    }
    return this.languageService.currentLocale;
  }

  private releaseYear(releaseDate: string): number {
    const year = new Date(releaseDate).getFullYear();
    return Number.isNaN(year) ? 0 : year;
  }

  private mapError(error: HttpErrorResponse) {
    let body = error.error;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = null;
      }
    }

    const errorResponse: ErrorResponse = {
      status: error.status,
      message: body?.message ?? error.message,
    };
    return throwError(() => errorResponse);
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
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

@Injectable({
  providedIn: 'root'
})
export class MovieService {
  private readonly apiUrl = `${environment.apiUrl}/movies`;
  private readonly searchApiUrl = `${environment.apiUrl}/search/movie`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private userService: UserService,
    private languageService: LanguageService,
  ) { }

  getHomeCategories(): Observable<Record<string, Movie[]>> {
    return this.http.get<Record<string, MovieSummaryResponse[]>>(`${this.apiUrl}/home`, {
      params: { language: this.resolveLanguage() },
      headers: this.authHeaders(),
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
      headers: this.authHeaders(),
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
      headers: this.authHeaders(),
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
      rating: this.toRating(movie.rating),
      trailerUrl: this.youtubeTrailerUrl(movie.trailerUrl ?? movie.trailer),
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
      rating: this.toRating(movie.rating),
      duration: '',
      genres: movie.genres ?? [],
      description: movie.overview,
      category: movie.genres?.[0] ?? '',
      actors: movie.actors ?? [],
      imdbId: movie.imdbId,
      trailer: this.youtubeTrailerUrl(movie.trailer),
    };
  }

  searchMovies(
    filters: MovieSearchFilters,
    page: number = 0,
    size: number = 20,
  ): Observable<Page<Movie>> {
    const params: Record<string, string | number> = {
      language: this.resolveLanguage(),
      sortBy: this.toSearchSort(filters.sort ?? 'popularity'),
      page,
      size,
    };

    const query = filters.query?.trim();
    if (query) {
      params['query'] = query;
    }
    if (filters.genreId !== undefined) {
      params['genreId'] = filters.genreId;
    }
    if (filters.year !== undefined) {
      params['year'] = filters.year;
    }
    if (filters.minRating !== undefined) {
      params['minRating'] = filters.minRating;
    }

    return this.http.get<GenreMoviesResponse>(this.searchApiUrl, {
      params,
      headers: this.authHeaders(),
    }).pipe(
      map((response) => ({
        content: response.movies.map((movie) => this.toMovie(movie, 'Search')),
        totalElements: response.totalResults,
        totalPages: response.totalPages,
        number: response.page,
        size,
      })),
      catchError(this.mapError),
    );
  }

  private toSearchSort(sort: MovieSearchFilters['sort']): string {
    switch (sort) {
      case 'rating':
        return 'RATING';
      case 'releaseDate':
        return 'RELEASE_DATE';
      case 'popularity':
      default:
        return 'POPULARITY';
    }
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
      rating: this.toRating(movie.rating),
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

  private toRating(rating: number | undefined | null): number {
    if (rating === undefined || rating === null || !Number.isFinite(rating)) {
      return 0;
    }

    return Math.min(10, Math.max(0, rating));
  }

  private youtubeTrailerUrl(trailer: string | undefined | null): string | undefined {
    if (!trailer) {
      return undefined;
    }

    try {
      const url = new URL(trailer);
      const hostname = url.hostname.replace(/^www\./, '');
      return hostname === 'youtube.com' || hostname === 'youtu.be' ? url.toString() : undefined;
    } catch {
      return undefined;
    }
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

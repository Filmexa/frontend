import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Page } from '../../../shared/interfaces/Page';
import { ErrorResponse } from '../../../shared/interfaces/ErrorResponse';
import { AddToMyListRequest } from '../../interfaces/movie/AddToMyListRequest';
import { Movie } from '../../interfaces/movie/Movie';
import { MyListItemResponse } from '../../interfaces/movie/MyListItemResponse';
import { AuthService } from '../auth/auth.service';
import { LanguageService } from '../language/language.service';

@Injectable({ providedIn: 'root' })
export class MyListService {
  private readonly apiUrl = `${environment.apiUrl}/my-list`;
  private readonly movieIds = signal<number[]>([]);

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private languageService: LanguageService,
  ) { }

  isInList(movieId: number): boolean {
    return this.movieIds().includes(movieId);
  }

  getMyList(page: number = 0, size: number = 20): Observable<Page<Movie>> {
    return this.http.get<Page<MyListItemResponse>>(this.apiUrl, {
      headers: this.authHeaders(),
      params: { page, size },
    }).pipe(
      tap((response) => this.rememberIds(response.content.map((item) => item.movieId), page === 0)),
      map((response) => ({
        ...response,
        content: response.content.map((item) => this.toMovie(item)),
      })),
      catchError(this.mapError),
    );
  }

  loadMembership(): Observable<void> {
    return this.http.get<Page<MyListItemResponse>>(this.apiUrl, {
      headers: this.authHeaders(),
      params: { page: 0, size: 1000 },
    }).pipe(
      tap((response) => this.rememberIds(response.content.map((item) => item.movieId), true)),
      map(() => undefined),
      catchError(this.mapError),
    );
  }

  add(movieId: number): Observable<MyListItemResponse> {
    const request: AddToMyListRequest = {
      movieId,
      language: this.languageService.currentLocale,
    };
    return this.http.post<MyListItemResponse>(this.apiUrl, request, {
      headers: this.authHeaders(),
    }).pipe(
      tap(() => this.rememberIds([movieId])),
      catchError(this.mapError),
    );
  }

  remove(movieId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${movieId}`, {
      headers: this.authHeaders(),
    }).pipe(
      tap(() => this.movieIds.update((ids) => ids.filter((id) => id !== movieId))),
      catchError(this.mapError),
    );
  }

  private rememberIds(movieIds: number[], replace: boolean = false): void {
    this.movieIds.update((current) => replace
      ? [...new Set(movieIds)]
      : [...new Set([...current, ...movieIds])]);
  }

  private toMovie(item: MyListItemResponse): Movie {
    const year = new Date(item.releaseDate).getFullYear();
    return {
      id: item.movieId,
      title: item.title,
      poster: item.posterUrl ?? '',
      backdrop: item.posterUrl ?? '',
      year: Number.isNaN(year) ? 0 : year,
      rating: item.rating === null ? 0 : Math.min(10, Math.max(0, item.rating)),
      duration: '',
      genres: [],
      description: '',
      category: '',
      actors: [],
    };
  }

  private authHeaders(): HttpHeaders {
    const token = this.authService.getAccessToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  private mapError(error: HttpErrorResponse) {
    let body = error.error;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = null; }
    }
    const response: ErrorResponse = {
      status: error.status,
      message: body?.message ?? error.message,
    };
    return throwError(() => response);
  }
}

import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, filter, mergeMap, Observable, of, switchMap, take, takeWhile, tap, throwError, timer } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { StreamSession } from '../../interfaces/stream/StreamSession';
import { ErrorResponse } from '../../../shared/interfaces/ErrorResponse';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class StreamService {
  private readonly apiUrl = `${environment.apiUrl}/stream`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) { }

  createSession(movieId: number, imdbId: string): Observable<StreamSession> {
    const token = this.authService.getAccessToken();
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : undefined;

    return this.http.post<StreamSession>(
      `${this.apiUrl}/${movieId}/session`,
      {},
      {
        headers,
        params: { imdbId },
      },
    ).pipe(catchError(this.mapError));
  }

  waitUntilReady(
    movieId: number,
    imdbId: string,
    onUpdate?: (session: StreamSession) => void,
  ): Observable<StreamSession> {
    return timer(0, 2000).pipe(
      switchMap(() => this.createSession(movieId, imdbId)),
      tap((session) => onUpdate?.(session)),
      mergeMap((session) => session.downloadStatus === 'FAILED'
        ? throwError((): ErrorResponse => ({ status: 0, message: 'Movie download failed.' }))
        : of(session)),
      filter((session) => session.state === 'READY'),
      take(1),
    );
  }

  watchProgress(movieId: number, imdbId: string): Observable<StreamSession> {
    return timer(2000, 2000).pipe(
      switchMap(() => this.createSession(movieId, imdbId)),
      mergeMap((session) => session.downloadStatus === 'FAILED'
        ? throwError((): ErrorResponse => ({ status: 0, message: 'Movie download failed.' }))
        : of(session)),
      filter((session) => session.state === 'READY'),
      takeWhile((session) => session.downloadStatus !== 'COMPLETED', true),
    );
  }

  absoluteManifestUrl(session: StreamSession): string {
    const manifest = session.manifestUrl ||
      `/api/stream/${session.movieId}/master.m3u8?token=${encodeURIComponent(session.token ?? '')}`;
    return this.absoluteMediaUrl(manifest);
  }

  absoluteMediaUrl(url: string): string {
    return new URL(url, `${environment.apiUrl}/`).toString();
  }

  private mapError(error: HttpErrorResponse) {
    const body = error.error;
    const response: ErrorResponse = {
      status: error.status,
      message: typeof body === 'object' && body?.message ? body.message : error.message,
    };
    return throwError(() => response);
  }
}

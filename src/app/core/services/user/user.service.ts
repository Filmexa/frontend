import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, tap, catchError, throwError, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { UserProfileResponse } from '../../interfaces/user/UserProfileResponse';
import { UpdateProfileRequest } from '../../interfaces/user/UpdateProfileRequest';
import { ChangePreferredLanguageRequest } from '../../interfaces/user/ChangePreferredLanguageRequest';
import { ChangeEmailRequest } from '../../interfaces/user/ChangeEmailRequest';
import { ConfirmEmailChangeRequest } from '../../interfaces/user/ConfirmEmailChangeRequest';
import { ErrorResponse } from '../../../shared/interfaces/ErrorResponse';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = `${environment.apiUrl}/users`;

  readonly profile = signal<UserProfileResponse | null>(null);
  readonly avatarUrl = signal<string | null>(null);

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) { }

  loadCurrentUser(): void {
    this.getProfile().subscribe();
    this.getAvatar().subscribe();
  }

  getProfile(): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(`${this.apiUrl}/me/profile`, { headers: this.authHeaders() }).pipe(
      tap((profile) => this.profile.set(profile)),
      catchError(this.mapError),
    );
  }

  getAvatar(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/me/avatar`, { headers: this.authHeaders(), responseType: 'blob' }).pipe(
      tap((blob) => this.setAvatar(blob)),
      catchError(() => {
        this.setAvatar(null);
        return of(new Blob());
      }),
    );
  }

  updateProfile(request: UpdateProfileRequest): Observable<UserProfileResponse> {
    return this.http.patch<UserProfileResponse>(`${this.apiUrl}/me/profile`, request, { headers: this.authHeaders() }).pipe(
      tap((profile) => this.profile.set(profile)),
      catchError(this.mapError),
    );
  }

  updateAvatar(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.put(`${this.apiUrl}/me/avatar`, formData, { headers: this.authHeaders(), responseType: 'text' }).pipe(
      tap(() => this.getAvatar().subscribe()),
      catchError(this.mapError),
    );
  }

  changePreferredLanguage(request: ChangePreferredLanguageRequest): Observable<string> {
    return this.http.post(`${this.apiUrl}/change-preferred-language`, request, { headers: this.authHeaders(), responseType: 'text' }).pipe(
      catchError(this.mapError),
    );
  }

  changeEmail(request: ChangeEmailRequest): Observable<string> {
    return this.http.post(`${this.apiUrl}/change-email`, request, { headers: this.authHeaders(), responseType: 'text' }).pipe(
      catchError(this.mapError),
    );
  }

  confirmEmailChange(request: ConfirmEmailChangeRequest): Observable<string> {
    return this.http.post(`${this.apiUrl}/change-email/confirm`, request, { headers: this.authHeaders(), responseType: 'text' }).pipe(
      catchError(this.mapError),
    );
  }

  clearUser(): void {
    this.profile.set(null);
    this.setAvatar(null);
  }

  private setAvatar(blob: Blob | null): void {
    const current = this.avatarUrl();
    if (current) {
      URL.revokeObjectURL(current);
    }
    this.avatarUrl.set(blob ? URL.createObjectURL(blob) : null);
  }

  private authHeaders(): HttpHeaders {
    const token = this.authService.getAccessToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
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

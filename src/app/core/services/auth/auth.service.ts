import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, tap, catchError, of, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LoginRequest } from '../../interfaces/auth/LoginRequest';
import { AuthResponse } from '../../interfaces/auth/AuthResponse';
import { RegisterRequest } from '../../interfaces/auth/RegisterRequest';
import { ForgotPasswordRequest } from '../../interfaces/auth/ForgotPasswordRequest';
import { ResetPasswordRequest } from '../../interfaces/auth/ResetPasswordRequest';
import { VerifyEmailRequest } from '../../interfaces/auth/VerifyEmailRequest';
import { ErrorResponse } from '../../../shared/interfaces/ErrorResponse';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  private accessToken: string | null = null;

  readonly isLoggedIn = signal(false);

  constructor(private http: HttpClient) { }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request, { withCredentials: true }).pipe(
      tap((response) => this.setSession(response)),
      catchError(this.mapError),
    );
  }

  restoreSession(): Observable<AuthResponse | null> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, {}, { withCredentials: true }).pipe(
      tap((response) => this.setSession(response)),
      catchError(() => {
        this.clearSession();
        return of(null);
      }),
    );
  }

  logout(): Observable<void> {
    const headers = this.accessToken
      ? new HttpHeaders({ Authorization: `Bearer ${this.accessToken}` })
      : undefined;

    return this.http.post<void>(`${this.apiUrl}/logout`, {}, { headers, withCredentials: true }).pipe(
      tap(() => this.clearSession()),
      catchError(() => {
        this.clearSession();
        return of(void 0);
      }),
    );
  }

  private setSession(response: AuthResponse): void {
    this.accessToken = response.accessToken;
    this.isLoggedIn.set(true);
  }

  private clearSession(): void {
    this.accessToken = null;
    this.isLoggedIn.set(false);
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

  signup(request: RegisterRequest): Observable<string> {
    return this.http.post(`${this.apiUrl}/register`, request, { responseType: 'text' }).pipe(
      catchError(this.mapError),
    );
  }

  verify(request: VerifyEmailRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/verify`, request).pipe(
      catchError(this.mapError),
    );
  }

  resendVerification(request: ForgotPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/resend-verification`, request).pipe(
      catchError(this.mapError),
    );
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/forgot-password`, request).pipe(
      catchError(this.mapError),
    );
  }

  resendPasswordReset(request: ForgotPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/resend-password-reset`, request).pipe(
      catchError(this.mapError),
    );
  }

  resetPassword(request: ResetPasswordRequest): Observable<string> {
    return this.http.post(`${this.apiUrl}/reset-password`, request, { responseType: 'text' }).pipe(
      catchError(this.mapError),
    );
  }

  loginWithGoogle(): void {
    window.location.href = `${this.apiUrl}/google`;
  }

  loginWithIntra(): void {
    window.location.href = `${this.apiUrl}/42`;
  }

  handleGoogleCallback(code: string, state: string): Observable<AuthResponse> {
    return this.http.get<AuthResponse>(`${this.apiUrl}/google/callback`, {
      params: { code, state },
      withCredentials: true,
    }).pipe(
      tap((response) => this.setSession(response)),
      catchError(this.mapError),
    );
  }

  handleIntraCallback(code: string, state: string): Observable<AuthResponse> {
    return this.http.get<AuthResponse>(`${this.apiUrl}/42/callback`, {
      params: { code, state },
      withCredentials: true,
    }).pipe(
      tap((response) => this.setSession(response)),
      catchError(this.mapError),
    );
  }
}

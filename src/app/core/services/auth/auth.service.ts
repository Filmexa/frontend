import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LoginRequest } from '../../interfaces/auth/LoginRequest';
import { AuthResponse } from '../../interfaces/auth/AuthResponse';
import { RegisterRequest } from '../../interfaces/auth/RegisterRequest';
import { ForgotPasswordRequest } from '../../interfaces/auth/ForgotPasswordRequest';
import { ResetPasswordRequest } from '../../interfaces/auth/ResetPasswordRequest';
import { VerifyEmailRequest } from '../../interfaces/auth/VerifyEmailRequest';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  readonly isLoggedIn = signal(false);

  constructor(private http: HttpClient) { }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request).pipe(
      tap((response) => {
        this.accessToken = response.accessToken;
        this.refreshToken = response.refreshToken;
        this.isLoggedIn.set(true);
      }),
    );
  }

  logout(): Observable<void> {
    const headers = this.accessToken
      ? new HttpHeaders({ Authorization: `Bearer ${this.accessToken}` })
      : undefined;

    return this.http.post<void>(`${this.apiUrl}/logout`, {}, { headers }).pipe(
      tap(() => this.clearSession()),
      catchError(() => {
        this.clearSession();
        return of(void 0);
      }),
    );
  }

  private clearSession(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.isLoggedIn.set(false);
  }

  signup(request: RegisterRequest): Observable<string> {
    return this.http.post(`${this.apiUrl}/register`, request, { responseType: 'text' });
  }

  verify(request: VerifyEmailRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/verify`, request);
  }

  resendVerification(request: ForgotPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/resend-verification`, request);
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/forgot-password`, request);
  }

  resendPasswordReset(request: ForgotPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/resend-password-reset`, request);
  }

  resetPassword(request: ResetPasswordRequest): Observable<string> {
    return this.http.post(`${this.apiUrl}/reset-password`, request, { responseType: 'text' });
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
      tap((response) => {
        this.accessToken = response.accessToken;
        this.refreshToken = response.refreshToken;
        this.isLoggedIn.set(true);
      }),
    );
  }

  handleIntraCallback(code: string, state: string): Observable<AuthResponse> {
    return this.http.get<AuthResponse>(`${this.apiUrl}/42/callback`, {
      params: { code, state },
      withCredentials: true,
    }).pipe(
      tap((response) => {
        this.accessToken = response.accessToken;
        this.refreshToken = response.refreshToken;
        this.isLoggedIn.set(true);
      }),
    );
  }
}

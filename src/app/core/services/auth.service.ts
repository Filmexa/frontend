import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest } from '../interfaces/LoginRequest';
import { AuthResponse } from '../interfaces/AuthResponse';
import { RegisterRequest } from '../interfaces/RegisterRequest';
import { ForgotPasswordRequest } from '../interfaces/ForgotPasswordRequest';
import { ResetPasswordRequest } from '../interfaces/ResetPasswordRequest';


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

  signup(request: RegisterRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/register`, request);
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/forgot-password`, request);
  }

  resendPasswordReset(request: ForgotPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/resend-password-reset`, request);
  }

  resetPassword(request: ResetPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/reset-password`, request);
  }

  logout(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.isLoggedIn.set(false);
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

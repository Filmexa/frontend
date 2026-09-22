import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { MovieCategoryResponse } from '../../interfaces/movie/MovieCategoryResponse';
import { catchError, Observable, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ErrorResponse } from '../../../shared/interfaces/ErrorResponse';
import { AuthService } from '../auth/auth.service';
import { LanguageService } from '../language/language.service';
import { UserService } from '../user/user.service';


@Injectable({
  providedIn: 'root'
})
export class MovieCategoryService {
    private readonly apiUrl = `${environment.apiUrl}/movie-categories`;

    constructor(
      private http: HttpClient,
      private authService: AuthService,
      private languageService: LanguageService,
      private userService: UserService,
    ) { }

    getCategories(): Observable<MovieCategoryResponse[]> {
        return this.http.get<MovieCategoryResponse[]>(this.apiUrl, {
          params: {language: this.resolveLanguage()},
        }).pipe(
            catchError(this.mapError),
        );
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
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { MovieCategoryResponse } from '../../interfaces/movie/MovieCategoryResponse';
import { catchError, Observable, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ErrorResponse } from '../../../shared/interfaces/ErrorResponse';


@Injectable({
  providedIn: 'root'
})
export class MovieCategoryService {
    private readonly apiUrl = `${environment.apiUrl}/movie-categories`;

    constructor(
      private http: HttpClient
    ) { }

    getCategories(): Observable<MovieCategoryResponse[]> {
        return this.http.get<MovieCategoryResponse[]>(this.apiUrl).pipe(
            catchError(this.mapError),
        );
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
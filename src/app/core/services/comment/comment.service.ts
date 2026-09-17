import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CommentResponse } from '../../interfaces/comment/CommentResponse';
import { CreateCommentRequest } from '../../interfaces/comment/CreateCommentRequest';
import { UpdateCommentRequest } from '../../interfaces/comment/UpdateCommentRequest';
import { Page } from '../../../shared/interfaces/Page';
import { ErrorResponse } from '../../../shared/interfaces/ErrorResponse';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) { }

  getComments(movieId: number, page: number = 0, size: number = 20): Observable<Page<CommentResponse>> {
    return this.http.get<Page<CommentResponse>>(this.commentsUrl(movieId), {
      headers: this.authHeaders(),
      params: { page, size },
    }).pipe(
      catchError(this.mapError),
    );
  }

  createComment(movieId: number, request: CreateCommentRequest): Observable<CommentResponse> {
    return this.http.post<CommentResponse>(this.commentsUrl(movieId), request, {
      headers: this.authHeaders(),
    }).pipe(
      catchError(this.mapError),
    );
  }

  updateComment(movieId: number, commentId: string, request: UpdateCommentRequest): Observable<CommentResponse> {
    return this.http.patch<CommentResponse>(`${this.commentsUrl(movieId)}/${commentId}`, request, {
      headers: this.authHeaders(),
    }).pipe(
      catchError(this.mapError),
    );
  }

  deleteComment(movieId: number, commentId: string): Observable<void> {
    return this.http.delete<void>(`${this.commentsUrl(movieId)}/${commentId}`, {
      headers: this.authHeaders(),
    }).pipe(
      catchError(this.mapError),
    );
  }

  private commentsUrl(movieId: number): string {
    return `${environment.apiUrl}/movie/${movieId}/comments`;
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

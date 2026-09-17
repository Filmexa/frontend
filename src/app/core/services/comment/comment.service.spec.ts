import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { CommentService } from './comment.service';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../../environments/environment';
import { CommentResponse } from '../../interfaces/comment/CommentResponse';
import { Page } from '../../../shared/interfaces/Page';

describe('CommentService', () => {
  let service: CommentService;
  let httpMock: HttpTestingController;
  let authService: jasmine.SpyObj<AuthService>;

  const comment: CommentResponse = {
    id: 'c1',
    movieId: 101,
    content: 'Great movie!',
    author: { id: 'u1', username: 'alice' },
    createdAt: '2026-09-14T12:00:00',
    updatedAt: '2026-09-14T12:00:00',
  };

  beforeEach(() => {
    authService = jasmine.createSpyObj('AuthService', ['getAccessToken']);
    authService.getAccessToken.and.returnValue('token-123');

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authService },
      ],
    });

    service = TestBed.inject(CommentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load comments for a movie', () => {
    const page: Page<CommentResponse> = {
      content: [comment],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 20,
    };

    service.getComments(101, 0, 20).subscribe((result) => {
      expect(result.content.length).toBe(1);
      expect(result.content[0].content).toBe('Great movie!');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/movies/101/comments?page=0&size=20`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-123');
    req.flush(page);
  });

  it('should create a comment', () => {
    service.createComment(101, { content: 'Great movie!' }).subscribe((result) => {
      expect(result.id).toBe('c1');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/movies/101/comments`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ content: 'Great movie!' });
    req.flush(comment);
  });

  it('should update a comment', () => {
    service.updateComment(101, 'c1', { content: 'Edited' }).subscribe((result) => {
      expect(result.content).toBe('Edited');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/movies/101/comments/c1`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ ...comment, content: 'Edited' });
  });

  it('should delete a comment', () => {
    service.deleteComment(101, 'c1').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/movies/101/comments/c1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});

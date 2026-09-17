import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';

import { CommentsComponent } from './comments.component';
import { CommentService } from '../../../../core/services/comment/comment.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { UserService } from '../../../../core/services/user/user.service';
import { ToastService } from '../../../../shared/services/toast/toast.service';
import { CommentResponse } from '../../../../core/interfaces/comment/CommentResponse';
import { Page } from '../../../../shared/interfaces/Page';
import { UserProfileResponse } from '../../../../core/interfaces/user/UserProfileResponse';

describe('CommentsComponent', () => {
  let component: CommentsComponent;
  let fixture: ComponentFixture<CommentsComponent>;
  let commentService: jasmine.SpyObj<CommentService>;
  let isLoggedIn: ReturnType<typeof signal<boolean>>;

  const comment: CommentResponse = {
    id: 'c1',
    movieId: 101,
    content: 'Great movie!',
    author: { id: 'u1', username: 'alice' },
    createdAt: '2026-09-14T12:00:00',
    updatedAt: '2026-09-14T12:00:00',
  };

  const page: Page<CommentResponse> = {
    content: [comment],
    totalElements: 1,
    totalPages: 1,
    number: 0,
    size: 20,
  };

  beforeEach(async () => {
    isLoggedIn = signal(true);
    commentService = jasmine.createSpyObj('CommentService', [
      'getComments',
      'createComment',
      'updateComment',
      'deleteComment',
    ]);
    commentService.getComments.and.returnValue(of(page));
    commentService.createComment.and.returnValue(of(comment));

    const profile = signal<UserProfileResponse | null>({
      id: 'u1',
      username: 'alice',
      firstName: 'Alice',
      lastName: 'A',
      email: 'alice@example.com',
      phoneNumber: '',
      avatarUrl: '',
      preferredLanguage: 'ENGLISH',
      createdAt: new Date(),
    });

    await TestBed.configureTestingModule({
      imports: [CommentsComponent],
      providers: [
        provideRouter([]),
        { provide: CommentService, useValue: commentService },
        { provide: AuthService, useValue: { isLoggedIn } },
        { provide: UserService, useValue: { profile } },
        { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['success', 'error']) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CommentsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('movieId', 101);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load comments for the movie', () => {
    expect(commentService.getComments).toHaveBeenCalledWith(101, 0, 20);
    expect(component.comments().length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Great movie!');
  });

  it('should post a comment', () => {
    component.form.setValue({ content: 'Great movie!' });
    component.submit();

    expect(commentService.createComment).toHaveBeenCalledWith(101, { content: 'Great movie!' });
    expect(component.comments()[0].content).toBe('Great movie!');
  });

  it('should update an owned comment', () => {
    const updated = { ...comment, content: 'Edited' };
    commentService.updateComment.and.returnValue(of(updated));

    component.startEdit(comment);
    component.editForm.setValue({ content: 'Edited' });
    component.saveEdit(comment);

    expect(commentService.updateComment).toHaveBeenCalledWith(101, 'c1', { content: 'Edited' });
    expect(component.comments()[0].content).toBe('Edited');
    expect(component.editingId()).toBeNull();
  });

  it('should delete an owned comment', () => {
    commentService.deleteComment.and.returnValue(of(void 0));

    component.confirmDelete('c1');

    expect(commentService.deleteComment).toHaveBeenCalledWith(101, 'c1');
    expect(component.comments().length).toBe(0);
  });
});

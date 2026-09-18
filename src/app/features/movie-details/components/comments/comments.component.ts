import { Component, effect, input, signal, untracked } from '@angular/core';
import { SlicePipe, DatePipe, NgClass} from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommentService } from '../../../../core/services/comment/comment.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { UserService } from '../../../../core/services/user/user.service';
import { CommentResponse } from '../../../../core/interfaces/comment/CommentResponse';
import { ErrorResponse } from '../../../../shared/interfaces/ErrorResponse';
import { ToastService } from '../../../../shared/services/toast/toast.service';

@Component({
  selector: 'app-movie-comments',
  imports: [ReactiveFormsModule, RouterLink, DatePipe, SlicePipe, NgClass],
  templateUrl: './comments.component.html',
  styleUrl: './comments.component.css',
})
export class CommentsComponent {
  readonly movieId = input.required<number>();

  readonly comments = signal<CommentResponse[]>([]);
  readonly totalElements = signal(0);
  readonly page = signal(0);
  readonly loading = signal(false);
  readonly posting = signal(false);
  readonly savingId = signal<string | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly editingId = signal<string | null>(null);
  readonly pendingDeleteId = signal<string | null>(null);
  readonly expandedComments = signal<Set<string | number>>(new Set());
  readonly pageSize = 20;
  readonly maxLength = 2000;

  form: FormGroup;
  editForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private commentService: CommentService,
    protected authService: AuthService,
    protected userService: UserService,
    private toastService: ToastService,
  ) {
    this.form = this.fb.group({
      content: ['', [Validators.required, Validators.maxLength(this.maxLength), Validators.pattern(/\S/)]],
    });

    this.editForm = this.fb.group({
      content: ['', [Validators.required, Validators.maxLength(this.maxLength), Validators.pattern(/\S/)]],
    });

    effect(() => {
      const id = this.movieId();
      const loggedIn = this.authService.isLoggedIn();
      untracked(() => this.resetAndLoad(id, loggedIn));
    });
  }
  
  isOwnComment(comment: CommentResponse): boolean {
    return this.userService.profile()?.id === comment.author.id;
  }

  remainingChars(): number {
    return this.maxLength - (this.form.value.content?.length ?? 0);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const content = this.form.value.content.trim();
    if (!content) {
      this.form.controls['content'].setErrors({ required: true });
      return;
    }

    this.posting.set(true);
    this.commentService.createComment(this.movieId(), { content }).subscribe({
      next: (created) => {
        this.posting.set(false);
        this.form.reset({ content: '' });
        this.comments.update((comments) => [created, ...comments]);
        this.totalElements.update((total) => total + 1);
        this.toastService.success($localize`:@@toast.comments.postSuccess:Comment posted.`);
      },
      error: (error: ErrorResponse) => {
        this.posting.set(false);
        this.toastService.error(error.message ?? $localize`:@@toast.comments.postError:Could not post comment.`);
      },
    });
  }

  startEdit(comment: CommentResponse): void {
    this.editingId.set(comment.id);
    this.pendingDeleteId.set(null);
    this.editForm.reset({ content: comment.content });
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  saveEdit(comment: CommentResponse): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const content = this.editForm.value.content.trim();
    if (!content) {
      this.editForm.controls['content'].setErrors({ required: true });
      return;
    }

    this.savingId.set(comment.id);
    this.commentService.updateComment(this.movieId(), comment.id, { content }).subscribe({
      next: (updated) => {
        this.savingId.set(null);
        this.editingId.set(null);
        this.comments.update((comments) =>
          comments.map((item) => (item.id === updated.id ? updated : item)),
        );
        this.toastService.success($localize`:@@toast.comments.updateSuccess:Comment updated.`);
      },
      error: (error: ErrorResponse) => {
        this.savingId.set(null);
        this.toastService.error(error.message ?? $localize`:@@toast.comments.updateError:Could not update comment.`);
      },
    });
  }

  requestDelete(commentId: string): void {
    this.pendingDeleteId.set(commentId);
    this.editingId.set(null);
  }

  cancelDelete(): void {
    this.pendingDeleteId.set(null);
  }

  confirmDelete(commentId: string): void {
    this.deletingId.set(commentId);
    this.commentService.deleteComment(this.movieId(), commentId).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.pendingDeleteId.set(null);
        this.comments.update((comments) => comments.filter((item) => item.id !== commentId));
        this.totalElements.update((total) => Math.max(0, total - 1));
        this.toastService.success($localize`:@@toast.comments.deleteSuccess:Comment deleted.`);
      },
      error: (error: ErrorResponse) => {
        this.deletingId.set(null);
        this.toastService.error(error.message ?? $localize`:@@toast.comments.deleteError:Could not delete comment.`);
      },
    });
  }

  isExpanded(id: string | number): boolean {
    return this.expandedComments().has(id);
  }

  toggleExpand(id: string | number): void {
    this.expandedComments.update(set => {
      const newSet = new Set(set);
      if (newSet.has(id)) {
        newSet.delete(id); // Collapse if already expanded
      } else {
        newSet.add(id);    // Expand if collapsed
      }
      return newSet;
    });
  }
  loadMore(): void {
    this.loadPage(this.page() + 1, false);
  }

  hasMore(): boolean {
    return this.comments().length < this.totalElements();
  }

  private resetAndLoad(movieId: number, loggedIn: boolean): void {
    this.comments.set([]);
    this.totalElements.set(0);
    this.page.set(0);
    this.editingId.set(null);
    this.pendingDeleteId.set(null);
    this.form.reset({ content: '' });

    if (!loggedIn || !movieId) {
      this.loading.set(false);
      return;
    }

    this.loadPage(0, true);
  }

  private loadPage(page: number, replace: boolean): void {
    this.loading.set(true);
    this.commentService.getComments(this.movieId(), page, this.pageSize).subscribe({
      next: (result) => {
        this.loading.set(false);
        this.page.set(result.number);
        this.totalElements.set(result.totalElements);
        this.comments.update((comments) => replace ? result.content : [...comments, ...result.content]);
      },
      error: (error: ErrorResponse) => {
        this.loading.set(false);
        this.toastService.error(error.message ?? $localize`:@@toast.comments.loadError:Failed to load comments.`);
      },
    });
  }
}

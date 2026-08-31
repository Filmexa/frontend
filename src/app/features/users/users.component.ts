import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { UserService } from '../../core/services/user/user.service';
import { ToastService } from '../../shared/services/toast/toast.service';
import { UserInfosResponse } from '../../core/interfaces/user/UserInfosResponse';
import { ErrorResponse } from '../../shared/interfaces/ErrorResponse';

@Component({
  selector: 'app-users',
  imports: [],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit, OnDestroy {
  user = signal<UserInfosResponse | null>(null);
  avatarUrl = signal<string | null>(null);
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private toastService: ToastService,
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params: ParamMap) => {
      const userId = params.get('id');
      if (userId) {
        this.loadUser(userId);
      }
    });
  }

  ngOnDestroy(): void {
    this.setAvatar(null);
  }

  loadUser(userId: string): void {
    this.isLoading = true;
    this.user.set(null);
    this.setAvatar(null);

    this.userService.getUserProfile(userId).subscribe({
      next: (profile) => {
        this.isLoading = false;
        this.user.set(profile);
        if (profile.avatarUrl) {
          this.userService.getUserAvatar(userId).subscribe((blob) => {
            if (blob.size > 0) {
              this.setAvatar(blob);
            }
          });
        }
      },
      error: (err: ErrorResponse) => {
        this.isLoading = false;
        this.toastService.error(err.message ?? $localize`:@@users.profileLoadError:Failed to load user profile.`);
      },
    });
  }

  private setAvatar(blob: Blob | null): void {
    const current = this.avatarUrl();
    if (current) {
      URL.revokeObjectURL(current);
    }
    this.avatarUrl.set(blob ? URL.createObjectURL(blob) : null);
  }
}

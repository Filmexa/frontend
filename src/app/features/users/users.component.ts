import { Component, computed, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user/user.service';
import { ToastService } from '../../shared/services/toast/toast.service';
import { UserInfosSimpleResponse } from '../../core/interfaces/user/UserInfosSimpleResponse';
import { UserInfosResponse } from '../../core/interfaces/user/UserInfosResponse';
import { ErrorResponse } from '../../shared/interfaces/ErrorResponse';

@Component({
  selector: 'app-users',
  imports: [FormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {
  users = signal<UserInfosSimpleResponse[]>([]);
  searchQuery = signal('');
  isLoading = false;

  page = signal(0);
  totalPages = signal(0);
  readonly pageSize = 20;

  selectedUser = signal<UserInfosResponse | null>(null);
  selectedUserAvatarUrl = signal<string | null>(null);
  isLoadingProfile = false;

  filteredUsers = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) {
      return this.users();
    }
    return this.users().filter((user) => user.username.toLowerCase().includes(query));
  });

  constructor(
    private userService: UserService,
    private toastService: ToastService,
  ) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getAllProfiles(this.page(), this.pageSize).subscribe({
      next: (result) => {
        this.isLoading = false;
        this.users.set(result.content);
        this.totalPages.set(result.totalPages);
      },
      error: (err: ErrorResponse) => {
        this.isLoading = false;
        this.toastService.error(err.message ?? $localize`:@@users.loadError:Failed to load users.`);
      },
    });
  }

  onPreviousPage(): void {
    if (this.page() === 0) {
      return;
    }
    this.page.update((page) => page - 1);
    this.loadUsers();
  }

  onNextPage(): void {
    if (this.page() + 1 >= this.totalPages()) {
      return;
    }
    this.page.update((page) => page + 1);
    this.loadUsers();
  }

  onSelectUser(userId: string): void {
    this.isLoadingProfile = true;
    this.selectedUser.set(null);
    this.setSelectedUserAvatar(null);

    this.userService.getUserProfile(userId).subscribe({
      next: (profile) => {
        this.isLoadingProfile = false;
        this.selectedUser.set(profile);
        if (profile.avatarUrl) {
          this.userService.getUserAvatar(userId).subscribe((blob) => {
            if (blob.size > 0) {
              this.setSelectedUserAvatar(blob);
            }
          });
        }
      },
      error: (err: ErrorResponse) => {
        this.isLoadingProfile = false;
        this.toastService.error(err.message ?? $localize`:@@users.profileLoadError:Failed to load user profile.`);
      },
    });
  }

  closeProfile(): void {
    this.selectedUser.set(null);
    this.setSelectedUserAvatar(null);
  }

  private setSelectedUserAvatar(blob: Blob | null): void {
    const current = this.selectedUserAvatarUrl();
    if (current) {
      URL.revokeObjectURL(current);
    }
    this.selectedUserAvatarUrl.set(blob ? URL.createObjectURL(blob) : null);
  }
}

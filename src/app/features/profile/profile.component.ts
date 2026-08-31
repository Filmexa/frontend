import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../core/services/user/user.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { LanguageService } from '../../core/services/language/language.service';
import { ErrorResponse } from '../../shared/interfaces/ErrorResponse';
import { ToastService } from '../../shared/services/toast/toast.service';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  languageForm: FormGroup;
  emailForm: FormGroup;
  confirmEmailForm: FormGroup;
  passwordForm: FormGroup;

  isSubmittingProfile = false;
  isSubmittingLanguage = false;
  isSubmittingEmail = false;
  isSubmittingConfirmEmail = false;
  isUploadingAvatar = false;
  isSubmittingPassword = false;
  showPassword = false;

  readonly showPasswordLabel = $localize`:@@login.showPassword:Show password`;
  readonly hidePasswordLabel = $localize`:@@login.hidePassword:Hide password`;

  emailChangeRequested = false;

  constructor(
    protected userService: UserService,
    private authService: AuthService,
    private languageService: LanguageService,
    private fb: FormBuilder,
    private toastService: ToastService,
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phoneNumber: ['', Validators.required],
    });

    this.languageForm = this.fb.group({
      preferredLanguage: ['', Validators.required],
    });

    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
    });

    this.confirmEmailForm = this.fb.group({
      code: ['', Validators.required],
    });

    this.passwordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)]],
    });
  }

  ngOnInit(): void {
    this.userService.getAvatar().subscribe();
    this.userService.getProfile().subscribe((profile) => {
      this.profileForm.patchValue({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phoneNumber: profile.phoneNumber,
      });
      this.languageForm.patchValue({
        preferredLanguage: profile.preferredLanguage,
      });
    });
  }

  onUpdateProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSubmittingProfile = true;

    this.userService.updateProfile(this.profileForm.value).subscribe({
      next: () => {
        this.isSubmittingProfile = false;
        this.toastService.success($localize`:@@toast.profile.updateSuccess:Profile updated successfully.`);
      },
      error: (err: ErrorResponse) => {
        this.isSubmittingProfile = false;
        this.toastService.error(err.message ?? $localize`:@@toast.profile.updateError:Failed to update profile.`);
      },
    });
  }

  onChangeLanguage(): void {
    if (this.languageForm.invalid) {
      this.languageForm.markAllAsTouched();
      return;
    }

    this.isSubmittingLanguage = true;

    const preferredLanguage = this.languageForm.value.preferredLanguage;

    this.userService.changePreferredLanguage(this.languageForm.value).subscribe({
      next: () => {
        this.isSubmittingLanguage = false;
        this.toastService.success($localize`:@@toast.profile.languageSuccess:Preferred language updated.`);
        this.languageService.redirectToPreferredLanguage(preferredLanguage);
      },
      error: (err: ErrorResponse) => {
        this.isSubmittingLanguage = false;
        this.toastService.error(err.message ?? $localize`:@@toast.profile.languageError:Failed to update preferred language.`);
      },
    });
  }

  onChangeEmail(): void {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.isSubmittingEmail = true;

    this.userService.changeEmail({ newEmail: this.emailForm.value.email }).subscribe({
      next: () => {
        this.isSubmittingEmail = false;
        this.emailChangeRequested = true;
        this.toastService.success($localize`:@@toast.profile.emailChangeRequested:Confirmation code sent to your new email.`);
      },
      error: (err: ErrorResponse) => {
        this.isSubmittingEmail = false;
        this.toastService.error(err.message ?? $localize`:@@toast.profile.emailChangeRequestError:Failed to request email change.`);
      },
    });
  }

  onConfirmEmailChange(): void {
    if (this.confirmEmailForm.invalid) {
      this.confirmEmailForm.markAllAsTouched();
      return;
    }

    this.isSubmittingConfirmEmail = true;

    this.userService.confirmEmailChange(this.confirmEmailForm.value).subscribe({
      next: () => {
        this.isSubmittingConfirmEmail = false;
        this.emailChangeRequested = false;
        this.emailForm.reset();
        this.confirmEmailForm.reset();
        this.toastService.success($localize`:@@toast.profile.emailChangeSuccess:Email updated successfully.`);
      },
      error: (err: ErrorResponse) => {
        this.isSubmittingConfirmEmail = false;
        this.toastService.error(err.message ?? $localize`:@@toast.profile.emailChangeError:Failed to confirm email change.`);
      },
    });
  }

  onSetPassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isSubmittingPassword = true;

    this.authService.setPassword(this.passwordForm.value).subscribe({
      next: () => {
        this.isSubmittingPassword = false;
        this.passwordForm.reset();
        this.toastService.success($localize`:@@toast.profile.passwordSetSuccess:Password set successfully. You can now log in with your username and password.`);
      },
      error: (err: ErrorResponse) => {
        this.isSubmittingPassword = false;
        this.toastService.error(err.message ?? $localize`:@@toast.profile.passwordSetError:Failed to set password.`);
      },
    });
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.isUploadingAvatar = true;

    this.userService.updateAvatar(file).subscribe({
      next: () => {
        this.isUploadingAvatar = false;
        this.toastService.success($localize`:@@toast.profile.pictureSuccess:Profile picture updated.`);
      },
      error: (err: ErrorResponse) => {
        this.isUploadingAvatar = false;
        this.toastService.error(err.message ?? $localize`:@@toast.profile.pictureError:Failed to update profile picture.`);
      },
    });

    input.value = '';
  }
}

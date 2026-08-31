import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
import { ErrorResponse } from '../../../shared/interfaces/ErrorResponse';
import { ToastService } from '../../../shared/services/toast/toast.service';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit {
  form: FormGroup;
  isSubmitting: boolean = false;
  submitted: boolean = false;
  showPassword: boolean = false;

  readonly showPasswordLabel = $localize`:@@login.showPassword:Show password`;
  readonly hidePasswordLabel = $localize`:@@login.hidePassword:Hide password`;

  isResending: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
      code: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)]],
    });
  }

  ngOnInit(): void {
    const email = this.route.snapshot.queryParamMap.get('email');
    if (email) {
      this.form.patchValue({ email });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    this.authService.resetPassword(this.form.value).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.submitted = true;
        this.toastService.success($localize`:@@toast.resetPassword.success:Password reset successfully. You can now log in with your new password.`);
        this.router.navigate(['/login']);
      },
      error: (err: ErrorResponse) => {
        this.isSubmitting = false;
        this.toastService.error(err.message ?? $localize`:@@toast.resetPassword.error:Could not reset password. Check your code and try again.`);
      },
    });
  }

  onResendCode(): void {
    const email = this.form.controls['email'].value;
    if (this.form.controls['email'].invalid) {
      this.form.controls['email'].markAsTouched();
      return;
    }

    this.isResending = true;

    this.authService.resendPasswordReset({ email }).subscribe({
      next: () => {
        this.isResending = false;
        this.toastService.success($localize`:@@toast.resendCode.success:A new code has been sent to your email.`);
      },
      error: (err: ErrorResponse) => {
        this.isResending = false;
        this.toastService.error(err.message ?? $localize`:@@toast.resendCode.error:Could not resend the code. Please try again.`);
      },
    });
  }
}

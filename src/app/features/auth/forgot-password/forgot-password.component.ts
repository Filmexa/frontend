import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
import { ErrorResponse } from '../../../shared/interfaces/ErrorResponse';
import { ToastService } from '../../../shared/services/toast/toast.service';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  form: FormGroup;
  isSubmitting = false;
  submitted = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    this.authService.forgotPassword(this.form.value).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.goToResetPassword();
        this.toastService.success($localize`:@@toast.forgotPassword.success:Reset password email sent successfully.`);
      },
      error: (err: ErrorResponse) => {
        this.isSubmitting = false;
        this.toastService.error(err.message ?? $localize`:@@toast.forgotPassword.error:Could not send reset password email.`);
      },
    });
  }

  private goToResetPassword(): void {
    this.isSubmitting = false;
    this.submitted = true;
    this.router.navigate(['/reset-password'], {
      queryParams: { email: this.form.value.email },
    });
  }
}

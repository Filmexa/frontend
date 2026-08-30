import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
import { ErrorResponse } from '../../../shared/interfaces/ErrorResponse';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit {
  form: FormGroup;
  errorMessage = '';
  isSubmitting: boolean = false;
  submitted: boolean = false;
  showPassword: boolean = false;


  isResending: boolean = false;
  resendMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
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

    this.errorMessage = '';
    this.isSubmitting = true;

    this.authService.resetPassword(this.form.value).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.submitted = true;
        this.router.navigate(['/login']);
      },
      error: (err: ErrorResponse) => {
        this.isSubmitting = false;
        this.errorMessage = err.message ?? 'Could not reset password. Check your code and try again.';
      },
    });
  }

  onResendCode(): void {
    const email = this.form.controls['email'].value;
    if (this.form.controls['email'].invalid) {
      this.form.controls['email'].markAsTouched();
      return;
    }

    this.resendMessage = '';
    this.isResending = true;

    this.authService.resendPasswordReset({ email }).subscribe({
      next: () => {
        this.isResending = false;
        this.resendMessage = 'A new code has been sent to your email.';
      },
      error: (err: ErrorResponse) => {
        this.isResending = false;
        this.errorMessage = err.message ?? 'Could not resend the code. Please try again.';
      },
    });
  }
}
